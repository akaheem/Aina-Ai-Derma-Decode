# Aina Ai — YouCam backend (Vercel, free Hobby plan)

This is the skin-analysis backend for **Aina Ai Derma Decode**, moved off Firebase
Cloud Functions (which needs the paid Blaze plan) onto **Vercel's free Hobby
plan**. The frontend stays exactly where it is — Firebase Hosting at the
submitted primary link **https://aina-ai-derma-decode.web.app/** — and simply
calls this backend cross-origin.

## What it does

- `POST /api/analyze` — runs the full Perfect Corp / YouCam S2S skin-analysis
  flow (RSA auth → upload → task → poll → parse result zip) and returns the same
  payload the old Cloud Function returned.
- `GET /api/health` — liveness probe; reports whether credentials are set
  (booleans only, never the values).

## Why Vercel (vs Render / Cloudflare Workers)

- `lib/youcamClient.js` needs Node's `crypto` RSA (`publicEncrypt` with
  PKCS1 padding), `adm-zip`, and `Buffer` — all fine on **Vercel's Node
  runtime**, but **not** on Cloudflare Workers (no Node `crypto`/`Buffer`).
- Vercel Hobby functions have **no idle spin-down**, so a judge clicking the
  link never waits through a 40–60s cold start (Render's free tier sleeps).
- Vercel Hobby now allows up to **300s** execution; analysis takes ~12s, and
  `vercel.json` caps this function at 60s of headroom.

## Security

- `YOUCAM_API_KEY` and `YOUCAM_SECRET_KEY` live ONLY in Vercel env vars. They
  are never sent to the browser and never logged.
- Callers must present a valid **Firebase ID token** (`Authorization: Bearer
  <token>`), verified in `lib/verifyFirebaseToken.js` against Google's public
  certs — no Firebase service-account key needed. Only logged-in users can spend
  an analysis, exactly as before.

## Deploy (one-time, ~5 minutes)

You'll do these steps yourself since they involve your Vercel account.

1. **Install the CLI and log in** (run these in your terminal with the `!`
   prefix, or a normal shell):

   ```
   npm i -g vercel
   vercel login
   ```

2. **From this folder**, link + deploy a preview:

   ```
   cd vercel-backend
   vercel
   ```

   Accept the defaults (new project, name e.g. `ainaai-youcam-backend`). It
   auto-detects `/api/*.js` as serverless functions — no framework needed.

3. **Add the three environment variables** (Production + Preview). Paste the
   real key/secret from your existing `functions/.env` when prompted:

   ```
   vercel env add YOUCAM_API_KEY
   vercel env add YOUCAM_SECRET_KEY
   vercel env add FIREBASE_PROJECT_ID       # value: aina-ai-derma-decode
   ```

   (Or add them in the Vercel dashboard → Project → Settings → Environment
   Variables.)

4. **Deploy to production:**

   ```
   vercel --prod
   ```

   Vercel prints your production URL, e.g.
   `https://ainaai-youcam-backend.vercel.app`.

5. **Verify** in a browser:

   ```
   https://<your-app>.vercel.app/api/health
   ```

   You should see `{"ok":true,...,"hasApiKey":true,"hasSecretKey":true}`.

## Wire the frontend to this backend

The frontend reads the backend URL from a Vite env var `VITE_ANALYZE_API_URL`.
Create `ainai-app/.env.production` (or `.env.local`) with:

```
VITE_ANALYZE_API_URL=https://<your-app>.vercel.app/api/analyze
```

Then rebuild + redeploy hosting (this does NOT change the primary link):

```
cd ..            # back to ainai-app
npm run build
firebase deploy --only hosting
```

If `VITE_ANALYZE_API_URL` is unset, the frontend falls back to the Firebase
callable (useful for the local emulator), so nothing breaks in dev.

## Local testing (optional)

```
cd vercel-backend
npm install
cp .env.example .env      # fill in the real values
vercel dev                # serves /api/* at http://localhost:3000
```

## Keeping the copied libs in sync

`lib/youcamClient.js` and `lib/analysisCore.js` are copied VERBATIM from
`ainai-app/functions/utils/`. If you ever change the originals, copy them here
too.
