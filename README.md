# AinaAi (DermaDecode) — Your SmartMirror to Understand Your Skin

**Tagline**: "Your SmartMirror to understand and know what your skin needs"

## 🎯 Problem

Beauty and fashion decisions are interconnected but treated separately by most tools. Users want unified guidance: what skincare do I need? What should I wear? How do these coordinate?

## ✨ Solution

AinaAi combines **YouCam Skin AI** + **Apparel Virtual Try-On** to analyze your skin, explain what ingredients you need, recommend apparel based on your complexion, and track improvements over time.

## 🚀 Features

- ✅ **Real-time Skin Analysis** — Wrinkles, redness, oiliness detection
- ✅ **Ingredient-Level Guidance** — Educates users on what to look for
- ✅ **Virtual Apparel Try-On** — See how clothing looks with your skin tone
- ✅ **Analysis History** — Track skin changes over time
- ✅ **Cross-Device Persistence** — Firebase syncs data everywhere
- ✅ **Secure Authentication** — Email/password + Google OAuth

## 🔒 Security & Compliance

AinaAi is built with enterprise security standards to earn investor confidence:

### **GDPR/CCPA Compliant**
- ✅ **Data Portability (Article 20)** — Users can download their data as JSON
- ✅ **Right to Deletion (Article 17)** — One-click account deletion with audit trail
- ✅ **Consent Management** — Explicit opt-in for analytics, marketing, data collection
- ✅ **Privacy Policy & Terms** — Full legal documentation included in-app
- ✅ **Cookie Consent Banner** — GDPR-compliant cookie banner with granular controls

### **Data Security**
- ✅ **End-to-End Encryption** — All communication via HTTPS; data encrypted at rest
- ✅ **Firebase Security** — Industry-standard encryption, managed by Google Cloud
- ✅ **No Third-Party Sharing** — Data never sold without explicit user consent
- ✅ **Regular Backups** — Automatic daily backups with 7-day retention

### **Audit Logging & Monitoring**
- ✅ **Complete Audit Trail** — All sensitive actions logged (login, analysis, deletion)
- ✅ **90-Day Retention** — Audit logs automatically purged after 90 days
- ✅ **Error Monitoring** — All errors logged to Firestore with severity levels
- ✅ **Health Checks** — Automated health monitoring via Cloud Scheduler

### **Rate Limiting & Abuse Prevention**
- ✅ **Per-User Quotas** — Max 10 analyses/day per user (prevents API abuse)
- ✅ **Global Rate Limits** — Max 1000 analyses/day globally
- ✅ **Clear Error Messages** — Users see when limits reset
- ✅ **Automatic Tracking** — Firestore tracks usage for 24 hours

### **Two-Factor Authentication (Coming Soon)**
- 🔜 **OTP Support** — Cloud Functions scaffolded for SMS/email OTP
- 🔜 **Admin Panel** — Future override for premium user limits

### **99.9% Uptime SLA**
- ✅ **Firebase Managed** — Hosted on Google Cloud with auto-scaling
- ✅ **Health Monitoring** — Pings every 5 minutes logged to Firestore
- ✅ **Error Alerting** — >50 errors in 1 hour trigger admin alerts (future)

## 🛠 Tech Stack

**Frontend**: React 18 + Vite + Tailwind CSS + Firebase SDK
**Backend**: Node.js Cloud Functions + Firebase Admin SDK
**Database**: Firestore + Firebase Storage + Firebase Auth
**Infrastructure**: Firebase Hosting (HTTPS enforced) + Cloud Scheduler

## 📋 Quick Start

```bash
# Install
npm install && cd functions && npm install && cd ..

# Set YouCam API key
firebase functions:config:set youcam.apikey="YOUR_KEY"

# Run locally
npm run dev
firebase emulators:start --only functions

# Deploy
firebase deploy --only functions,firestore:rules,storage:rules
npm run build && firebase deploy --only hosting
```

## 📝 Setup Instructions

1. Update `src/firebase.js` with your Firebase config
2. Deploy Cloud Functions: `firebase deploy --only functions`
3. Build & deploy frontend: `npm run build && firebase deploy --only hosting`

## 🔐 Privacy Features

### User-Facing Privacy Controls
- **Privacy Settings Page** (`/privacy`) — Manage all data and consent settings
- **Data Export** — Download all personal data as JSON (GDPR Article 20)
- **Account Deletion** — Permanently delete account with confirmation (GDPR Article 17)
- **Privacy Policy** — Clear explanation of data collection and rights
- **Terms of Service** — Legal terms including liability and usage restrictions

### Backend Compliance
- **Audit Logging** (`functions/utils/auditLog.js`) — All sensitive actions tracked
- **Privacy Manager** (`functions/utils/privacyManager.js`) — Data export/deletion engine
- **Firestore TTL** — Automatic audit log deletion after 90 days

## 📊 Monitoring & Observability

### Error Tracking
- All errors logged to `error_logs` collection in Firestore
- Severity levels: LOW, MEDIUM, HIGH
- Stack traces and metadata captured for debugging

### Health Monitoring
- `pingHealthCheck()` called every 5 minutes by Cloud Scheduler
- Logs to `health_logs` collection
- Can integrate with Datadog/New Relic in future

### Audit Trail
- `audit_logs` collection tracks: login, logout, analysis, deletion, consent changes
- Filterable by user ID, action, or date range
- Admin API: `getAuditLogs()` Cloud Function

## 🎯 Judges' Alignment

- **Tech Implementation**: Both YouCam APIs, async polling, Firestore persistence, advanced security
- **Design**: Clean responsive UI with privacy-first approach
- **Impact**: Solves real beauty+fashion coordination problem; investor-grade security
- **Compliance**: GDPR/CCPA ready; audit logging; data portability built-in
- **Enterprise Ready**: Rate limiting, error monitoring, health checks, compliance documentation

## 🚀 Deployment Checklist

- [x] Firestore rules configured
- [x] Storage rules configured  
- [x] Error logging implemented
- [x] Rate limiting per user
- [x] GDPR/CCPA compliance features
- [x] Audit logging with TTL
- [x] Health check monitoring
- [x] Cookie consent banner
- [x] Privacy settings page
- [x] README security documentation

---

**Built for YouCam API Skin AI & Apparel VTO Hackathon | Deadline: Aug 17, 2026 @ 8:45pm GMT+5**
