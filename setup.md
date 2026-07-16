# Frontend Setup

## Overview

This repository contains the Member & Claims Intelligence prototype: a React frontend wired to a Python/ADK multi-agent backend.

- Frontend stack: `React` + `TypeScript` + `Vite` + `Tailwind CSS`
- Backend: `google-adk` orchestrator (`orchestrator/agent.py` -> `main.py`) serving 4 sub-agents (claims, benefits, resolution/ROI, compliance/risk) over Vertex AI
- The chat assistant (both the typed chat and the voice call screen) calls the backend live -- it is not canned/local logic
- Voice call behavior uses browser speech APIs when available

## Backend (required for the assistant to answer)

From the repo root, with the Python `.venv` set up (see the main project README/CLAUDE notes for `pip install -r requirements.txt`, `.env`, and `gcloud auth application-default login`):

```bash
./.venv/bin/adk web orchestrator --port 8000 --allow_origins http://localhost:5173
```

This must be running before the frontend can get real answers. If it's not running, the chat UI will show a "Could not reach the assistant backend" error instead of crashing.

If you serve the frontend from a different port/host, override the backend URL via a `VITE_ORCHESTRATOR_URL` env var (defaults to `http://127.0.0.1:8000`), and pass the matching `--allow_origins` value to `adk web`.

## Verified Runtime

The app was verified with:

- `Node.js 24.17.0`
- `npm` bundled with that Node version

If you already have a recent Node.js installed locally, use that. If not, install Node.js 24.x.

## 1. Get the code

If you are cloning the repository fresh:

```bash
git clone https://github.com/diyabhtt/myapprepo.git
cd myapprepo
git fetch --all
git checkout frontend
```

If you already have the repository locally:

```bash
git fetch --all
git checkout frontend
git pull origin frontend
```

## 2. Install dependencies

```bash
npm install
```

## 3. Start the frontend locally

```bash
npm run dev
```

Vite will print a local URL, typically:

```bash
http://localhost:5173
```

Open that URL in your browser.

## 4. Run tests

```bash
npm test
```

## 5. Create a production build

```bash
npm run build
```

## 6. Preview the production build locally

```bash
npm run preview
```

## Data Notes

- Dashboard/claims list views still read directly from the CSV files in `data/structured` (bundled at build time) for fast local display
- The AI assistant (chat and voice call) instead calls the live backend, which reads the same CSVs at request time -- so assistant answers reflect the backend's data, not a separate copy
- If you change CSV contents, restart both the frontend dev server and `adk web`, then refresh the browser

## Voice and Call Notes

- The call screen uses browser speech recognition and speech synthesis where supported
- For best results, use a Chromium-based browser such as Chrome or Edge
- Allow microphone access when the browser prompts for it
- If speech recognition is unavailable, the call screen includes a typed fallback

## Useful Commands

```bash
npm run dev
npm test
npm run build
npm run preview
```

## Troubleshooting

### `npm install` fails

- Confirm you are using a recent Node.js version
- Delete `node_modules` and `package-lock.json` only if you intentionally want a clean reinstall

### Voice input does not work

- Make sure microphone permission is allowed
- Try Chrome or Edge
- Use the `Type instead` control on the call screen if browser speech APIs are blocked

### The UI opens but data looks empty

- Confirm the `data/structured` folder exists in the repository
- Run the app from the repository root
