// Where the backend (server.js) lives.
// Local development: http://localhost:5000
// After you deploy the backend, create a file named .env.production in the frontend folder with:
//   VITE_API_URL=https://your-backend-address.com
// export const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000';
// /src/services/config.js
export const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000';

// ఒకవేళ ఎక్కడైనా డిఫాల్ట్ గా వాడితే సపోర్ట్ చేయడానికి ఇది కూడా పెట్టుకోండి:
export default API_BASE;