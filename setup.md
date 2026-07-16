# Frontend Setup

## Overview

This repository contains a frontend-only React application for the Member & Claims Intelligence prototype.

- Stack: `React` + `TypeScript` + `Vite` + `Tailwind CSS`
- Data source: local CSV files in `data/structured`
- No backend is required
- Voice call behavior uses browser speech APIs when available

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

- The UI reads directly from the CSV files in `data/structured`
- There are no external API calls required for the current frontend
- If you change CSV contents, restart the dev server if needed and refresh the browser

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
