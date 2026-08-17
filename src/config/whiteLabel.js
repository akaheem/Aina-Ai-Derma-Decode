/**
 * White-Label Configuration
 *
 * Customize app name, branding, and deployment settings for white-label deployments.
 * Used by both web app and API consumers.
 */

export const whiteLabel = {
  // Brand Identity
  appName: "AinaAi",
  tagline: "Your SmartMirror",
  description: "AI-powered skin analysis and personalized skincare recommendations",

  // Logo and Colors
  logo: {
    light: "/assets/logo-light.svg",
    dark: "/assets/logo-dark.svg",
    favicon: "/assets/favicon.ico",
  },

  colors: {
    primary: "#2563eb", // Blue
    secondary: "#64748b", // Slate
    success: "#10b981", // Emerald
    warning: "#f59e0b", // Amber
    error: "#ef4444", // Red
  },

  // Contact & Support
  support: {
    email: "support@ainai.app",
    website: "https://ainai.app",
    privacy: "https://ainai.app/privacy",
    terms: "https://ainai.app/terms",
  },

  // Email Domain (for white-label)
  emailDomain: "noreply@ainai.app",

  // Firebase Project (override in white-label deployment)
  firebaseProject: "ainai-default",
};

/**
 * White-Label Deployment Guide
 *
 * Steps to deploy a white-label version for a brand (e.g., "Dr. Skin Analyzer"):
 *
 * 1. Create a new Firebase project for the white-label instance
 * 2. Set up authentication and Firestore with the same schema
 * 3. Create a .env file with the new Firebase config:
 *    VITE_FIREBASE_API_KEY=...
 *    VITE_FIREBASE_AUTH_DOMAIN=...
 *    VITE_FIREBASE_PROJECT_ID=...
 *    etc.
 * 4. Override white-label config:
 *    - Create a custom config file or pass via environment variables
 *    - Update appName, logo, colors, support email
 * 5. Deploy to separate domain:
 *    - dr-skin-analyzer.com (white-label instance)
 *    - app.ainai.app (main AinaAi)
 * 6. Set up affiliate tracking per deployment:
 *    - Use unique affiliate API keys per white-label instance
 *
 * Pricing Template:
 * - White-label license: $500/month (includes Firebase hosting, domain, basic support)
 * - Revenue share: 2% of all affiliate commissions generated through the white-label instance
 * - Premium features: +$200/month for advanced analytics and reporting
 *
 * Example: Dr. Skin Analyzer by Dermatology Clinic
 * - Base: $500/month
 * - If they generate $10K in affiliate commissions → $200/month revenue share
 * - Total: $700/month
 */

export function getWhiteLabelConfig(overrides = {}) {
  return {
    ...whiteLabel,
    ...overrides,
  };
}
