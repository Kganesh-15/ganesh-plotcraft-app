// AI helpers: every call goes to our own Node.js backend (server.js)
import { API_BASE } from './config';
import { getToken } from './api';

export const generateText = async (promptOrData) => {
  try {
    const isObject = typeof promptOrData === 'object' && promptOrData !== null;
    
    const payload = {
      userId: isObject ? (promptOrData.userId || 'guest') : 'guest',
      storyTitle: isObject ? (promptOrData.storyTitle || promptOrData.title || 'Untitled Story') : (promptOrData || 'Untitled Story'),
      heroName: isObject ? (promptOrData.heroName || 'Hero') : 'Hero',
      genre: isObject ? (promptOrData.genre || 'Moral Story') : 'Moral Story'
    };

    const response = await fetch(`${API_BASE}/api/stories/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Server error generating story.');
    }

    return data.story;
  } catch (error) {
    console.error('Story Generation Error:', error);
    throw error;
  }
};

// style: '2d' | '3d' (optional). Returns { imageUrl, provider } so the page can show which engine made it.
export const generateImageWithInfo = async (prompt, { style } = {}) => {
  const cleanPrompt = prompt || 'Children storybook illustration, colorful, detailed';

  const response = await fetch(`${API_BASE}/api/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: cleanPrompt, style }),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    /* non-JSON response */
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Image generation failed');
  }

  return { imageUrl: data.imageUrl, provider: data.provider || '' };
};

export const generateImage = async (prompt, options) => (await generateImageWithInfo(prompt, options)).imageUrl;

// ---------- Long stories (any number of pages) ----------
const pollStory = async (jobId, { onProgress, existing = [] } = {}) => {
  const pages = [...existing];

  while (true) {
    const res = await fetch(`${API_BASE}/api/stories/status/${jobId}?from=${pages.length}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      const err = new Error(data.message || 'Lost connection to the story writer.');
      err.jobId = jobId;
      err.pages = pages;
      throw err;
    }

    if (data.pages.length) pages.push(...data.pages);
    if (onProgress) onProgress({ done: data.done, total: data.total, message: data.message, pages: [...pages] });

    if (data.status === 'done') {
      return { jobId, pages, storyId: data.storyId, providers: data.providers };
    }
    if (data.status === 'error') {
      const err = new Error(data.message || 'Story writing stopped.');
      err.jobId = jobId;
      err.pages = pages;
      err.canContinue = true;
      throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
};

export const generateStory = async (params, { onProgress } = {}) => {
  const res = await fetch(`${API_BASE}/api/stories/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || 'Could not start the story.');
  return pollStory(data.jobId, { onProgress });
};

export const continueStory = async (jobId, existingPages, { onProgress } = {}) => {
  const res = await fetch(`${API_BASE}/api/stories/continue/${jobId}`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || 'Could not continue the story.');
  return pollStory(jobId, { onProgress, existing: existingPages });
};

export const generateVideo = async (prompt, { onProgress, timeoutMs = 10 * 60 * 1000 } = {}) => {
  const API = API_BASE;

  const start = await fetch(`${API}/api/generate-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const startData = await start.json().catch(() => ({}));
  if (!start.ok || !startData.success) {
    throw new Error(startData.message || 'Could not start video generation.');
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const res = await fetch(`${API}/api/video-status/${startData.jobId}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Lost connection to the video job.');
    }
    if (data.status === 'done') return data.videoUrl;
    if (data.status === 'error') throw new Error(data.message || 'Video generation failed.');
    if (onProgress && data.message) onProgress(data.message);
  }
  throw new Error('Video generation took too long. Please try again.');
};

// Upload a video made on another free site, so it is shown (and kept) on our own page.
export const uploadVideoFile = async (file) => {
  const response = await fetch(`${API_BASE}/api/upload-video`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'video/mp4',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: file,
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    /* non-JSON response */
  }
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Upload failed (${response.status})`);
  }
  return data.videoUrl;
};

// ---------- AI Chat tab helper ----------
export const chatAI = async ({ messages, file }) => {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, file }),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    /* non-JSON response */
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || `Server error (${response.status})`);
  }
  return data.reply;
};