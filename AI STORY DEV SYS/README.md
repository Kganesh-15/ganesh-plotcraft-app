# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.






PLOTCRAFT UPDATE - where each file goes
=======================================

frontend/src/components/   ->  copy ALL files into your project's  src/components/
    AiDashboard.jsx, AiSearch.jsx, AboutPage.jsx, UsagePage.jsx, ReviewsSection.jsx,
    FallingBackground.jsx, PlotCraftLogo.jsx, ReadAloudButton.jsx

frontend/src/services/     ->  copy ALL files into your project's  src/services/
    openai.js, api.js, speech.js, config.js

backend/server.js          ->  replace your backend server.js
backend/.env.example       ->  save in the backend folder as  .env  (then fill your keys)

Install once, inside the BACKEND folder:
    npm install express cors dotenv @gradio/client
Run:
    node server.js

Rules
- openai.js must contain only plain JavaScript (no <tags>). AiSearch.jsx must start with: import React ...
- Keys (.env) stay in the backend folder, never in the frontend.

DEPLOYING ONLINE
1. Deploy the backend (server.js) to a Node host. Set the same variables from .env there.
2. In the frontend folder create a file named  .env.production  with one line:
       VITE_API_URL=https://your-backend-address
3. Build and host the frontend:  npm run build
4. Accounts, saved chats and reviews are stored in backend/db.json. Many free hosts erase files
   when they restart, so use a host with a persistent disk, or move db.json to a hosted database.
5. Add  db.json  and  .env  to .gitignore.









PLOTCRAFT UPDATE - where each file goes
=======================================

frontend/src/components/   ->  copy ALL files into your project's  src/components/
    AiDashboard.jsx, AiSearch.jsx, AboutPage.jsx, UsagePage.jsx, ReviewsSection.jsx,
    FallingBackground.jsx, PlotCraftLogo.jsx, ReadAloudButton.jsx

frontend/src/services/     ->  copy ALL files into your project's  src/services/
    openai.js, api.js, speech.js, config.js

backend/server.js          ->  replace your backend server.js
backend/.env.example       ->  save in the backend folder as  .env  (then fill your keys)

Install once, inside the BACKEND folder:
    npm install express cors dotenv @gradio/client
Run:
    node server.js

Rules
- openai.js must contain only plain JavaScript (no <tags>). AiSearch.jsx must start with: import React ...
- Keys (.env) stay in the backend folder, never in the frontend.

DEPLOYING ONLINE
1. Deploy the backend (server.js) to a Node host. Set the same variables from .env there.
2. In the frontend folder create a file named  .env.production  with one line:
       VITE_API_URL=https://your-backend-address
3. Build and host the frontend:  npm run build
4. Accounts, saved chats and reviews are stored in backend/db.json. Many free hosts erase files
   when they restart, so use a host with a persistent disk, or move db.json to a hosted database.
5. Add  db.json  and  .env  to .gitignore.


CHECK THAT EVERYTHING IS IN SYNC
================================
Put  frontend/check-sync.mjs  in your frontend folder (next to package.json, NOT inside src).
Then run:
    node check-sync.mjs               checks every import/export and every API call
    node check-sync.mjs --live        also tests the running backend (start it first)
It prints exactly which file has the wrong content and what to do. Fix until it says:
    ALL FILES ARE IN SYNC
Optional: add to package.json "scripts":   "check": "node check-sync.mjs"   then run: npm run check


FREE VIDEO (no token needed)
============================
The server tries several free Hugging Face video engines one after another (no key required).
If all are busy, the Video tab shows a box: open a free video site (your prompt is copied),
download the video, then upload it, and it plays on your own page.
Optional (more free quota): put HF_TOKEN=... in the backend .env
Extra file for this: frontend/src/components/FreeVideoHelper.jsx