import React, { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

/**
 * CookieConsentBanner Component
 * GDPR/CCPA compliant cookie consent banner
 * Must be displayed before setting any tracking cookies
 */
export default function CookieConsentBanner() {
  const [show, setShow] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setShow(true);
    } else {
      setHasConsented(true);
    }
  }, []);

  const handleAcceptAll = async () => {
    localStorage.setItem("cookieConsent", JSON.stringify({
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    }));

    // Record consent in Firestore for GDPR compliance
    try {
      const recordConsentFunc = httpsCallable(functions, "recordConsent");
      await recordConsentFunc({
        consentType: "cookies_analytics",
        granted: true,
      });
      await recordConsentFunc({
        consentType: "cookies_marketing",
        granted: true,
      });
    } catch (err) {
      console.error("Error recording consent:", err);
    }

    setShow(false);
    setHasConsented(true);

    // Enable analytics
    if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        marketing_storage: "granted",
      });
    }
  };

  const handleRejectAll = async () => {
    localStorage.setItem("cookieConsent", JSON.stringify({
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }));

    // Record consent rejection
    try {
      const recordConsentFunc = httpsCallable(functions, "recordConsent");
      await recordConsentFunc({
        consentType: "cookies_analytics",
        granted: false,
      });
      await recordConsentFunc({
        consentType: "cookies_marketing",
        granted: false,
      });
    } catch (err) {
      console.error("Error recording consent:", err);
    }

    setShow(false);

    // Disable analytics
    if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        marketing_storage: "denied",
      });
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 p-4 z-[120]"
      style={{
        background: "rgba(255,250,251,0.9)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid var(--border-soft)",
        boxShadow: "0 -12px 40px rgba(150,70,100,0.1)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>Cookie consent</h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              We use cookies to enhance your experience, analyze site usage, and assist with our marketing efforts.
              By clicking "Accept all", you consent to the use of ALL cookies.
              <a href="/privacy" className="ml-1 font-medium" style={{ color: "var(--accent)" }}>
                Learn more
              </a>
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleRejectAll}
              className="px-5 py-2.5 rounded-full text-sm font-medium transition"
              style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border-soft)" }}
            >
              Reject
            </button>
            <button
              onClick={handleAcceptAll}
              className="lk-btn-primary"
              style={{ height: 44, padding: "0 22px" }}
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
