// Accounts, saved chats and online reviews (all stored by the backend, so every visitor sees the same data)
import { API_BASE } from './config';

const TOKEN_KEY = 'plotcraft_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};
export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

const request = async (path, { method = 'GET', body } = {}) => {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    /* non-JSON response */
  }
  if (!response.ok || data.success === false) {
    const err = new Error(data.message || `Server error (${response.status})`);
    err.status = response.status;
    throw err;
  }
  return data;
};

/* ---------- accounts ---------- */
export const registerUser = async ({ name, email, password }) => {
  const data = await request('/api/auth/register', { method: 'POST', body: { name, email, password } });
  setToken(data.token);
  return data.user;
};

export const loginUser = async ({ email, password }) => {
  const data = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  setToken(data.token);
  return data.user;
};

export const fetchMe = async () => (await request('/api/auth/me')).user;

export const logoutUser = async () => {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } catch {
    /* ignore: we clear the local token anyway */
  }
  setToken('');
};

/* ---------- saved chats ---------- */
export const listChats = async () => (await request('/api/chats')).chats;
export const getChat = async (id) => (await request(`/api/chats/${id}`)).chat;
export const saveChat = async (id, messages) => request(`/api/chats/${id}`, { method: 'PUT', body: { messages } });
export const deleteChat = async (id) => request(`/api/chats/${id}`, { method: 'DELETE' });

/* ---------- reviews ---------- */
export const fetchReviews = async () => request('/api/reviews');
export const postReview = async ({ rating, comment }) => (await request('/api/reviews', { method: 'POST', body: { rating, comment } })).review;
export const deleteReview = async (id) => request(`/api/reviews/${id}`, { method: 'DELETE' });

/* ---------- creations + site numbers ---------- */
export const fetchMyStories = async () => (await request('/api/my-stories')).stories;
export const fetchStats = async () => (await request('/api/stats')).stats;

// api.js ఫైల్ చివరిలో ఇది కలపండి:
export default { getToken, loginUser, registerUser /* మొదలైనవి */ };