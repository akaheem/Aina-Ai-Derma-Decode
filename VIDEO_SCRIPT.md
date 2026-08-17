# VIDEO_SCRIPT — AinaAi Demo Video (target 2:40, hard cap 3:00)

> Record this against the live app: `[LIVE_URL]` (expected `https://aina-ai-derma-decode.web.app` — verify it loads before recording).
> Script and shot list below. Narration lines are read-aloud ready; keep them, tighten them, or improvise close to the wording.
>
> **About the existing mp4:** `C:\skin\media_content\YouCam API Skin AI & Apparel VTO Hackathon.mp4` is **18m50s long** — it is the hackathon's own kickoff/webinar video, NOT a demo of this app. Do not submit it as your demo. (If you want 5 seconds of YouCam-branded b-roll from it, that's the only fitting use, and it's optional.)
> **Demo image:** use a real, well-lit selfie (yours or a consented volunteer's). The two images in `media_content` (`youcamapi1.jpg`, `youcamapi2.png`) are YouCam marketing collages showing feature grids and an API curl example — not portrait photos and not reliable analyzer input.

---

## Recording setup (do first)

- [ ] Live URL confirmed working; logged out state
- [ ] A test account ready (email/password) + Google button as alternative
- [ ] Selfie photo (JPG/PNG, < 10MB) and one clothing product photo (URL) for try-on
- [ ] One prior analysis already in the account (so History tab isn't empty — record it earlier)
- [ ] 1920x1080 screen recording, mic checked, phone on Do Not Disturb
- [ ] Browser zoom ~110%, clean profile (no extensions)
- [ ] Record a 10s mobile clip (phone or devtools mobile view) for the responsive segment

---

## Script + shot list

| # | Time | Shot (what's on screen) | Narration (voice-over) |
|---|------|--------------------------|------------------------|
| 1 | 0:00–0:12 | Title card on hero background: "AinaAi (DermaDecode) — Your SmartMirror". Cut to login page. | "Every skin app gives you a score. None of them tell you what to do about it. This is AinaAi — your SmartMirror. It reads your skin, explains what it needs, and even shows you what to wear." |
| 2 | 0:12–0:28 | Sign-up flow: click "Sign up", type email + password, submit → dashboard appears. (Flash the "Sign in with Google" button with a hover.) | "Getting started takes seconds — email or Google. Your data is yours: you can export or delete it at any time." |
| 3 | 0:28–1:05 | Analyze tab → drag in selfie → preview appears → click Analyze → loading spinner ("Analyzing your skin..."). While waiting, cut to a simple architecture overlay: Browser → Cloud Function (API key) → YouCam task API → poll → Firestore. | "I upload a selfie. The photo goes to Firebase Storage, and a Cloud Function calls the YouCam Skin AI API — the key never touches the browser. It's an async task API, so the function polls until the result is ready, with retries, quotas and error handling built in." |
| 4 | 1:05–1:25 | Results appear: Wrinkles / Redness / Oiliness severity cards with color-coded bars. Point/cursor at each score. | "In under thirty seconds: my wrinkles, redness, and oiliness — each scored and severity-rated." |
| 5 | 1:25–2:00 | Scroll through Ingredient Guidance: concern → ingredient cards (Retinol, Niacinamide, Centella Asiatica...), each showing benefit / how to use / what to avoid. Spend the most screen time here. | "But here's what makes AinaAi different. For every concern, we translate the science into ingredients. Wrinkles? Retinol and peptides — applied at night, two or three times a week to start. Oiliness? Niacinamide and salicylic acid. Redness? Centella asiatica. Each card tells you why it works, how to use it, and what not to mix it with. Not product ads — ingredient education." |
| 6 | 2:00–2:20 | Try-on tab: select user photo, enter clothing image URL, run try-on → result preview. | "AinaAi also speaks fashion: the YouCam Apparel Try-On API lets you preview clothes on your own photo — beauty and wardrobe decisions, together." |
| 7 | 2:20–2:38 | History tab: analyses list → comparison view → Recharts trend line → Skin Health Score → click PDF export. | "Every analysis is saved, so you can compare results over time, watch the trends, get a single skin health score, and export a PDF report." |
| 8 | 2:38–2:52 | Quick mobile clip (phone or responsive window): dashboard, swipe between tabs. | "It's fully responsive — swipe between analysis, try-on, and history on your phone." |
| 9 | 2:52–3:00 | End card: "AinaAi — skin intelligence, not just skin scores. Built with YouCam Skin AI + Apparel VTO APIs." Show live URL + "Try it" line. | "AinaAi — built solo for the YouCam API Hackathon, with both the Skin AI and Apparel VTO APIs. Try it yourself at the link below." |

**Total: 3:00 max. If you need to trim, compress shots 2 and 7 first — never cut shot 5 (ingredient guidance is the differentiator).**

---

## Fallback plans (record-day insurance)

- **Try-on fails live**: pre-record shot 6 earlier and edit it in; narrate over it. Mark nothing as "live" in that segment.
- **Analysis is slow (15–30s is normal)**: keep the architecture overlay (shot 3) on screen while polling — it fills dead air and scores Tech points.
- **History is empty**: run two analyses (different selfies) before recording so History/Comparison/Trend have data.
- **Site is down**: screen-record localhost (`npm run dev` + emulators) as an emergency cut — but fix the deploy first, judges test the live URL.

## After recording

1. Edit to ≤ 3:00; no copyrighted music (YouTube Audio Library only, or clean voice).
2. Export 1080p; title: "AinaAi — AI Skin Analysis & Ingredient Guidance (YouCam API Hackathon)".
3. Upload to YouTube → **Unlisted** → copy URL into `SUBMISSION_FINAL.md` `[YOUTUBE_URL]` and the Devpost form.
4. While in the editor, pull your 5–8 screenshots from the same session (list in `SUBMISSION_FINAL.md`).
