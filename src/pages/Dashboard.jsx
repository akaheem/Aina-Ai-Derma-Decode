import React, { useState, useEffect, useRef } from "react";
import { useSkinAnalysis } from "../hooks/useSkinAnalysis";
import { useApparelVTO } from "../hooks/useApparelVTO";
import { UploadSection } from "../components/UploadSection";
import { SkinAnalysisResults, IngredientGuidance } from "../components/SkinAnalysisResults";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { AnalysisHistory } from "../components/AnalysisHistory";
import { ComparisonView } from "../components/ComparisonView";
import { TrendChart } from "../components/TrendChart";
import { SkinHealthScore } from "../components/SkinHealthScore";
import { ReportExport } from "../components/ReportExport";
import { useAuth } from "../contexts/AuthContext";
import { logOut } from "../auth";
import { useNavigate, Link } from "react-router-dom";
import { Search, Shirt, ScrollText, ChevronDown } from "lucide-react";

/**
 * Mobile-Optimized Dashboard — Rose Derma theme.
 * Logic (tabs, swipe, VTO handlers, lazy child components) is unchanged from
 * the original; only presentation was re-themed to the editorial system.
 */

const TAB_META = {
  analyze: { label: "Analyze skin", icon: Search },
  tryon: { label: "Try on", icon: Shirt },
  history: { label: "History", icon: ScrollText },
};

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("analyze");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    ingredients: true,
    history: false,
  });
  const [touchStartX, setTouchStartX] = useState(null);
  const tabsRef = useRef(null);

  const { result: analysisResult, loading: analysisLoading } = useSkinAnalysis();
  const { result: vtoResult, loading: vtoLoading, tryOn } = useApparelVTO();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vtoPhotoFile, setVtoPhotoFile] = useState(null);
  const [clothingImageUrl, setClothingImageUrl] = useState("");

  const tabs = ["analyze", "tryon", "history"];

  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleVTOPhotoChange = (e) => {
    setVtoPhotoFile(e.target.files?.[0] || null);
  };

  const handleTryOn = async () => {
    if (vtoPhotoFile && clothingImageUrl) {
      const photoUrl = await import("../storage").then((m) =>
        m.uploadImage(user.uid, vtoPhotoFile)
      );
      await tryOn(photoUrl, clothingImageUrl, {});
    }
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
    }
    if (diff < -50) {
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
    }
    setTouchStartX(null);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2"
        style={{ background: "var(--accent)", color: "var(--button-text)" }}
      >
        Skip to main content
      </a>

      {/* Header — frosted, editorial wordmark */}
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
            <span className="text-xs sm:text-sm hidden sm:block" style={{ color: "var(--muted)" }}>
              · Your SmartMirror
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/privacy" className="text-sm font-medium" style={{ color: "var(--muted)" }}>
              Privacy
            </Link>
            <span className="text-sm truncate max-w-[180px]" style={{ color: "var(--muted)" }}>
              {user?.email}
            </span>
            <button onClick={handleLogout} className="lk-btn-primary" style={{ height: 44, padding: "0 20px" }}>
              Log out
            </button>
          </div>

          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl min-h-[48px] min-w-[48px] flex items-center justify-center"
              style={{ border: "1px solid var(--border-soft)", background: "var(--card)" }}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" style={{ color: "var(--text)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden" style={{ borderTop: "1px solid var(--border-soft)", background: "var(--card)" }}>
            <div className="px-4 py-3 space-y-3">
              <p className="text-sm truncate" style={{ color: "var(--muted)" }}>{user?.email}</p>
              <Link to="/privacy" className="block text-sm font-medium" style={{ color: "var(--muted)" }}>
                Privacy &amp; data
              </Link>
              <button onClick={handleLogout} className="lk-btn-primary w-full" style={{ width: "100%" }}>
                Log out
              </button>
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Pill tabs */}
        <div
          ref={tabsRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex gap-2 mb-8 overflow-x-auto -mx-3 sm:-mx-4 px-3 sm:px-4"
          role="tablist"
          aria-label="Main navigation tabs"
        >
          {tabs.map((tab) => {
            const Icon = TAB_META[tab].icon;
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={active}
                aria-controls={`${tab}-panel`}
                className="flex items-center gap-2 px-5 py-3 rounded-full font-medium whitespace-nowrap text-sm transition"
                style={
                  active
                    ? { background: "var(--button-bg)", color: "var(--button-text)" }
                    : { background: "var(--card)", color: "var(--muted)", border: "1px solid var(--border-soft)" }
                }
              >
                <Icon size={16} />
                {TAB_META[tab].label}
              </button>
            );
          })}
        </div>

        <div>
          {/* Analyze */}
          {activeTab === "analyze" && (
            <div id="analyze-panel" role="tabpanel" aria-labelledby="analyze" className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <UploadSection />

              {analysisLoading && (
                <div className="lk-panel flex items-center justify-center min-h-[300px]">
                  <LoadingSpinner />
                </div>
              )}

              {analysisResult && !analysisLoading && (
                <div className="space-y-4 sm:space-y-6">
                  <SkinAnalysisResults analysis={analysisResult} imageUrl={analysisResult.imageUrl} />

                  <div className="lk-panel overflow-hidden" style={{ padding: 0 }}>
                    <button
                      onClick={() => toggleSection("ingredients")}
                      className="w-full px-6 py-4 flex items-center justify-between font-semibold min-h-[48px]"
                      style={{ color: "var(--text)" }}
                      aria-expanded={expandedSections.ingredients}
                      aria-controls="ingredients-content"
                    >
                      <span className="text-left">Ingredient guidance</span>
                      <ChevronDown size={20} className={`transition-transform ${expandedSections.ingredients ? "rotate-180" : ""}`} />
                    </button>
                    {expandedSections.ingredients && (
                      <div id="ingredients-content" className="px-6 pb-6">
                        <IngredientGuidance analysis={analysisResult} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Try On */}
          {activeTab === "tryon" && (
            <div id="tryon-panel" role="tabpanel" aria-labelledby="tryon" className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="lk-panel">
                <h2 className="text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>
                  Virtual try-on
                </h2>
                <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
                  See how an outfit looks with your complexion.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }} htmlFor="vto-photo">
                      Upload your photo
                    </label>
                    <input id="vto-photo" type="file" accept="image/*" onChange={handleVTOPhotoChange} className="w-full" aria-label="Upload your photo for virtual try-on" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }} htmlFor="clothing-url">
                      Clothing image URL
                    </label>
                    <input id="clothing-url" type="url" placeholder="https://example.com/clothing.jpg" value={clothingImageUrl} onChange={(e) => setClothingImageUrl(e.target.value)} className="w-full" aria-label="Enter clothing image URL" />
                  </div>

                  <button
                    onClick={handleTryOn}
                    disabled={vtoLoading || !vtoPhotoFile || !clothingImageUrl}
                    className="lk-btn-primary w-full"
                    style={{ width: "100%" }}
                    aria-busy={vtoLoading}
                  >
                    {vtoLoading ? "Processing…" : "Try on"}
                  </button>
                </div>
              </div>

              {vtoLoading && (
                <div className="lk-panel flex items-center justify-center min-h-[300px]">
                  <LoadingSpinner />
                </div>
              )}

              {vtoResult && !vtoLoading && (
                <div className="lk-panel">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: "var(--text)" }}>
                    Try-on result
                  </h3>
                  <div className="space-y-4">
                    {vtoResult.preview_image && (
                      <img src={vtoResult.preview_image} alt="Virtual try-on result showing outfit on your body" className="w-full rounded-2xl" loading="lazy" />
                    )}
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      ID: {vtoResult.outfitId}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History */}
          {activeTab === "history" && (
            <div id="history-panel" role="tabpanel" aria-labelledby="history" className="space-y-6">
              <SkinHealthScore />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <AnalysisHistory />
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <ComparisonView />
                  <TrendChart />
                </div>
              </div>
              <ReportExport />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
