#!/bin/bash
# AinaAi Quick Start Script

echo "=== AinaAi (DermaDecode) — Quick Start ==="
echo ""
echo "Prerequisites:"
echo "  ✓ Node.js >= 18"
echo "  ✓ Firebase CLI installed globally"
echo "  ✓ Firebase project created (AinaAi)"
echo "  ✓ YouCam API key (1,000 units)"
echo ""

echo "Step 1: Update Firebase config"
echo "  Edit: src/firebase.js"
echo "  Get config from: Firebase Console > Project Settings > Web app"
echo ""

echo "Step 2: Set YouCam API key"
read -p "Enter your YouCam API key: " YOUCAM_KEY
firebase functions:config:set youcam.apikey="$YOUCAM_KEY"

echo ""
echo "Step 3: Deploy backend"
firebase deploy --only functions,firestore:rules,storage:rules

echo ""
echo "Step 4: Build & deploy frontend"
npm run build
firebase deploy --only hosting

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your app is now live at:"
firebase hosting:sites:list | grep -oP 'https://[^/]+' || echo "Check Firebase Console for your URL"
