// Read-aloud for ANY language, using the voices already installed in the browser/OS.
// Mixed text (for example Telugu + English) is split by script and every part is read
// with a voice of its own language.

const SCRIPTS = [
  { re: /[\u0C00-\u0C7F]/, lang: 'te-IN', name: 'Telugu' },
  { re: /[\u0900-\u097F]/, lang: 'hi-IN', name: 'Hindi' },
  { re: /[\u0B80-\u0BFF]/, lang: 'ta-IN', name: 'Tamil' },
  { re: /[\u0C80-\u0CFF]/, lang: 'kn-IN', name: 'Kannada' },
  { re: /[\u0D00-\u0D7F]/, lang: 'ml-IN', name: 'Malayalam' },
  { re: /[\u0980-\u09FF]/, lang: 'bn-IN', name: 'Bengali' },
  { re: /[\u0A80-\u0AFF]/, lang: 'gu-IN', name: 'Gujarati' },
  { re: /[\u0A00-\u0A7F]/, lang: 'pa-IN', name: 'Punjabi' },
  { re: /[\u0B00-\u0B7F]/, lang: 'or-IN', name: 'Odia' },
  { re: /[\u0600-\u06FF]/, lang: 'ar-SA', name: 'Arabic' },
  { re: /[\u0590-\u05FF]/, lang: 'he-IL', name: 'Hebrew' },
  { re: /[\u0E00-\u0E7F]/, lang: 'th-TH', name: 'Thai' },
  { re: /[\uAC00-\uD7AF]/, lang: 'ko-KR', name: 'Korean' },
  { re: /[\u3040-\u30FF]/, lang: 'ja-JP', name: 'Japanese' },
  { re: /[\u0400-\u04FF]/, lang: 'ru-RU', name: 'Russian' },
  { re: /[\u0370-\u03FF]/, lang: 'el-GR', name: 'Greek' },
];
const HAN = /[\u4E00-\u9FFF]/;
const LATIN = /[A-Za-z\u00C0-\u024F]/;

const NAMES = {
  'en-US': 'English', 'es-ES': 'Spanish', 'fr-FR': 'French', 'de-DE': 'German',
  'pt-BR': 'Portuguese', 'it-IT': 'Italian', 'zh-CN': 'Chinese',
};
SCRIPTS.forEach((s) => { NAMES[s.lang] = s.name; });

// Latin letters can be English, Spanish, French... a light guess from common words / accents
const guessLatinLang = (text) => {
  const t = ` ${text.toLowerCase()} `;
  const score = (words) => words.filter((w) => t.includes(` ${w} `)).length;
  const es = score(['el', 'la', 'los', 'las', 'de', 'que', 'y', 'es', 'una', 'por', 'con', 'para']) + (/[ñ¿¡]/.test(t) ? 3 : 0);
  const fr = score(['le', 'la', 'les', 'des', 'est', 'une', 'et', 'pour', 'dans', 'que', 'avec']) + (/[èêàçùœ]/.test(t) ? 2 : 0);
  const de = score(['der', 'die', 'das', 'und', 'ist', 'nicht', 'ein', 'eine', 'mit', 'für']) + (/[äöüß]/.test(t) ? 3 : 0);
  const pt = score(['o', 'os', 'as', 'um', 'uma', 'não', 'com', 'para', 'você']) + (/[ãõ]/.test(t) ? 3 : 0);
  const en = score(['the', 'and', 'is', 'to', 'of', 'in', 'a', 'it', 'you', 'that', 'was', 'he', 'she']);
  const best = Math.max(es, fr, de, pt, en);
  if (best < 3 || best === en) return 'en-US';
  if (best === es) return 'es-ES';
  if (best === fr) return 'fr-FR';
  if (best === de) return 'de-DE';
  return 'pt-BR';
};

const langOfChar = (ch, hasKana, latinLang) => {
  for (const s of SCRIPTS) if (s.re.test(ch)) return s.lang;
  if (HAN.test(ch)) return hasKana ? 'ja-JP' : 'zh-CN';
  if (LATIN.test(ch)) return latinLang;
  return null; // digits, spaces, punctuation: stay with the current language
};

export const splitByLanguage = (text) => {
  const hasKana = /[\u3040-\u30FF]/.test(text);
  const latinLang = guessLatinLang(text);
  const runs = [];
  let cur = null;
  for (const ch of text) {
    const lang = langOfChar(ch, hasKana, latinLang);
    if (lang && (!cur || cur.lang !== lang)) {
      cur = { lang, text: '' };
      runs.push(cur);
    }
    if (!cur) {
      cur = { lang: latinLang, text: '' };
      runs.push(cur);
    }
    cur.text += ch;
  }
  return runs.filter((r) => /[\p{L}\p{N}]/u.test(r.text));
};

// remove markdown symbols so they are not read out
export const cleanForSpeech = (text) =>
  String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*(VERDICT|SOURCE):.*$/gim, ' ')
    .replace(/[#*_`>~|]/g, ' ')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const chunkText = (text, max = 180) => {
  const parts = text.match(/[^.!?।॥…。！？\n]+[.!?।॥…。！？]*\s*/g) || [text];
  const chunks = [];
  let buf = '';
  for (const part of parts) {
    if ((buf + part).length > max && buf) {
      chunks.push(buf.trim());
      buf = '';
    }
    if (part.length > max) {
      for (let i = 0; i < part.length; i += max) chunks.push(part.slice(i, i + max).trim());
    } else {
      buf += part;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.filter(Boolean);
};

export const isSpeechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

let voicesPromise = null;
const loadVoices = () => {
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const now = synth.getVoices();
    if (now.length) return resolve(now);
    const done = () => resolve(synth.getVoices());
    synth.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  }).then((v) => {
    if (!v.length) voicesPromise = null; // try again next time
    return v;
  });
  return voicesPromise;
};

const pickVoice = (voices, lang) => {
  const norm = (l) => String(l || '').replace('_', '-').toLowerCase();
  const target = norm(lang);
  const base = target.split('-')[0];
  const matches = voices.filter((v) => norm(v.lang) === target || norm(v.lang).startsWith(base + '-') || norm(v.lang) === base);
  if (!matches.length) return null;
  return (
    matches.find((v) => norm(v.lang) === target && /natural|online|google/i.test(v.name)) ||
    matches.find((v) => norm(v.lang) === target) ||
    matches.find((v) => /natural|online|google/i.test(v.name)) ||
    matches[0]
  );
};

let session = 0;
let keepAlive = []; // Chrome can drop utterances that are garbage collected mid-speech
let pendingEnd = null; // lets the previous "Stop" button reset itself when another one starts

const finish = () => {
  const cb = pendingEnd;
  pendingEnd = null;
  if (cb) cb();
};

export const stopSpeaking = () => {
  session++;
  keepAlive = [];
  if (isSpeechSupported()) window.speechSynthesis.cancel();
  finish();
};

// onMissingVoice(namesOfLanguagesWithoutAVoice) is called when this device has no voice for part of the text.
export const speakText = async (text, { onStart, onEnd, onMissingVoice, rate = 0.95 } = {}) => {
  if (!isSpeechSupported()) {
    onMissingVoice && onMissingVoice(['this browser (no speech support)']);
    onEnd && onEnd();
    return;
  }
  stopSpeaking();
  const mySession = session;
  pendingEnd = onEnd || null;

  const voices = await loadVoices();
  if (mySession !== session) return;

  const runs = splitByLanguage(cleanForSpeech(text));
  const queue = [];
  const missing = new Set();

  for (const run of runs) {
    const voice = pickVoice(voices, run.lang);
    if (!voice) missing.add(NAMES[run.lang] || run.lang);
    for (const chunk of chunkText(run.text)) queue.push({ text: chunk, lang: run.lang, voice });
  }

  const playable = queue.filter((q) => q.voice);
  if (missing.size && onMissingVoice) onMissingVoice([...missing]);
  if (!playable.length) {
    finish();
    return;
  }

  onStart && onStart();
  let i = 0;
  const next = () => {
    if (mySession !== session) return;
    if (i >= playable.length) {
      keepAlive = [];
      finish();
      return;
    }
    const item = playable[i++];
    const u = new SpeechSynthesisUtterance(item.text);
    u.lang = item.voice.lang || item.lang;
    u.voice = item.voice;
    u.rate = rate;
    u.onend = next;
    u.onerror = (e) => {
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      next();
    };
    keepAlive.push(u);
    window.speechSynthesis.speak(u);
  };
  setTimeout(next, 60);
};