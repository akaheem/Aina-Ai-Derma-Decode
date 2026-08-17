# Cloud Functions Configuration

## Setup

1. Set your YouCam API key:
```bash
firebase functions:config:set youcam.apikey="YOUR_1000_UNIT_KEY"
```

2. Deploy functions:
```bash
firebase deploy --only functions
```

3. Test locally:
```bash
firebase emulators:start --only functions,firestore,auth
```

## Functions

- `analyzeSkin(imageUrl)` - Analyze skin, save to Firestore
- `tryOnApparel(userPhotoUrl, clothingImageUrl)` - Virtual try-on
- `getAnalysisHistory()` - Fetch user's past analyses
- `getOutfitHistory()` - Fetch user's past outfits
