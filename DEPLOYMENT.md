# AinaAi (DermaDecode) — Deployment & Testing Guide

## 📦 Project Structure

```
ainai-app/
├── src/                          # React frontend
│   ├── App.jsx                   # Main router
│   ├── firebase.js               # Firebase config (UPDATE THIS)
│   ├── auth.js                   # Auth helpers
│   ├── storage.js                # Storage upload
│   ├── contexts/AuthContext.jsx  # Auth context provider
│   ├── hooks/                    # Custom React hooks
│   ├── pages/                    # Page components
│   ├── components/               # Reusable components
│   ├── data/ingredients.js       # Ingredient database
│   └── index.css                 # Tailwind + base styles
├── functions/                    # Cloud Functions backend
│   ├── index.js                  # API implementations
│   └── package.json              # Backend dependencies
├── dist/                         # Build output (production)
├── firebase.json                 # Firebase config
├── firestore.rules               # Firestore security rules
├── storage.rules                 # Cloud Storage security rules
├── tailwind.config.cjs           # Tailwind config
├── postcss.config.cjs            # PostCSS config
├── vite.config.js                # Vite config
└── README.md                     # Project overview
```

## 🚀 Pre-Deployment Checklist

- [ ] Firebase project created (AinaAi)
- [ ] Firestore database created (production mode)
- [ ] Firebase Storage enabled
- [ ] Firebase Auth enabled (Email/Password + Google OAuth)
- [ ] Cloud Functions enabled
- [ ] Service account created with Editor role
- [ ] YouCam API key obtained (1,000 units)

## 🔧 Deployment Steps

### 1. Update Firebase Configuration

**File**: `src/firebase.js`

Go to Firebase Console → Project Settings → Your apps → Web app and copy the config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "ainai-dermadecode.firebaseapp.com",
  projectId: "ainai-dermadecode",
  storageBucket: "ainai-dermadecode.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE",
};
```

### 2. Set YouCam API Key for Cloud Functions

```bash
firebase functions:config:set youcam.apikey="YOUR_1000_UNIT_KEY_HERE"
```

### 3. Deploy Firebase Resources

```bash
# Deploy Cloud Functions + Firestore/Storage rules
firebase deploy --only functions,firestore:rules,storage:rules
```

Wait for deployment to complete. You should see:
```
✔  Deploy complete!
```

### 4. Build & Deploy Frontend

```bash
# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

After deployment, you'll see a URL like:
```
Hosting URL: https://ainai-dermadecode.web.app
```

## ✅ Testing the Live App

### 1. Access the App
Open: `https://ainai-dermadecode.web.app`

### 2. Test Sign-Up
- Click "Sign Up"
- Enter email (e.g., test@example.com)
- Enter password (min 6 chars)
- Click "Sign Up"
- You should be redirected to dashboard

### 3. Test Skin Analysis
- Click "🔍 Analyze Skin" tab
- Click drag-drop area to upload an image (JPG/PNG)
- Use one of the demo images from `media_content/`
- Click "Analyze Skin"
- Wait 15-30 seconds for YouCam API processing
- You should see:
  - Wrinkles, Redness, Oiliness scores
  - Ingredient guidance below each metric
  - Color-coded severity indicators

### 4. Test Ingredient Guidance Component
- In results, scroll down to see ingredient recommendations
- For each concern detected, you should see:
  - Name of ingredient
  - Benefit explanation
  - How to use instructions
  - Things to avoid

### 5. Test Virtual Try-On (Optional)
- Click "👕 Try On" tab
- Upload a user photo
- Provide a clothing image URL (or upload one)
- Click "Try On"
- Wait for processing
- See virtual try-on result

### 6. Test History (Optional)
- Click "📜 History" tab
- View all past analyses (currently shows placeholder)

### 7. Test Google OAuth (Optional)
- Log out (top-right button)
- Click "Sign in with Google"
- Sign in with your Google account
- Verify you're logged in and redirected to dashboard

### 8. Test Logout
- Click your email in top-right
- Click "Logout"
- You should be redirected to login page

## 🐛 Troubleshooting

### Build Fails
**Error**: `PostCSS` error or `Tailwind` error
**Solution**: Rebuild with cache clear:
```bash
rm -rf dist node_modules/.vite
npm run build
```

### Cloud Functions Not Deploying
**Error**: "Cannot read property 'config' of undefined"
**Solution**: Make sure you set the YouCam API key:
```bash
firebase functions:config:set youcam.apikey="YOUR_KEY"
firebase deploy --only functions
```

### App Shows Blank Page
**Error**: Firebase config is missing or incorrect
**Solution**: Check `src/firebase.js` has correct values from Firebase Console

### Skin Analysis Never Completes
**Error**: Loading spinner stuck for >2 minutes
**Solution**: 
- Check YouCam API key is correct
- Verify Cloud Functions deployed successfully
- Check browser console (F12) for errors
- API might be experiencing issues; try a different image

### Authentication Fails
**Error**: "Auth/invalid-api-key" or similar
**Solution**: 
- Verify Firebase config is correct
- Check Firebase Auth is enabled in console
- Try clearing browser cache

## 📊 Cloud Functions Logs

View real-time logs:
```bash
firebase functions:log
```

Or in Firebase Console:
- Go to Functions
- Click on function name
- View "Logs" tab

## 🔍 Debugging Local Development

### Run frontend dev server
```bash
npm run dev
# Opens http://localhost:3000
```

### Run emulators locally
```bash
firebase emulators:start --only functions,firestore,auth,storage
```

In `src/firebase.js`, uncomment the emulator connection code to test locally.

## 📱 Mobile Testing

### iOS (Safari)
```
Visit: https://ainai-dermadecode.web.app
```

### Android (Chrome)
```
Visit: https://ainai-dermadecode.web.app
```

**Mobile checklist**:
- [ ] Login works on mobile
- [ ] Image upload works
- [ ] Results display correctly (responsive)
- [ ] Ingredient guidance cards render properly
- [ ] Buttons are tap-friendly (48x48px min)

## 🎥 Demo Recording Notes

When recording demo video:
1. Use demo images from `media_content/`
2. Ensure good lighting for screen recording
3. No copyrighted music
4. 1-3 minutes total
5. Show end-to-end flow:
   - Login/sign-up (15 sec)
   - Upload image (10 sec)
   - Show skin analysis results (15 sec)
   - Highlight ingredient guidance (20 sec)
   - Try-on (optional, 15 sec)
   - Closing statement (10 sec)

## 📋 Submission Checklist (Devpost)

- [ ] GitHub repo link (public, code visible)
- [ ] Firebase hosting URL (live, working)
- [ ] README.md in repo
- [ ] Demo video (YouTube link, unlisted OK)
- [ ] 5-8 screenshots (PNG/JPG)
- [ ] Submission description (150-300 words)
- [ ] Tech stack listed
- [ ] API units estimated

## 🎯 Success Criteria

✅ App deploys to Firebase Hosting without errors
✅ Login/sign-up works (email + Google OAuth)
✅ Skin analysis completes in < 2 min
✅ Results display with correct metrics
✅ Ingredient guidance component renders
✅ Mobile responsive (iOS + Android)
✅ No console errors (F12)
✅ Demo video shows end-to-end flow

---

**Deployment Duration**: ~10-15 minutes
**Cost**: Free (Firebase free tier covers this)
**Support**: Firebase docs at firebase.google.com/docs
