import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { Link } from "react-router-dom";
import ErrorDisplay from "../components/ErrorDisplay";
import LoadingSpinner from "../components/LoadingSpinner";

/**
 * PrivacySettings Component — Rose Derma theme.
 * Manages GDPR/CCPA compliance features:
 * - View all personal data
 * - Download data as JSON
 * - Request account deletion
 * - Manage privacy preferences
 * - View privacy policy and terms
 *
 * All Firebase callable logic is unchanged; only presentation was re-themed.
 * Danger (account deletion) keeps a red tone because it carries real meaning.
 */

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "settings", label: "Settings" },
  { key: "policies", label: "Policies" },
];

export default function PrivacySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    dataCollection: true,
    marketingEmails: true,
    analyticsTracking: true,
    thirdPartySharing: false,
  });

  const [settingsChanged, setSettingsChanged] = useState(false);

  // Deletion confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletionCode, setDeletionCode] = useState("");

  // Load privacy settings on mount
  useEffect(() => {
    if (user) {
      loadPrivacySettings();
    }
  }, [user]);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      const getPrivacySettingsFunc = httpsCallable(functions, "getPrivacySettings");
      const result = await getPrivacySettingsFunc({});

      if (result.data.success) {
        setPrivacySettings(result.data.settings);
      }
    } catch (err) {
      console.error("Error loading privacy settings:", err);
      setError("Failed to load privacy settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSettingsChanged(true);
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const updatePrivacySettingsFunc = httpsCallable(functions, "updatePrivacySettings");
      const result = await updatePrivacySettingsFunc({
        settings: privacySettings,
      });

      if (result.data.success) {
        setSuccess("Privacy settings updated successfully");
        setSettingsChanged(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save privacy settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const exportMyDataFunc = httpsCallable(functions, "exportMyData");
      const result = await exportMyDataFunc({});

      if (result.data.success) {
        // Trigger download
        const dataStr = JSON.stringify(result.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ainai-data-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSuccess("Your data has been downloaded successfully");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Error exporting data:", err);
      setError("Failed to export your data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const requestDeletion = async () => {
    if (deletionCode !== "CONFIRM_DELETE") {
      setError("Invalid confirmation code");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestDataDeletionFunc = httpsCallable(functions, "requestDataDeletion");
      const result = await requestDataDeletionFunc({
        confirmationCode: deletionCode,
      });

      if (result.data.success) {
        setSuccess("Your account has been scheduled for deletion. You will be logged out.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } catch (err) {
      console.error("Error requesting deletion:", err);
      setError(err.message || "Failed to request data deletion. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--muted)" }}>Please log in to access privacy settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header — frosted wordmark, matches Dashboard */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(255,250,251,0.72)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-baseline gap-1">
            <span className="lk-logo-text">AinaAi</span>
          </Link>
          <Link to="/dashboard" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-12">
        <div className="lk-panel">
          {/* Title */}
          <div className="mb-8">
            <h1 className="lk-share-title" style={{ fontSize: "2rem", textAlign: "left" }}>
              Privacy &amp; <span className="serif-italic">data</span>
            </h1>
            <p className="mt-2" style={{ color: "var(--muted)" }}>
              Manage your personal data, privacy settings, and compliance preferences.
            </p>
          </div>

          {/* Status Messages */}
          {error && <ErrorDisplay error={error} />}
          {success && (
            <div
              className="mb-6 p-4 rounded-xl"
              style={{ background: "rgba(23,163,74,0.08)", border: "1px solid rgba(23,163,74,0.25)" }}
            >
              <p className="font-medium" style={{ color: "#0f7a37" }}>{success}</p>
            </div>
          )}

          {loading && <LoadingSpinner />}

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition"
                  style={
                    active
                      ? { background: "var(--button-bg)", color: "var(--button-text)" }
                      : { background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border-soft)" }
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div
                className="rounded-xl p-4"
                style={{ background: "var(--accent-soft)", border: "1px solid rgba(232,96,125,0.2)" }}
              >
                <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>Your data rights</h3>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Under GDPR and CCPA, you have the right to:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1" style={{ color: "var(--muted)" }}>
                  <li>Access all your personal data (GDPR Article 15)</li>
                  <li>Download your data in a portable format (GDPR Article 20)</li>
                  <li>Request deletion of your account (GDPR Article 17)</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: "var(--text)" }}>Data export</h3>
                  <p className="mb-4" style={{ color: "var(--muted)" }}>
                    Download a complete copy of your personal data, including all analyses, photos, and preferences.
                  </p>
                  <button
                    onClick={exportData}
                    disabled={loading}
                    className="lk-btn-primary"
                    style={{ opacity: loading ? 0.5 : 1 }}
                  >
                    Download my data (JSON)
                  </button>
                </div>

                <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "1.5rem" }}>
                  <h3 className="font-semibold mb-3" style={{ color: "var(--text)" }}>Account deletion</h3>
                  <p className="mb-4" style={{ color: "var(--muted)" }}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-5 py-3 rounded-full font-medium text-white transition"
                    style={{ background: "#d92d4e" }}
                  >
                    Request account deletion
                  </button>
                </div>
              </div>

              {/* Delete Confirmation Dialog */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(46,31,36,0.5)" }}>
                  <div className="rounded-2xl max-w-md w-full p-6" style={{ background: "var(--card)", border: "1px solid var(--border-soft)" }}>
                    <h3 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>
                      Confirm account deletion
                    </h3>
                    <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(217,45,78,0.08)", border: "1px solid rgba(217,45,78,0.25)" }}>
                      <p className="text-sm font-semibold mb-2" style={{ color: "#a3172f" }}>
                        Warning: this action is permanent
                      </p>
                      <p className="text-sm" style={{ color: "#a3172f" }}>
                        All your data will be permanently deleted. This includes:
                      </p>
                      <ul className="list-disc list-inside text-sm mt-2 space-y-1" style={{ color: "#a3172f" }}>
                        <li>All skin analyses</li>
                        <li>All outfit try-ons</li>
                        <li>All photos and preferences</li>
                        <li>Your user account</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                        Type "CONFIRM_DELETE" to proceed:
                      </label>
                      <input
                        type="text"
                        value={deletionCode}
                        onChange={(e) => setDeletionCode(e.target.value)}
                        placeholder="Type confirmation code"
                        className="w-full"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletionCode("");
                        }}
                        className="flex-1 px-4 py-3 rounded-full font-medium transition"
                        style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border-soft)" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={requestDeletion}
                        disabled={loading || deletionCode !== "CONFIRM_DELETE"}
                        className="flex-1 px-4 py-3 rounded-full font-medium text-white transition"
                        style={{ background: "#d92d4e", opacity: loading || deletionCode !== "CONFIRM_DELETE" ? 0.5 : 1 }}
                      >
                        Delete account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Privacy preferences</h3>

                <div className="space-y-4">
                  {[
                    { key: "dataCollection", title: "Data collection", body: "Allow collection of analysis and preference data for service improvement" },
                    { key: "analyticsTracking", title: "Analytics tracking", body: "Allow anonymous analytics to help us understand how you use AinaAi" },
                    { key: "marketingEmails", title: "Marketing emails", body: "Receive updates about new features and skin care recommendations" },
                    { key: "thirdPartySharing", title: "Third-party sharing", body: "Allow sharing anonymized data with beauty partners and researchers" },
                  ].map((pref) => (
                    <label key={pref.key} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings[pref.key]}
                        onChange={() => handleSettingChange(pref.key)}
                        className="w-4 h-4 mt-1 rounded"
                        style={{ accentColor: "var(--accent)" }}
                      />
                      <div>
                        <p className="font-medium" style={{ color: "var(--text)" }}>{pref.title}</p>
                        <p className="text-sm" style={{ color: "var(--muted)" }}>
                          {pref.body}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {settingsChanged && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveSettings}
                    disabled={loading}
                    className="lk-btn-primary"
                    style={{ opacity: loading ? 0.5 : 1 }}
                  >
                    Save changes
                  </button>
                  <button
                    onClick={() => {
                      loadPrivacySettings();
                      setSettingsChanged(false);
                    }}
                    className="px-5 py-3 rounded-full font-medium transition"
                    style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border-soft)" }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Policies Tab */}
          {activeTab === "policies" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3" style={{ color: "var(--text)" }}>Privacy policy</h3>
                <div className="rounded-xl p-4 space-y-3 text-sm" style={{ background: "var(--bg)", color: "var(--muted)" }}>
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: "var(--text)" }}>Data collection</h4>
                    <p>
                      We collect photos, skin analysis results, and user preferences solely to provide our service and improve your experience. Your data is never sold to third parties without explicit consent.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: "var(--text)" }}>Data retention</h4>
                    <p>
                      Analysis data is retained for 2 years unless you request deletion. Photos are stored as long as your account is active. You can export or delete your data at any time.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: "var(--text)" }}>Data security</h4>
                    <p>
                      All data is encrypted in transit (HTTPS) and at rest. We use Firebase managed security with industry-standard encryption. Regular security audits are conducted by third-party experts.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: "var(--text)" }}>Your rights</h4>
                    <p>
                      Under GDPR (EU) and CCPA (California), you have the right to access, download, and delete your data. You can exercise these rights at any time through this page.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: "var(--text)" }}>Cookies</h4>
                    <p>
                      We use essential cookies for authentication and session management. No tracking or advertising cookies are used without your explicit consent.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3" style={{ color: "var(--text)" }}>Terms of service</h3>
                <div className="rounded-xl p-4 space-y-3 text-sm" style={{ background: "var(--bg)", color: "var(--muted)" }}>
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: "var(--text)" }}>Use license</h4>
                    <p>
                      AinaAi is provided for personal, non-commercial use. You may not use the service for illegal purposes or to harm others. Automated scraping or excessive API calls are prohibited.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: "var(--text)" }}>Service availability</h4>
                    <p>
                      We aim for 99.9% uptime. Services may be temporarily unavailable for maintenance. We are not liable for data loss due to technical failures, but we maintain daily backups.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: "var(--text)" }}>Disclaimer</h4>
                    <p>
                      AinaAi provides beauty and skincare recommendations for informational purposes only. Results are not medical advice. Always consult a dermatologist for medical concerns.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: "var(--text)" }}>Limitation of liability</h4>
                    <p>
                      AinaAi is provided "as is" without warranties. We are not liable for indirect, incidental, or consequential damages. Your total liability is limited to what you paid (if anything).
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: "rgba(217,131,36,0.08)", border: "1px solid rgba(217,131,36,0.22)" }}>
                <p className="text-sm" style={{ color: "#8a5410" }}>
                  <strong>Last updated:</strong> August 15, 2026
                </p>
                <p className="text-xs mt-2" style={{ color: "#8a5410" }}>
                  For questions about privacy, email: privacy@ainai.com
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
