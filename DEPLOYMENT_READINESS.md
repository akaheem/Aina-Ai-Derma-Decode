# PRE-DEPLOYMENT CHECKLIST — HACKATHON SUBMISSION

**Status**: READY TO DEPLOY
**Time**: Aug 14, 2026 @ 8:57pm UTC (≈ Aug 15, 2:57am GMT+5)
**Deadline**: Aug 17 @ 3:45pm UTC (≈ Aug 17, 8:45pm GMT+5)
**Hours Until Deadline**: ~67 hours

---

## 🚀 IMMEDIATE ACTION ITEMS (YOU NEED TO DO THESE)

### 1️⃣ GET FIREBASE CONFIG
**Required to deploy**

Go to: https://console.firebase.google.com/
1. Click your **AinaAi** project
2. Click **⚙️ Project Settings** (gear icon, top-left)
3. Scroll down to **Your apps**
4. Click the **Web app** icon (</> symbol)
5. Copy the entire `firebaseConfig` object
6. **Paste it into** `C:/skin/ainai-app/src/firebase.js` (replace placeholder)

Example (yours will be different):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "ainai-dermadecode.firebaseapp.com",
  projectId: "ainai-dermadecode",
  storageBucket: "ainai-dermadecode.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**Save the file after pasting.**

### 2️⃣ CONFIRM YOUCOM API KEY
**Required to deploy**

You should have a **1,000-unit API key** from YouCam. It looks like:
```
sk-1234567890abcdefghijklmnop
```

(Keep this safe — we'll set it in Cloud Functions next)

### 3️⃣ DEPLOY TO FIREBASE (10 minutes)

Open **PowerShell/Terminal** in `C:/skin/ainai-app/` and run:

```bash
# Step 1: Set your YouCam API key
firebase functions:config:set youcam.apikey="YOUR_1000_UNIT_KEY_HERE"

# Step 2: Deploy backend (Cloud Functions + Firestore rules)
firebase deploy --only functions,firestore:rules,storage:rules

# Wait for: "✔ Deploy complete!"

# Step 3: Build frontend
npm run build

# Wait for: Build output showing bundle sizes

# Step 4: Deploy frontend
firebase deploy --only hosting

# Wait for: "✔ Hosting deployed successfully!"
```

After Step 4, you'll see output like:
```
Hosting URL: https://ainai-dermadecode.web.app
```

**Save that URL.** That's your live app.

### 4️⃣ TEST LIVE APP (5 minutes)

Open: `https://ainai-dermadecode.web.app`

Quick test:
1. Sign up with test email (e.g., test@example.com)
2. You should see dashboard
3. Click "🔍 Analyze Skin" tab
4. Drag one of these images to upload:
   - `C:\skin\media_content\youcamapi1.jpg`
   - `C:\skin\media_content\youcamapi2.png`
5. Click "Analyze Skin"
6. Wait 15-30 seconds
7. Verify you see: Wrinkles, Redness, Oiliness scores + ingredient guidance

**If anything fails**: Check browser console (F12 > Console) for error messages.

### 5️⃣ RECORD DEMO VIDEO (30 minutes)

**Script** (keep it simple, 1-2 minutes):

```
[0-10 sec] "This is AinaAi. It analyzes your skin and tells you 
exactly what ingredients help your specific concerns."

[10-30 sec] Show sign-up flow (email/password)

[30-60 sec] Upload demo image → show loading → show results
"Within 30 seconds, we get your skin metrics."

[60-90 sec] Highlight ingredient guidance
"But here's what makes AinaAi different — we educate you on 
what ingredients actually work. For redness, try Centella Asiatica 
or Azelaic Acid. For wrinkles, retinol is proven effective."

[90-120 sec] "Built with YouCam's Skin AI API. 
Your SmartMirror to understand your skin. That's AinaAi."
```

**Recording tips**:
- Use screen recording software (built-in for Mac/Windows 11)
- Record full screen or mobile phone screen
- Clear audio (no background noise)
- NO copyrighted music
- 1-3 minutes total

**Upload to YouTube**:
1. Go to YouTube.com
2. Click upload (camera icon)
3. Upload your video
4. Title: "AinaAi - Personalized Skin Analysis Demo"
5. Set to **Unlisted** (not private, not public)
6. Copy the YouTube URL (e.g., https://www.youtube.com/watch?v=abc123)

### 6️⃣ TAKE SCREENSHOTS (15 minutes)

Capture these 8 screens:

1. **Login/Sign-up page**
2. **Dashboard (empty)** before uploading
3. **Upload section** with image preview
4. **Loading spinner** ("Analyzing your skin...")
5. **Skin analysis results** (metrics cards)
6. **Ingredient guidance** section (MOST IMPORTANT!)
7. **Try-On tab** (if working)
8. **Mobile view** of dashboard

Save as PNG/JPG (1920x1080 or device resolution).

### 7️⃣ SUBMIT ON DEVPOST (30 minutes)

Go to: https://www.devpost.com/software/ainai-dermadecode (or find the hackathon)

**Fill in these fields**:

**Project Name**: AinaAi (DermaDecode)

**Tagline**: Your SmartMirror to understand and know what your skin needs

**Description** (150-300 words, copy from below):
```
AinaAi is a personalized skin analysis app that uses YouCam's 
Skin AI API to analyze your skin and provide ingredient-level 
guidance on what actually works for your concerns.

Problem: Most skin apps just show you metrics (wrinkles: 85%). 
Users don't know what to do next. What ingredients help? Where 
do you buy them? What's a realistic routine?

Solution: AinaAi analyzes your skin and educates you on specific 
ingredients proven to help your concerns:
- Hyaluronic acid for dryness
- Retinol for wrinkles
- Niacinamide for oiliness
- Centella asiatica for sensitivity

Features:
✓ Real-time skin analysis (wrinkles, redness, oiliness, etc.)
✓ Personalized ingredient recommendations
✓ Routine builder (AM/PM steps tailored to your skin)
✓ History tracking with improvement metrics
✓ Cross-device sync

Impact: Users make better skincare purchases. Retailers increase 
conversions by providing confidence. Beauty brands partner for 
product recommendations.

Tech: React + Firebase + YouCam Skin AI API + Cloud Functions
```

**GitHub Link**: https://github.com/YOUR_USERNAME/ainai-dermadecode
(or just provide C:/skin/ainai-app if private repo)

**Demo Video**: (your YouTube URL from Step 5)

**Screenshots**: Upload the 8 images from Step 6

**Tech Stack**: 
React 18, Vite, Tailwind CSS, Node.js, Firebase (Auth, Firestore, Storage, Cloud Functions), YouCam Skin AI API

**Other fields**: Fill in as appropriate

Click **SUBMIT**

---

## ✅ FINAL PRE-SUBMISSION CHECKLIST

**Code**:
- [ ] src/firebase.js updated with real config
- [ ] YouCam API key set in Cloud Functions
- [ ] No API key exposed in frontend code (verify with F12 > Network tab)

**Deployment**:
- [ ] Backend deployed (firebase deploy --only functions)
- [ ] Frontend deployed (firebase deploy --only hosting)
- [ ] Live URL accessible and working
- [ ] Can sign up / log in
- [ ] Can upload image and get results
- [ ] Ingredient guidance displays

**Demo & Screenshots**:
- [ ] Demo video recorded (1-3 min)
- [ ] Video uploaded to YouTube
- [ ] 8 screenshots captured
- [ ] All files saved and ready

**Submission**:
- [ ] GitHub repo is public (or shared with event email)
- [ ] README.md is clear and complete
- [ ] Devpost form filled out completely
- [ ] All links verified (GitHub, YouTube, Firebase URL)

---

## 🎬 WHAT DEVPOST JUDGES WILL SEE

1. **Your GitHub repo** — They'll read your code and README
2. **Your live app** (Firebase URL) — They'll test sign-up, upload, analysis
3. **Your demo video** — They'll watch to see the flow
4. **Your screenshots** — They'll review the UI and features
5. **Your description** — They'll understand the problem you're solving

**What impresses judges**:
✅ Working product (not broken)
✅ Real APIs integrated (YouCam)
✅ Professional UI (not wireframes)
✅ Clear problem-solving (ingredient guidance)
✅ Production-ready code (error handling, security)

---

## 🕐 TIMELINE

**Aug 14 (TODAY)** - 8:57pm UTC:
- [ ] Get Firebase config ← YOU
- [ ] Confirm YouCam API key ← YOU
- Agents working on Phase 2 features ← BACKGROUND

**Aug 15** - First thing in morning (Asia time):
- [ ] Deploy to Firebase (10 min) ← YOU
- [ ] Test live app (5 min) ← YOU
- [ ] Record demo video (30 min) ← YOU
- [ ] Take screenshots (15 min) ← YOU
- [ ] Submit on Devpost (30 min) ← YOU
- **TOTAL: ~90 minutes**

**Aug 15-17** (while judges reviewing):
- Agents finish Phase 2 features
- Integrate new features into main app
- Update live app with improvements
- (Optional: update Devpost with "Updated features" note)

---

## 💰 HACKATHON DETAILS

**Prize Pool**: $6,000 total
- 1st: $5,000
- 2nd: $1,000
- 3-5th: 5,000 YouCam units (~$275)

**Judging Criteria**:
1. Technological Implementation (skillful API integration)
2. Design (complete product experience)
3. Potential Impact (solves real problem)
4. Quality of Idea (creative, non-obvious)

**Deadline**: Aug 17, 2026 @ 8:45pm GMT+5 = Aug 17, 3:45pm UTC

---

## 🚀 NEXT STEPS

**Right now**:
1. Reply with your Firebase config and YouCam API key
2. I'll guide you through deployment step-by-step

**Once deployed**:
- Follow demo/screenshot/submission steps
- Submit by Aug 17 deadline
- Agents continue building Phase 2 in parallel

**After submission**:
- Agents deliver Phase 2 features
- Integrate into live app
- You have a production-ready startup

---

## 📞 SUPPORT

**If deployment fails**:
- Check browser console (F12 > Console) for specific errors
- Run: `firebase functions:log` to see Cloud Function errors
- Reply with the error message, I'll help fix

**If live app doesn't work**:
- Verify Firebase config was pasted correctly
- Check YouCam API key is set: `firebase functions:config:get youcam`
- Try incognito browser window
- Clear browser cache

**Questions**: Ask in replies, I'll respond immediately

---

## ✨ YOU'RE THIS CLOSE

Everything is ready. Just need:
1. Firebase config (copy-paste from console)
2. YouCam API key (from your YouCam dashboard)
3. Follow deployment steps (copy-paste commands)

**That's it.** Then submit and you're in the competition with a working, impressive product.

4 agents are building Phase 2 features in parallel. By Aug 19, you'll have a real startup.

---

**Ready?** Send me your Firebase config and YouCam API key (in reply), and we'll deploy immediately.🚀
