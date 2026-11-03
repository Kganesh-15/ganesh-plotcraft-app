const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

app.use(express.json({ limit: '15mb' })); // large enough for file uploads
app.use(cors());

// --- Database Helper Functions (JSON File Handling) ---
const DB_FILE = path.join(__dirname, 'db.json');

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ stories: [] }, null, 2));
}

const readDb = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Database read error:', err);
    return { stories: [] };
  }
};

const writeDb = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Database write error:', err);
  }
};

// --- AI provider chain: tries FREE providers first and falls back automatically ---
// When one provider is out of credits / rate-limited (402, 429, ...), the next one is used.
// Order can be changed with AI_PROVIDERS in .env, e.g. AI_PROVIDERS=ollama,gemini

// OpenRouter changes which models are free all the time, so we ask it for the current list.
let freeModelCache = { time: 0, ids: [] };

// Models that answered "not for this kind of app" are skipped from then on.
const blockedModels = new Set(['thinkingmachines/inkling-small:free']);

const fetchFreeModelIds = async () => {
  if (process.env.OPENROUTER_FREE_MODEL) {
    return process.env.OPENROUTER_FREE_MODEL.split(',').map(m => m.trim()).filter(Boolean);
  }
  if (freeModelCache.ids.length && Date.now() - freeModelCache.time < 60 * 60 * 1000) {
    return freeModelCache.ids;
  }
  try {
    const r = await fetch('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(15000) });
    const json = await r.json();
    const preferred = /(llama|gemma|qwen|mistral|gpt-oss|deepseek|glm)/i;
    const ids = (json.data || [])
      .filter(m =>
        m.id.endsWith(':free') &&
        Number(m.pricing?.prompt) === 0 &&
        Number(m.pricing?.completion) === 0 &&
        !/(coder|embed|guard|vision|image)/i.test(m.id) &&
        (m.architecture?.output_modalities || ['text']).includes('text')
      )
      .sort((x, y) =>
        Number(preferred.test(y.id)) - Number(preferred.test(x.id)) ||
        (y.context_length || 0) - (x.context_length || 0)
      )
      .map(m => m.id)
      .slice(0, 10);
    if (ids.length) freeModelCache = { time: Date.now(), ids };
    return ids;
  } catch (err) {
    console.warn('[AI] could not load OpenRouter free model list:', err.message);
    return freeModelCache.ids;
  }
};

// OpenRouter's own free router (openrouter/free) picks a working free model at random for each call,
// so asking it a few times in a row usually lands on a model that works. Specific models come after it.
const getOpenRouterFreeModels = async () => {
  const specific = (await fetchFreeModelIds()).filter(id => !blockedModels.has(id));
  if (process.env.OPENROUTER_FREE_MODEL) return specific;
  return ['openrouter/free', 'openrouter/free', 'openrouter/free', ...specific];
};

const PROVIDERS = {
  gemini: {
    enabled: () => !!process.env.GEMINI_API_KEY,
    url: () => 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    key: () => process.env.GEMINI_API_KEY,
    models: async () => [process.env.GEMINI_MODEL || 'gemini-2.5-flash'],
    vision: true
  },
  groq: {
    enabled: () => !!process.env.GROQ_API_KEY,
    url: () => 'https://api.groq.com/openai/v1/chat/completions',
    key: () => process.env.GROQ_API_KEY,
    models: async () => [process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'],
    vision: false
  },
  openrouter_free: {
    enabled: () => !!process.env.OPENROUTER_API_KEY,
    url: () => 'https://openrouter.ai/api/v1/chat/completions',
    key: () => process.env.OPENROUTER_API_KEY,
    models: getOpenRouterFreeModels,
    maxModels: 8,
    vision: false
  },
  // Runs on your own computer: no credits, no limits. Install Ollama and set OLLAMA_MODEL.
  ollama: {
    enabled: () => !!process.env.OLLAMA_MODEL,
    url: () => `${process.env.OLLAMA_URL || 'http://localhost:11434'}/v1/chat/completions`,
    key: () => null,
    models: async () => [process.env.OLLAMA_MODEL],
    vision: false
  },
  // Pollinations now answers 402 (payment required) without a key, so it is opt-in only.
  pollinations: {
    enabled: () => process.env.ENABLE_POLLINATIONS === 'true' || !!process.env.POLLINATIONS_API_KEY,
    url: () => 'https://text.pollinations.ai/openai',
    key: () => process.env.POLLINATIONS_API_KEY || null,
    models: async () => [process.env.POLLINATIONS_MODEL || 'openai'],
    vision: false
  },
  // Paid. Only used if USE_PAID_MODEL=true, and always last.
  openrouter_paid: {
    enabled: () => !!process.env.OPENROUTER_API_KEY && process.env.USE_PAID_MODEL === 'true',
    url: () => 'https://openrouter.ai/api/v1/chat/completions',
    key: () => process.env.OPENROUTER_API_KEY,
    models: async () => [process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'],
    vision: true
  }
};

const PROVIDER_ORDER = (process.env.AI_PROVIDERS || 'gemini,groq,ollama,openrouter_free,pollinations,openrouter_paid')
  .split(',')
  .map(p => p.trim())
  .filter(Boolean);

const FIX_HINT =
  ' Quickest fix: add a free GEMINI_API_KEY (aistudio.google.com/apikey) or GROQ_API_KEY (console.groq.com/keys) to the .env file in your backend folder, then restart the server.';

// rotate: start with a different provider each time (used so a long story is spread over 2-3 free APIs)
// returnMeta: also return which provider answered and why it stopped (finish_reason)
const chatCompletion = async (messages, { maxTokens = 1500, needsVision = false, rotate = 0, returnMeta = false } = {}) => {
  const failures = [];
  let tried = 0;

  let order = PROVIDER_ORDER;
  if (rotate) {
    const usable = PROVIDER_ORDER.filter(n => PROVIDERS[n] && PROVIDERS[n].enabled() && n !== 'openrouter_paid');
    const paid = PROVIDER_ORDER.filter(n => n === 'openrouter_paid');
    const k = usable.length ? rotate % usable.length : 0;
    order = [...usable.slice(k), ...usable.slice(0, k), ...paid];
  }

  for (const name of order) {
    const provider = PROVIDERS[name];
    if (!provider || !provider.enabled()) continue;
    if (needsVision && !provider.vision) continue;

    let models = [];
    try {
      models = (await provider.models()).slice(0, provider.maxModels || 4);
    } catch (err) {
      failures.push(`${name}: ${err.message}`);
    }

    for (const model of models) {
      tried++;
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (provider.key()) headers['Authorization'] = `Bearer ${provider.key()}`;

        const response = await fetch(provider.url(), {
          method: 'POST',
          headers,
          body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
          signal: AbortSignal.timeout(90000)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const msg = errData?.error?.message || errData?.[0]?.error?.message || `HTTP ${response.status}`;
          throw new Error(msg);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error('Empty response');

        console.log(`[AI] answered by ${name} (${model})`);
        if (returnMeta) {
          return { text, finishReason: data.choices?.[0]?.finish_reason || '', provider: name, model };
        }
        return text;
      } catch (err) {
        if (/only available on|agentic|not a valid model|no endpoints found/i.test(err.message) && model !== 'openrouter/free') {
          blockedModels.add(model); // do not try this model again
        }
        console.warn(`[AI] ${name} / ${model} failed: ${err.message}`);
        failures.push(`${name}: ${err.message}`);
      }
    }
  }

  if (tried === 0) {
    throw new Error(
      (needsVision
        ? 'No image-capable AI provider is set up.'
        : 'No AI provider is set up.') + FIX_HINT
    );
  }
  throw new Error(
    'All free AI providers failed or hit their limit.' + FIX_HINT + ' Details: ' + failures.slice(-3).join(' | ')
  );
};

// Small in-memory cache so the same question never uses quota twice (1 hour)
const replyCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;
const cacheGet = (key) => {
  const hit = replyCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.time > CACHE_TTL_MS) {
    replyCache.delete(key);
    return null;
  }
  return hit.value;
};
const cacheSet = (key, value) => {
  if (replyCache.size >= 200) replyCache.delete(replyCache.keys().next().value);
  replyCache.set(key, { value, time: Date.now() });
};

// If the request carries a valid login token, stories are saved under that account
const resolveUserId = (req) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return null;
  const db = readDb();
  const session = (db.sessions || []).find(x => x.token === token);
  return session ? session.userId : null;
};

// =====================================================================
//  LONG STORIES: any number of pages, written one page at a time.
//  - a plan (outline) is made first, so the story has one clear arc
//  - every page is written with the plan + what already happened, so nothing repeats or is skipped
//  - pages are spread over 2-3 AI providers (rotation); if one fails the next one takes over
//  - cut-off pages are finished automatically
// =====================================================================
const storyJobs = new Map();
const MAX_PAGES = 20;
const RETRY_MS = Number(process.env.STORY_RETRY_MS || 4000);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const clampInt = (v, min, max, dflt) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
};
const countWords = (t) => (String(t).match(/\S+/g) || []).length;

const STORY_ARC = [
  'Introduce the hero, the place and everyday life',
  'Show what the hero wants or needs',
  'Something happens that starts the adventure or problem',
  'First attempt and a small setback',
  'Meet a helper or learn something important',
  'Things get harder and a real difficulty appears',
  'A low moment where the hero doubts themselves',
  'A new idea or a brave decision',
  'The turning point',
  'The big challenge',
  'The problem is solved',
  'A quiet ending: what changed and the lesson'
];
const fallbackBeats = (n) =>
  Array.from({ length: n }, (_, i) => {
    if (n === 1) return { title: 'The Story', beat: 'The whole story from beginning to end, with a clear lesson.' };
    const idx = Math.min(STORY_ARC.length - 1, Math.round((i / (n - 1)) * (STORY_ARC.length - 1)));
    return { title: `Part ${i + 1}`, beat: STORY_ARC[idx] };
  });

const STORY_SYSTEM = `You are an award-winning author who writes realistic, lifelike stories.
Style rules:
- Give concrete, believable detail about the place (what it looks, sounds and smells like), real emotions, natural dialogue and logical cause and effect.
- Even in fantasy, space or animal stories keep the world consistent and let characters behave like real beings.
- Show events instead of summarising them. Keep one narrator voice and one tense from page to page. Keep names, places and facts consistent.
- Write in the same language as the story title (English unless the title is in another language).
- Never write headings, page numbers or notes to the reader.`;

const parseJsonLoose = (text) => {
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a === -1 || b <= a) throw new Error('no JSON');
  return JSON.parse(text.slice(a, b + 1));
};

const planStory = async (job) => {
  const prompt =
    `Plan a story that will be told over exactly ${job.total} pages.\n` +
    `Title/topic: "${job.title}"\nHero: "${job.hero}"\nGenre: ${job.genre}\n` +
    (job.place ? `Place/setting: ${job.place}\n` : '') +
    `Return ONLY valid JSON (no markdown) in this shape:\n` +
    `{"setting":"2-3 sentences about the real-feeling place, time and atmosphere","characters":[{"name":"","role":"","trait":""}],"pages":[{"title":"short page title","beat":"2-3 sentences: what happens on this page"}]}\n` +
    `Rules: exactly ${job.total} items in "pages"; one clear arc (beginning, rising trouble, turning point, ending); every page moves the plot forward; no two pages repeat each other; the last page ends the story. Keep it realistic: believable people and reasons, concrete places. Write all values in the language of the title.`;

  try {
    const { text } = await chatCompletion(
      [{ role: 'system', content: 'You are a careful story planner. Output only JSON.' }, { role: 'user', content: prompt }],
      { maxTokens: Math.min(4000, 600 + job.total * 220), returnMeta: true }
    );
    const plan = parseJsonLoose(text);
    const fb = fallbackBeats(job.total);
    const pages = (Array.isArray(plan.pages) ? plan.pages : []).slice(0, job.total).map((p, i) => ({
      title: String(p.title || fb[i].title).slice(0, 80),
      beat: String(p.beat || fb[i].beat).slice(0, 500)
    }));
    while (pages.length < job.total) pages.push(fb[pages.length]);
    return {
      setting: String(plan.setting || '').slice(0, 600),
      characters: (Array.isArray(plan.characters) ? plan.characters : []).slice(0, 8).map(c => `${c.name || ''} (${c.role || ''}${c.trait ? ', ' + c.trait : ''})`),
      pages
    };
  } catch (err) {
    console.warn('[story] planning failed, using a standard story arc:', err.message);
    return { setting: job.place || '', characters: [], pages: fallbackBeats(job.total) };
  }
};

const isCutOff = (finishReason) => /length|max_tokens/i.test(finishReason || '');

const splitRecap = (raw) => {
  const idx = raw.search(/\n\s*\**RECAP\**\s*:/i);
  if (idx === -1) return { body: raw.trim(), recap: '' };
  return { body: raw.slice(0, idx).trim(), recap: raw.slice(idx).replace(/^\s*\**RECAP\**\s*:\s*/i, '').replace(/\*+/g, '').trim() };
};

const writeOnePage = async (job, i) => {
  const plan = job.outline;
  const beat = plan.pages[i];
  const W = job.words;
  const isLast = i === job.total - 1;
  const prev = job.pages[i - 1] || '';

  const user =
    `STORY: "${job.title}" | Hero: ${job.hero} | Genre: ${job.genre}${job.place ? ` | Place: ${job.place}` : ''}\n` +
    (plan.setting ? `SETTING: ${plan.setting}\n` : '') +
    (plan.characters.length ? `CHARACTERS: ${plan.characters.join('; ')}\n` : '') +
    `\nFULL PLAN:\n${plan.pages.map((p, k) => `${k + 1}. ${p.title}: ${p.beat}`).join('\n')}\n` +
    (job.recaps.length ? `\nALREADY WRITTEN (one line per finished page):\n${job.recaps.map((r, k) => `${k + 1}. ${r}`).join('\n')}\n` : '') +
    (prev
      ? `\nEND OF THE PREVIOUS PAGE (continue smoothly from here, never repeat it):\n"""${prev.slice(-1100)}"""\n`
      : `\nThis is the first page: open with a strong, concrete scene.\n`) +
    `\nNOW WRITE PAGE ${i + 1} OF ${job.total}: "${beat.title}"\nWhat happens on this page: ${beat.beat}\n` +
    `Length: about ${W} words (never fewer than ${Math.round(W * 0.85)}). Write full paragraphs, with dialogue where it feels natural.\n` +
    (isLast
      ? `This is the FINAL page: resolve everything and give a satisfying ending. Show the lesson through events.\n`
      : `This is NOT the last page: do not end or wrap up the story. End on a moment that leads into the next page.\n`) +
    `Output ONLY the page text. Then, on a new last line, write: RECAP: <one sentence saying what happened on this page>`;

  const messages = [{ role: 'system', content: STORY_SYSTEM }, { role: 'user', content: user }];
  const maxTokens = Math.min(4000, W * 5 + 500);

  let { text, finishReason, provider } = await chatCompletion(messages, { maxTokens, returnMeta: true, rotate: i });

  // finish pages that were cut off by the token limit
  for (let extra = 0; extra < 2 && isCutOff(finishReason); extra++) {
    const more = await chatCompletion(
      [...messages, { role: 'assistant', content: text }, { role: 'user', content: 'Continue exactly where you stopped and finish this page. Do not repeat anything. Then end with the RECAP: line.' }],
      { maxTokens, returnMeta: true, rotate: i }
    );
    text += (/\s$/.test(text) || /^\s/.test(more.text) ? '' : ' ') + more.text;
    finishReason = more.finishReason;
  }

  let { body, recap } = splitRecap(text);

  // page far too short: ask once for more of the same scene
  if (countWords(body) < W * 0.55) {
    try {
      const more = await chatCompletion(
        [...messages, { role: 'assistant', content: body }, { role: 'user', content: `This page is too short. Continue the same scene with about ${Math.round(W - countWords(body))} more words of action, detail and dialogue. Do not repeat anything and do not end the story unless this is the final page. Output only the new text.` }],
        { maxTokens, returnMeta: true, rotate: i + 1 }
      );
      body += '\n\n' + splitRecap(more.text).body;
    } catch (err) {
      console.warn('[story] could not extend a short page:', err.message);
    }
  }

  body = body.replace(/^\s*(page|chapter)\s*\d+\s*[:.\-]?\s*\n+/i, '').trim();
  if (!recap) recap = body.replace(/\s+/g, ' ').slice(0, 160);
  return { text: body, recap, provider };
};

const runStoryJob = async (job) => {
  job.status = 'running';
  try {
    if (!job.outline) {
      job.message = 'Planning your story...';
      job.outline = await planStory(job);
    }

    for (let i = job.pages.length; i < job.total; i++) {
      job.message = `Writing page ${i + 1} of ${job.total}...`;
      let result = null;
      let lastErr = null;
      for (let attempt = 1; attempt <= 3 && !result; attempt++) {
        try {
          result = await writeOnePage(job, i);
        } catch (err) {
          lastErr = err;
          console.warn(`[story] page ${i + 1} attempt ${attempt} failed: ${err.message}`);
          if (attempt < 3) {
            job.message = `Page ${i + 1}: engines are busy, trying again...`;
            await sleep(RETRY_MS * attempt);
          }
        }
      }
      if (!result) throw lastErr || new Error('Could not write this page.');

      job.pages.push(result.text);
      job.recaps.push(result.recap);
      job.providers.push(result.provider);
    }

    // finished: keep it in the database
    const db = readDb();
    db.stories = db.stories || [];
    if (!job.storyId) {
      job.storyId = Date.now();
      db.stories.push({
        id: job.storyId,
        userId: job.userId || 'guest',
        title: job.title,
        heroName: job.hero,
        genre: job.genre,
        place: job.place,
        pages: job.pages,
        storyText: job.pages.join('\n\n'),
        createdAt: new Date().toISOString()
      });
      writeDb(db);
    }
    job.status = 'done';
    job.message = 'Done';
  } catch (err) {
    console.error('[story] stopped:', err.message);
    job.status = 'error';
    job.message =
      `Stopped after page ${job.pages.length} of ${job.total}: all AI engines are busy or out of free quota. ` +
      'Your finished pages are kept. Press "Continue writing" in a minute.';
  }
};

app.post('/api/stories/start', (req, res) => {
  const title = (req.body.storyTitle || '').toString().trim().slice(0, 200);
  if (!title) return res.status(400).json({ success: false, message: 'Please enter a story title.' });

  const running = [...storyJobs.values()].filter(j => j.status === 'running').length;
  if (running >= 3) {
    return res.status(429).json({ success: false, message: 'Several stories are being written right now. Please wait a moment.' });
  }

  const job = {
    id: crypto.randomUUID(),
    status: 'running',
    message: 'Starting...',
    title,
    hero: (req.body.heroName || 'Hero').toString().trim().slice(0, 60) || 'Hero',
    genre: (req.body.genre || 'Moral Story').toString().slice(0, 120),
    place: (req.body.place || '').toString().trim().slice(0, 120),
    total: clampInt(req.body.pages, 1, MAX_PAGES, 1),
    words: clampInt(req.body.wordsPerPage, 150, 450, 300),
    userId: resolveUserId(req),
    outline: null,
    pages: [],
    recaps: [],
    providers: [],
    storyId: null,
    createdAt: Date.now()
  };
  storyJobs.set(job.id, job);
  runStoryJob(job); // runs in the background
  res.status(202).json({ success: true, jobId: job.id, total: job.total });
});

app.get('/api/stories/status/:id', (req, res) => {
  const job = storyJobs.get(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Story job not found. Please generate again.' });
  const from = clampInt(req.query.from, 0, 1000, 0);
  res.json({
    success: true,
    status: job.status,
    message: job.message,
    total: job.total,
    done: job.pages.length,
    from,
    pages: job.pages.slice(from),
    storyId: job.storyId,
    providers: [...new Set(job.providers)]
  });
});

app.post('/api/stories/continue/:id', (req, res) => {
  const job = storyJobs.get(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Story job not found. Please generate again.' });
  if (job.status === 'error') {
    job.message = 'Continuing...';
    runStoryJob(job);
  }
  res.json({ success: true, status: job.status });
});

// forget old story jobs after 3 hours (finished stories stay in the database)
setInterval(() => {
  for (const [id, job] of storyJobs) {
    if (Date.now() - job.createdAt > 3 * 60 * 60 * 1000) storyJobs.delete(id);
  }
}, 15 * 60 * 1000);

// --- API Endpoint: Generate Story using OpenRouter API ---
app.post('/api/stories/generate', async (req, res) => {
  try {
    // Frontend nunchi vache properties ni ikkada exact ga destructure chestunnam
    const { userId, storyTitle, heroName, genre } = req.body;

    const finalTitle = storyTitle || 'Adventure';
    const finalHero = heroName || 'Hero';
    const finalGenre = genre || 'Fantasy';

    const promptText = `Write a short, engaging story. Title: "${finalTitle}". Character: "${finalHero}". Genre: "${finalGenre}"`;

    const storyText = await chatCompletion(
      [{ role: "user", content: promptText }],
      { maxTokens: 1000 }
    );

    const db = readDb();
    const newStory = {
      id: Date.now(),
      userId: resolveUserId(req) || userId || 'guest',
      title: finalTitle,
      heroName: finalHero,
      genre: finalGenre,
      storyText,
      createdAt: new Date().toISOString()
    };

    db.stories.push(newStory);
    writeDb(db);

    res.status(201).json({
      success: true,
      message: 'Story generated and saved successfully!',
      story: storyText,
      storyId: newStory.id
    });

  } catch (error) {
    console.error('Story generation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate story from OpenRouter AI' });
  }
});

// --- Image generation with OpenAI (same family of models ChatGPT uses) ---
// Free by default: if no paid key is configured, a free image service is used instead.
// Option A: OPENAI_API_KEY in .env  -> OpenAI Images API (gpt-image-1)
// Option B: OPENROUTER_API_KEY only -> OpenAI image model through OpenRouter
//           (override with IMAGE_MODEL, default openai/gpt-5-image-mini)
const createOpenAIImage = async (prompt) => {
  if (process.env.OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        prompt,
        size: '1536x1024',
        quality: 'medium'
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('OpenAI Image Error Details:', errData);
      throw new Error(errData?.error?.message || `OpenAI Images API Error: ${response.status}`);
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenAI did not return an image.');
    return `data:image/png;base64,${b64}`;
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.IMAGE_MODEL || 'openai/gpt-5-image-mini',
      modalities: ['image', 'text'],
      messages: [{ role: 'user', content: `Generate an image: ${prompt}` }]
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    console.error('OpenRouter Image Error Details:', errData);
    throw new Error(errData?.error?.message || `OpenRouter image error: ${response.status}`);
  }

  const data = await response.json();
  const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error('The image model did not return an image. Try a different prompt.');
  return url;
};

// =====================================================================
//  IMAGES: two styles (2D / 3D) and several engines. If one fails, the next one is used.
//  Order: OpenAI (only if you set a key) -> free Hugging Face spaces -> free Pollinations
// =====================================================================
const IMAGE_STYLES = {
  '3d': {
    label: '3D',
    make: (p) => `Cute 3D animated Pixar Disney style render of ${p}, 3D CGI, soft studio lighting, smooth shading, highly detailed, vibrant colors, 8k`
  },
  '2d': {
    label: '2D',
    make: (p) => `2D hand-drawn storybook illustration of ${p}, flat colors, clean outlines, watercolor and ink cartoon style, children's book art, vibrant, not 3D, not a realistic render`
  }
};

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} took too long`)), ms))
  ]);

const sniffImageMime = (buf, headerMime) => {
  if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf.length > 12 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buf.length > 3 && buf.slice(0, 3).toString() === 'GIF') return 'image/gif';
  return headerMime && headerMime.startsWith('image/') ? headerMime : 'image/png';
};
const toDataUrl = (buf, headerMime) => `data:${sniffImageMime(buf, headerMime)};base64,${buf.toString('base64')}`;

// One Hugging Face space -> image data URL
const tryImageSpace = async (space, prompt, token) => {
  const { Client } = await import('@gradio/client');
  const client = await Client.connect(space, token ? { hf_token: token } : {});
  const root = (client.config && client.config.root) || `https://${space.toLowerCase().replace(/[\/_.]/g, '-')}.hf.space`;

  const call = await discoverMediaCall(client, prompt, 'image');
  if (!call) throw new Error('could not find a text-to-image function in this space');

  let urls = [];
  let lastData = null;
  for await (const msg of client.submit(call.endpoint, call.params)) {
    if (msg.type === 'status' && msg.stage === 'error') {
      throw new Error(msg.message || 'the space returned an error');
    }
    if (msg.type === 'data') {
      lastData = msg.data;
      const found = findMediaUrls(msg.data, root, 'image');
      if (found.length) urls = found;
    }
  }
  if (!urls.length) {
    console.error('[image] no image in answer from', space, '->', JSON.stringify(lastData || '').slice(0, 400));
    throw new Error('finished but sent no image (free GPU quota may be used up)');
  }

  let lastStatus = 0;
  for (const url of urls) {
    const host = new URL(url).hostname;
    const headers = token && (host.endsWith('.hf.space') || host.endsWith('huggingface.co'))
      ? { Authorization: `Bearer ${token}` }
      : {};
    const r = await fetch(url, { headers });
    lastStatus = r.status;
    if (r.ok) return toDataUrl(Buffer.from(await r.arrayBuffer()), r.headers && r.headers.get && r.headers.get('content-type'));
  }
  throw new Error(`could not download the image (${lastStatus})`);
};

// Pollinations: downloaded by the server so we KNOW it worked (a broken link counts as a failure)
const tryPollinationsImage = async (prompt) => {
  const seed = Math.floor(Math.random() * 1000000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(80000) });
  const type = (r.headers && r.headers.get && r.headers.get('content-type')) || '';
  if (!r.ok || !type.startsWith('image/')) throw new Error(`HTTP ${r.status}`);
  return toDataUrl(Buffer.from(await r.arrayBuffer()), type);
};

const makeImage = async (rawPrompt, style) => {
  const styleDef = IMAGE_STYLES[style];
  const prompt = styleDef ? styleDef.make(rawPrompt) : rawPrompt;
  const token = process.env.HF_TOKEN;

  const attempts = [];

  const paidConfigured =
    !!process.env.OPENAI_API_KEY ||
    (!!process.env.OPENROUTER_API_KEY && process.env.USE_PAID_MODEL === 'true');
  if (paidConfigured) {
    attempts.push({ name: 'OpenAI', run: () => createOpenAIImage(prompt) });
  }

  const spaces = (process.env.HF_IMAGE_SPACES || 'black-forest-labs/FLUX.1-schnell,stabilityai/stable-diffusion-3.5-large')
    .split(',').map(x => x.trim()).filter(Boolean);
  for (const space of spaces) {
    attempts.push({ name: space.split('/').pop(), run: () => tryImageSpace(space, prompt, token) });
  }

  if (process.env.ALLOW_FREE_IMAGE_FALLBACK !== 'false') {
    attempts.push({ name: 'Pollinations', run: () => tryPollinationsImage(prompt) });
  }

  const failures = [];
  for (const attempt of attempts) {
    try {
      const imageUrl = await withTimeout(attempt.run(), 90000, attempt.name);
      console.log(`[image] made by ${attempt.name} (${style || 'no style'})`);
      return { imageUrl, provider: attempt.name };
    } catch (err) {
      console.warn(`[image] ${attempt.name} failed: ${err.message}`);
      failures.push(`${attempt.name}: ${err.message}`);
    }
  }
  throw new Error('All image engines are busy right now. Please try again in a minute. (' + failures.slice(0, 3).join(' | ') + ')');
};

// --- API Endpoint: Generate Image ---
app.post('/api/generate-image', async (req, res) => {
  try {
    const prompt = (req.body.prompt || 'Beautiful cinematic scene').toString().slice(0, 1500);
    const style = ['2d', '3d'].includes(String(req.body.style).toLowerCase()) ? String(req.body.style).toLowerCase() : null;
    const result = await makeImage(prompt, style);
    res.status(200).json({ success: true, imageUrl: result.imageUrl, provider: result.provider, style });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate image' });
  }
});

// --- Free AI video via a Hugging Face Space (called from the server) ---
// Needs:  npm install @gradio/client
// Works without a key (small anonymous quota). A free HF_TOKEN gives more quota.
const VIDEO_DIR = path.join(__dirname, 'videos');
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });
app.use('/videos', express.static(VIDEO_DIR));

const videoJobs = new Map();

const buildVideoParams = (prompt) => {
  // Custom space? Put its inputs in HF_VIDEO_PARAMS as JSON, using {{prompt}} where the text goes.
  if (process.env.HF_VIDEO_PARAMS) {
    const safe = JSON.stringify(prompt).slice(1, -1);
    return JSON.parse(process.env.HF_VIDEO_PARAMS.replace(/\{\{prompt\}\}/g, safe));
  }
  // Default: SANA-Video demo space (text -> 5 second video)
  return {
    prompt,
    video_duration: '5 seconds',
    rl_lora_scale: 0.7,
    motion_score: 20,
    seed: Math.floor(Math.random() * 100000),
    randomize_seed: true
  };
};

// Gradio spaces return the video in different shapes depending on their version, for example:
//   {video: {path, url}}   {path, url}   "https://...mp4"   or only {path: "/tmp/gradio/.../video.mp4"}
// so we search the whole answer for anything that looks like a video file.
const MEDIA_EXT = {
  video: /\.(mp4|webm|mov|mkv|avi|gif)(\?|$)/i,
  image: /\.(png|jpe?g|webp|gif|bmp|avif)(\?|$)/i
};
const OTHER_KIND = { video: 'image', image: 'video' };

const collectFileCandidates = (node, ext, out = [], depth = 0) => {
  if (node === null || node === undefined || depth > 6) return out;
  if (typeof node === 'string') {
    if (/^https?:\/\//.test(node) && (ext.test(node) || node.includes('/file='))) out.push({ url: node });
    else if (ext.test(node)) out.push({ path: node });
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach(n => collectFileCandidates(n, ext, out, depth + 1));
    return out;
  }
  if (typeof node === 'object') {
    if (typeof node.url === 'string' || typeof node.path === 'string') {
      out.push({ url: node.url, path: node.path, name: node.orig_name });
    }
    Object.values(node).forEach(v => collectFileCandidates(v, ext, out, depth + 1));
  }
  return out;
};

// returns a list of addresses to try, best first. kind = 'video' or 'image'
const findMediaUrls = (data, root, kind = 'video') => {
  const ext = MEDIA_EXT[kind];
  const other = MEDIA_EXT[OTHER_KIND[kind]];
  const cands = collectFileCandidates(data, ext);
  const text = (c) => `${c.url || ''}${c.path || ''}${c.name || ''}`;
  const best =
    cands.find(c => ext.test(text(c))) ||
    cands.find(c => (c.url || c.path) && !(other.test(text(c)) && !ext.test(text(c))));
  if (!best) return [];
  if (best.url) return [best.url];
  if (!root || !best.path) return [];
  const base = root.replace(/\/$/, '');
  const p = best.path.startsWith('/') ? best.path : `/${best.path}`;
  return [`${base}/gradio_api/file=${p}`, `${base}/file=${p}`];
};
const findVideoUrls = (data, root) => findMediaUrls(data, root, 'video');

// Known spaces whose inputs we already know. Any other space is inspected automatically.
const SPACE_PRESETS = {
  'efficient-large-model/sana-video2-5b-720p-demo': (prompt) => ({ endpoint: '/generate', params: buildVideoParams(prompt) })
};

// Ask the space what it accepts (view_api) and fill in the prompt. Everything else keeps its default.
const discoverMediaCall = async (client, prompt, kind = 'video') => {
  const info = await client.view_api();
  const endpoints = (info && info.named_endpoints) || {};
  const asText = (o) => JSON.stringify(o || '').toLowerCase();

  for (const [name, ep] of Object.entries(endpoints)) {
    if (!(ep.returns || []).some(r => new RegExp(kind).test(asText(r)))) continue;

    // skip functions that need an uploaded picture/video/audio (we only have text)
    const needsFile = (ep.parameters || []).some(p =>
      !p.parameter_has_default && /file|image|video|audio/.test(asText(p.python_type) + asText(p.component) + asText(p.type))
    );
    if (needsFile) continue;

    const params = {};
    let promptSet = false;
    for (const p of ep.parameters || []) {
      const pname = p.parameter_name || p.label;
      if (!pname) continue;
      const lower = String(pname).toLowerCase();

      if (!promptSet && /prompt|description|caption|text/.test(lower) && !/negative|neg_/.test(lower)) {
        params[pname] = prompt;
        promptSet = true;
      } else if (/randomize/.test(lower)) {
        params[pname] = true;
      } else if (/seed/.test(lower) && !p.parameter_has_default) {
        params[pname] = Math.floor(Math.random() * 100000);
      } else if (!p.parameter_has_default) {
        const t = asText(p.python_type) + asText(p.type);
        if (/int|float|number/.test(t)) params[pname] = 0;
        else if (/bool/.test(t)) params[pname] = false;
        else if (/str/.test(t)) params[pname] = '';
      }
    }
    if (promptSet) return { endpoint: name, params };
  }
  return null;
};

// Runs one space and returns the finished video as a Buffer. Throws if it does not work.
const tryVideoSpace = async (space, isCustom, prompt, job, token) => {
  const { Client } = await import('@gradio/client');
  job.message = `Connecting to the free AI video engine (${space.split('/').pop()})...`;
  const client = await Client.connect(space, token ? { hf_token: token } : {});
  const root = (client.config && client.config.root) || `https://${space.toLowerCase().replace(/[\/_.]/g, '-')}.hf.space`;

  let call;
  if (isCustom && process.env.HF_VIDEO_PARAMS) {
    call = { endpoint: process.env.HF_VIDEO_ENDPOINT || '/generate', params: buildVideoParams(prompt) };
  } else if (SPACE_PRESETS[space.toLowerCase()]) {
    call = SPACE_PRESETS[space.toLowerCase()](prompt);
  } else {
    call = await discoverMediaCall(client, prompt, 'video');
    if (!call) throw new Error('could not find a text-to-video function in this space');
  }

  let urls = [];
  let lastData = null;
  for await (const msg of client.submit(call.endpoint, call.params)) {
    if (msg.type === 'status') {
      if (msg.stage === 'error') throw new Error(msg.message || 'the space returned an error');
      if (msg.position !== undefined && msg.position !== null) {
        job.message = `Waiting in queue (position ${msg.position + 1})...`;
      } else if (msg.stage === 'pending' || msg.stage === 'generating') {
        job.message = 'Rendering your video... this can take a minute or two.';
      }
    } else if (msg.type === 'data') {
      lastData = msg.data;
      const found = findVideoUrls(msg.data, root);
      if (found.length) urls = found; // keep the last message that really contained a video
    }
  }

  if (!urls.length) {
    const snippet = JSON.stringify(lastData);
    console.error('[video] no video in answer from', space, call.endpoint, '->', snippet && snippet.slice(0, 600));
    throw new Error('it finished but sent no video (usually the free GPU quota ran out)');
  }

  job.message = 'Saving your video...';
  let lastStatus = 0;
  for (const url of urls) {
    const host = new URL(url).hostname;
    const headers = token && (host.endsWith('.hf.space') || host.endsWith('huggingface.co'))
      ? { Authorization: `Bearer ${token}` }
      : {};
    const r = await fetch(url, { headers });
    lastStatus = r.status;
    if (r.ok) return Buffer.from(await r.arrayBuffer());
  }
  throw new Error(`could not download the video (${lastStatus})`);
};

const runVideoJob = async (id, prompt) => {
  const job = videoJobs.get(id);
  const token = process.env.HF_TOKEN;

  // HF_VIDEO_SPACE (your own choice) is tried first, then HF_VIDEO_SPACES, then the built-in list
  const defaults = 'Efficient-Large-Model/sana-video2-5b-720p-demo,Lightricks/ltx-video-distilled';
  const listed = (process.env.HF_VIDEO_SPACES || defaults).split(',').map(x => x.trim()).filter(Boolean);
  const custom = process.env.HF_VIDEO_SPACE ? process.env.HF_VIDEO_SPACE.trim() : null;
  const spaces = [...(custom ? [custom] : []), ...listed.filter(x => x !== custom)];

  const failures = [];
  for (const space of spaces) {
    try {
      const buffer = await tryVideoSpace(space, space === custom, prompt, job, token);
      fs.writeFileSync(path.join(VIDEO_DIR, `${id}.mp4`), buffer);
      job.status = 'done';
      job.file = `${id}.mp4`;
      job.message = 'Done';
      console.log(`[video] made by ${space}`);
      return;
    } catch (err) {
      console.warn(`[video] ${space} failed: ${err.message}`);
      failures.push(`${space.split('/').pop()}: ${err.message}`);
    }
  }

  job.status = 'error';
  job.message =
    'The free video engines are busy or out of free quota right now. ' +
    'You can make the video on a free website and upload it here (see the box under the button). ' +
    '(' + failures.slice(0, 2).join(' | ') + ')';
};

app.post('/api/generate-video', (req, res) => {
  const prompt = (req.body.prompt || '').toString().trim().slice(0, 800);
  if (!prompt) return res.status(400).json({ success: false, message: 'Describe the video first.' });

  const running = [...videoJobs.values()].filter(j => j.status === 'running').length;
  if (running >= 2) {
    return res.status(429).json({ success: false, message: 'Two videos are already rendering. Please wait a moment.' });
  }

  const id = crypto.randomUUID();
  videoJobs.set(id, { status: 'running', message: 'Starting...', file: null, createdAt: Date.now() });
  runVideoJob(id, prompt); // runs in the background
  res.status(202).json({ success: true, jobId: id });
});

app.get('/api/video-status/:id', (req, res) => {
  const job = videoJobs.get(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Video job not found.' });
  res.json({
    success: true,
    status: job.status,
    message: job.message,
    videoUrl: job.file ? `${req.protocol}://${req.get('host')}/videos/${job.file}` : null
  });
});

// forget finished jobs after 1 hour
setInterval(() => {
  for (const [id, job] of videoJobs) {
    if (Date.now() - job.createdAt > 60 * 60 * 1000) videoJobs.delete(id);
  }
}, 10 * 60 * 1000);

// =====================================================================
//  ACCOUNTS, SAVED CHATS and ONLINE REVIEWS (shared by everyone who logs in)
//  Stored in db.json. For a real deployment use a hosted database instead.
// =====================================================================
// crypto is required above (video section). Passwords are hashed with scrypt.
const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
  salt,
  hash: crypto.scryptSync(password, salt, 64).toString('hex')
});

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });

const ensureCollections = (db) => {
  db.users = db.users || [];
  db.sessions = db.sessions || [];
  db.chats = db.chats || [];
  db.reviews = db.reviews || [];
  return db;
};

// Reviews written before accounts existed (shown to everyone)
const SEED_REVIEWS = [
  { id: 'seed1', userId: 'seed', name: 'Ananya', comment: 'PlotCraft makes story creation super fun!', rating: 5 },
  { id: 'seed2', userId: 'seed', name: 'Rahul S.', comment: 'The full story page and narration are amazing!', rating: 5 },
  { id: 'seed3', userId: 'seed', name: 'Priya M.', comment: 'The themes look gorgeous!', rating: 5 },
  { id: 'seed4', userId: 'seed', name: 'Kiran G.', comment: 'Super fast AI responses and a clean reading view.', rating: 5 }
];

const requireAuth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  const db = ensureCollections(readDb());
  const session = db.sessions.find(x => x.token === token);
  const user = session && db.users.find(u => u.id === session.userId);
  if (!user) return res.status(401).json({ success: false, message: 'Please log in first.' });
  req.user = user;
  req.db = db;
  next();
};

const startSession = (db, user) => {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({ token, userId: user.id, createdAt: Date.now() });
  db.sessions = db.sessions.slice(-500);
  writeDb(db);
  return token;
};

app.post('/api/auth/register', (req, res) => {
  const name = (req.body.name || '').toString().trim().slice(0, 60);
  const email = (req.body.email || '').toString().trim().toLowerCase().slice(0, 120);
  const password = (req.body.password || '').toString();

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please fill all fields.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const db = ensureCollections(readDb());
  if (db.users.some(u => u.email === email)) {
    return res.status(409).json({ success: false, message: 'An account already exists with this email.' });
  }

  const { salt, hash } = hashPassword(password);
  const user = { id: crypto.randomUUID(), name, email, salt, hash, createdAt: new Date().toISOString() };
  db.users.push(user);
  const token = startSession(db, user);
  res.status(201).json({ success: true, token, user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const email = (req.body.email || '').toString().trim().toLowerCase();
  const password = (req.body.password || '').toString();
  const db = ensureCollections(readDb());
  const user = db.users.find(u => u.email === email);

  const bad = () => res.status(401).json({ success: false, message: 'Invalid email or password!' });
  if (!user) return bad();

  const { hash } = hashPassword(password, user.salt);
  const ok = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.hash, 'hex'));
  if (!ok) return bad();

  const token = startSession(db, user);
  res.json({ success: true, token, user: publicUser(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  req.db.sessions = req.db.sessions.filter(x => x.token !== token);
  writeDb(req.db);
  res.json({ success: true });
});

// ---- Saved AI chats (per account) ----
// A chat = { id, title, messages: [...], updatedAt }. Generated images are not stored (too large).
const cleanChatMessages = (messages) =>
  (Array.isArray(messages) ? messages : []).slice(-200).map(m => ({
    id: String(m.id || '').slice(0, 60),
    role: m.role === 'user' ? 'user' : 'assistant',
    kind: m.kind === 'image' ? 'image' : 'text',
    content: String(m.content || '').slice(0, 20000),
    raw: m.raw ? String(m.raw).slice(0, 20000) : undefined,
    ask: m.ask ? String(m.ask).slice(0, 1000) : undefined,
    verdict: m.verdict ? String(m.verdict).slice(0, 20) : undefined,
    confidence: typeof m.confidence === 'number' ? m.confidence : undefined,
    source: m.source ? String(m.source).slice(0, 300) : undefined,
    fileName: m.fileName ? String(m.fileName).slice(0, 120) : undefined,
    error: m.error ? true : undefined
  }));

app.get('/api/chats', requireAuth, (req, res) => {
  const chats = req.db.chats
    .filter(c => c.userId === req.user.id)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(c => ({ id: c.id, title: c.title, updatedAt: c.updatedAt, count: c.messages.length }));
  res.json({ success: true, chats });
});

app.get('/api/chats/:id', requireAuth, (req, res) => {
  const chat = req.db.chats.find(c => c.id === req.params.id && c.userId === req.user.id);
  if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });
  res.json({ success: true, chat });
});

app.put('/api/chats/:id', requireAuth, (req, res) => {
  const id = req.params.id.slice(0, 60);
  const messages = cleanChatMessages(req.body.messages);
  if (messages.length === 0) return res.json({ success: true });

  const firstUser = messages.find(m => m.role === 'user');
  const title = (req.body.title || (firstUser && firstUser.content) || 'New chat').toString().slice(0, 60);

  const existing = req.db.chats.find(c => c.id === id);
  if (existing && existing.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not your chat.' });
  }
  if (existing) {
    existing.messages = messages;
    existing.title = title;
    existing.updatedAt = Date.now();
  } else {
    req.db.chats.push({ id, userId: req.user.id, title, messages, updatedAt: Date.now() });
  }
  writeDb(req.db);
  res.json({ success: true });
});

app.delete('/api/chats/:id', requireAuth, (req, res) => {
  req.db.chats = req.db.chats.filter(c => !(c.id === req.params.id && c.userId === req.user.id));
  writeDb(req.db);
  res.json({ success: true });
});

// ---- Reviews: anyone can read, only logged-in users can write ----
app.get('/api/reviews', (req, res) => {
  const db = ensureCollections(readDb());
  const stories = db.stories || [];
  const reviews = [...db.reviews]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(r => ({ ...r, storyCount: stories.filter(st => st.userId === r.userId).length }));
  const all = [...reviews, ...SEED_REVIEWS];
  const average = all.length ? all.reduce((sum, r) => sum + r.rating, 0) / all.length : 0;
  res.json({ success: true, reviews: all, average: Math.round(average * 10) / 10, total: all.length });
});

app.post('/api/reviews', requireAuth, (req, res) => {
  const comment = (req.body.comment || '').toString().trim().slice(0, 500);
  const rating = Math.min(5, Math.max(1, Math.round(Number(req.body.rating) || 5)));
  if (!comment) return res.status(400).json({ success: false, message: 'Please write a comment.' });

  // one review per account: posting again replaces the old one
  req.db.reviews = req.db.reviews.filter(r => r.userId !== req.user.id);
  const review = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    name: req.user.name,
    comment,
    rating,
    createdAt: Date.now()
  };
  req.db.reviews.push(review);
  writeDb(req.db);
  res.status(201).json({ success: true, review });
});

app.delete('/api/reviews/:id', requireAuth, (req, res) => {
  req.db.reviews = req.db.reviews.filter(r => !(r.id === req.params.id && r.userId === req.user.id));
  writeDb(req.db);
  res.json({ success: true });
});

// ---- Public numbers for the About page (real counts, nothing made up) ----
app.get('/api/stats', (req, res) => {
  const db = ensureCollections(readDb());
  const all = [...db.reviews, ...SEED_REVIEWS];
  const average = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
  res.json({
    success: true,
    stats: {
      stories: (db.stories || []).length,
      creators: db.users.length,
      chats: db.chats.length,
      reviews: all.length,
      rating: Math.round(average * 10) / 10
    }
  });
});

// ---- Upload a video made on another site, so it is shown (and kept) on our own page ----
app.post(
  '/api/upload-video',
  requireAuth,
  express.raw({ type: ['video/*', 'application/octet-stream'], limit: '80mb' }),
  (req, res) => {
    const type = (req.headers['content-type'] || '').toLowerCase();
    const ext = type.includes('webm') ? 'webm' : type.includes('quicktime') ? 'mov' : 'mp4';
    if (!Buffer.isBuffer(req.body) || req.body.length < 1000) {
      return res.status(400).json({ success: false, message: 'No video received.' });
    }
    const id = crypto.randomUUID();
    fs.writeFileSync(path.join(VIDEO_DIR, `${id}.${ext}`), req.body);
    res.status(201).json({
      success: true,
      videoUrl: `${req.protocol}://${req.get('host')}/videos/${id}.${ext}`
    });
  }
);

// ---- A user's own creations (stories saved to their account) ----
app.get('/api/my-stories', requireAuth, (req, res) => {
  const stories = (readDb().stories || [])
    .filter(st => st.userId === req.user.id)
    .sort((a, b) => b.id - a.id);
  res.json({ success: true, stories });
});

// --- API Endpoint: Get All Stories ---
app.get('/api/stories', (req, res) => {
  try {
    const { userId } = req.query;
    const db = readDb();

    if (userId) {
      const userStories = db.stories.filter(s => s.userId === userId);
      return res.json({ success: true, stories: userStories });
    }

    res.json({ success: true, stories: db.stories });
  } catch (error) {
    console.error('Failed to fetch stories:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve stories' });
  }
});

// --- API Endpoint: AI Chat (story originality check + file error finder) ---
const CHAT_SYSTEM_PROMPT = `You are PlotChat, a friendly assistant inside a story-creation app. Reply in the same language the user writes in (English, Telugu, Hindi, or Tenglish).

STORY CHECK. If the user's message contains a story, plot, story title, or story idea, decide whether it is:
- EXISTING: a known story (folk tale, fable, myth, book, film, comic, or true event)
- INSPIRED: partly original but clearly borrowing from a known work
- ORIGINAL: no known story matches
- UNSURE: you cannot tell

For such messages, the VERY FIRST line must be exactly:
VERDICT: <EXISTING|INSPIRED|ORIGINAL|UNSURE> | CONFIDENCE: <0-100>
and the second line must be:
SOURCE: <title and author/origin of the matching work, or "None found">
Then write Markdown with these sections:
## Analysis (name the characters, plot points, or morals that match, or explain why nothing matched)
## What is original (what is new or unusual in the user's version)
## Make it more original (only for EXISTING or INSPIRED: 3 concrete suggestions)
Be honest. Never invent a source. If you are not sure, use UNSURE.

FILES. If a file is attached, review it for real errors. Use sections: ## Summary, ## Errors Found (numbered; give the line number, what is wrong, and why), ## Fixes (corrected code in fenced code blocks), ## Other Suggestions (optional). If there are no errors, say so. Never invent line numbers. Do NOT output VERDICT lines for files.

OTHER QUESTIONS. Answer normally in clear Markdown. Do not output VERDICT lines.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, file } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'No message received.' });
    }

    const clean = messages
      .slice(-12)
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));

    if (clean.length === 0 || clean[clean.length - 1].role !== 'user') {
      return res.status(400).json({ success: false, message: 'Last message must be from the user.' });
    }

    if (file && typeof file.content === 'string') {
      const last = clean[clean.length - 1];
      const fileName = (file.name || 'file').toString().slice(0, 120);

      if (file.kind === 'image') {
        if (!file.content.startsWith('data:image/')) {
          return res.status(400).json({ success: false, message: 'Invalid image data.' });
        }
        last.content = [
          { type: 'text', text: `File: ${fileName}\n${last.content}\nThis is an image/screenshot. Point out any errors or problems and how to fix them.` },
          { type: 'image_url', image_url: { url: file.content } }
        ];
      } else {
        const MAX_CHARS = 60000;
        const numbered = file.content
          .slice(0, MAX_CHARS)
          .split(/\r?\n/)
          .map((line, i) => `${i + 1}| ${line}`)
          .join('\n');
        last.content =
          `File: ${fileName}\n${last.content}\n` +
          (file.content.length > MAX_CHARS ? `(File truncated to the first ${MAX_CHARS} characters.)\n` : '') +
          `\n${numbered}`;
      }
    }

    // Same question again = answered from cache, no quota used (text chats only)
    const cacheKey = file ? null : JSON.stringify(clean);
    const cached = cacheKey ? cacheGet(cacheKey) : null;
    if (cached) {
      return res.json({ success: true, reply: cached, cached: true });
    }

    const reply = await chatCompletion(
      [{ role: 'system', content: CHAT_SYSTEM_PROMPT }, ...clean],
      { maxTokens: 2000, needsVision: file?.kind === 'image' }
    );
    if (cacheKey) cacheSet(cacheKey, reply);
    res.json({ success: true, reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, message: error.message || 'Chat failed' });
  }
});

// --- Health check (used by:  node check-sync.mjs --live ) ---
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

// --- Server Setup ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running smoothly on port ${PORT}`);
});