# SUBMISSION_FINAL — AinaAi (DermaDecode)

> Copy-paste-ready Devpost submission text. Every feature claimed below is verified to exist in the codebase (`src/`, `functions/`) as of Aug 16, 2026.
> Placeholders in `[BRACKETS]` must be filled in before submitting.
> Deadline: **Aug 17, 2026 @ 8:45pm GMT+5 (15:45 UTC)**.

---

## Project Title

**AinaAi (DermaDecode)**

## Tagline (10 words max)

Your SmartMirror to understand and know what your skin needs

---

## Elevator Pitch (100 words)

AinaAi is your SmartMirror: it reads your skin, then tells you what to actually do about it. Upload a selfie and YouCam Skin AI measures wrinkles, redness, and oiliness in seconds. AinaAi then goes beyond metrics with dermatology-informed ingredient guidance — retinol for wrinkles, niacinamide for oiliness, centella for redness — explaining why each works and how to use it. An integrated apparel virtual try-on rounds out the picture, and every analysis is saved to Firebase so you can track improvement over time. Built solo on React, Cloud Functions, and both YouCam APIs. AinaAi: That's skin intelligence, not just skin scores.

---

## Inspiration (Devpost field)

Most skin apps end at a score. You upload a selfie, get "wrinkles: 68%", and are left wondering: what do I do now? Which ingredients actually help me, and how do I use them? Meanwhile, beauty and fashion decisions are treated as separate worlds even though they are made in front of the same mirror. AinaAi was built to close that gap: real AI skin analysis, translated into ingredient-level education, connected to what you wear.

## What it does

1. **Analyzes your skin** — Upload a selfie; YouCam Skin AI returns per-concern severity for wrinkles, redness, and oiliness, shown as clear severity cards.
2. **Educates, not just scores** — The ingredient guidance engine maps each detected concern to proven active ingredients (e.g., retinol/peptides/vitamin C for wrinkles, niacinamide/salicylic acid for oiliness, centella asiatica/azelaic acid/allantoin for redness) with benefit, how-to-use, and what-to-avoid guidance.
3. **Virtual apparel try-on** — Try clothing on your own photo with YouCam Apparel VTO, coordinated with your look.
4. **Tracks progress** — Every analysis persists in Firestore: history list, side-by-side comparison, trend charts, an overall Skin Health Score, and PDF report export.
5. **Respects your data** — One-click JSON data export, account deletion, granular consent settings, cookie banner, and audit logging (GDPR/CCPA-style controls).

## How we built it

**Architecture**

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Tailwind CSS 4, React Router 7 |
| Backend | Node.js Firebase Cloud Functions (callable API proxy) |
| Database | Firestore (analyses, outfits, error/audit logs) + Firebase Storage (photos) |
| Auth | Firebase Authentication (email/password + Google OAuth) |
| Charts/PDF | Recharts, html2canvas + jsPDF |
| Deployment | Firebase Hosting + Cloud Functions |

**How the YouCam APIs are used**

- The frontend never touches YouCam credentials. Photos upload to Firebase Storage, then the browser calls two Cloud Functions — `analyzeSkin` and `tryOnApparel` — which hold the API key server-side.
- Both functions use YouCam's asynchronous task API (the `s2s/v1.0/task` endpoint from the hackathon docs): they POST a job (source photo; for try-on also the destination clothing image), receive a `task_id`, then poll until the task completes.
- Reliability is built in: exponential-backoff retries on transient failures, 2-second polling cadence up to a 300-second cap, typed error mapping to friendly user messages, per-user rate limiting (10 analyses/day, 20 try-ons/day), and full error logging to Firestore.
- Results are persisted to Firestore keyed by user, which powers the history, comparison, and trend features.

**Security & privacy**

- API keys live only in Cloud Functions config — never in the client bundle.
- Firestore and Storage rules enforce per-user data isolation.
- GDPR-style controls: data export (JSON), account deletion with audit trail, consent management, cookie banner; audit logs auto-expire after 90 days.

## Challenges we ran into

- Wrapping YouCam's async task pattern (start + poll) in resilient Cloud Functions with retries, timeouts, and quota protection instead of naive one-shot calls.
- Translating raw API metrics into severity tiers that drive a correct ingredient mapping (thresholds matter: 75+ triggers a "high" concern).
- Keeping the whole flow mobile-first: swipeable tabs, 48px touch targets, client-side image compression before upload.
- Protecting the API key and user photos end-to-end (Storage rules + server-side proxy).

## Accomplishments we're proud of

- Ingredient guidance turns a metrics wrapper into an educational product — the "what do I do next" layer most tools skip.
- Both hackathon APIs integrated in one coherent flow through a production-shaped backend (auth, quotas, retries, audit logs).
- Full progress tracking: history, comparison, Recharts trends, Skin Health Score, PDF export.
- Privacy treated as a feature, not fine print.

## What we learned

- YouCam's async task pattern and how to poll it responsibly without burning quota.
- Firebase callable functions as a secure API proxy pattern.
- How much UI work honest error handling requires (every failure mode a user can hit).

## What's next for AinaAi

- Routine builder (AM/PM) and shopping list on top of the existing ingredient engine (components already scaffolded).
- Progress photos with visual before/after sliders.
- E-commerce integration for ingredient-matched product recommendations.

---

## Links (fill in before submitting)

- **Live app**: `[LIVE_URL]` — expected `https://aina-ai-derma-decode.web.app` once the in-progress deploy finishes; verify before pasting.
- **GitHub repo (public)**: `[GITHUB_URL]`
- **Demo video (YouTube, unlisted ok)**: `[YOUTUBE_URL]` — see `VIDEO_SCRIPT.md` (target ≤ 3 min).

## Screenshots to capture (upload 5-8 to Devpost)

1. Login page (email + Google)
2. Dashboard — Analyze tab with upload area
3. Analysis loading state
4. Results: severity cards (wrinkles/redness/oiliness)
5. **Ingredient guidance (the money shot)**
6. Try-on tab
7. History/trends/comparison
8. Mobile view (narrow window or phone)

## Built with (Devpost tech stack tags)

React, Vite, Tailwind CSS, JavaScript, Node.js, Firebase (Auth, Firestore, Storage, Cloud Functions, Hosting), YouCam Skin AI API, YouCam Apparel VTO API, Recharts, jsPDF, html2canvas

---

## Team (leave blank for human to fill)

- Team name: ______________________
- Member 1 name: ______________________
- Role: ______________________
- Email (Devpost account): ______________________
- Github username: ______________________

---

## Pre-submit human checklist

- [ ] Deploy finished; live URL loads (check `https://aina-ai-derma-decode.web.app`)
- [ ] Sign-up (email or Google) works; analysis completes on a real selfie
- [ ] GitHub repo created, public, `.gitignore` in place (never commit `functions` env keys or `media_content/APIs.txt`)
- [ ] Demo video recorded + uploaded (see `VIDEO_SCRIPT.md`)
- [ ] Screenshots captured
- [ ] All `[BRACKETS]` above replaced
- [ ] Devpost form filled, links verified, SUBMIT clicked before Aug 17, 8:45pm GMT+5
