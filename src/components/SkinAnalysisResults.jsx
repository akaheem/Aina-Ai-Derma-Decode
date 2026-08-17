import React, { useState, useMemo } from "react";
import { getIngredientGuidance } from "../data/ingredients";

/**
 * Skin Analysis Results — Rose Derma theme.
 *
 * Renders the full Perfect Corp / YouCam skin-analysis payload:
 *   - overall skin score + estimated skin age
 *   - an interactive heatmap viewer (the analyzed base image with a selectable,
 *     semi-transparent concern mask composited on top — the same overlays the
 *     API returns in its result zip)
 *   - a score card for every detected concern (up to 14)
 *
 * Score semantics: the API's `ui_score` is a *health* score (higher = better).
 * `severity` = 100 - ui_score (higher = more of a concern). The traffic-light
 * (green healthy → amber monitor → rose needs-attention) keys off the health
 * score so a full green bar reads as "great".
 *
 * Backward compatible: if only the legacy flat fields (wrinkles/redness/
 * oiliness severities) are present, it falls back to the original 3-metric view.
 */

// Concern-level → theme tokens (AA-contrast text/dot colors).
const SEVERITY = {
  high: { label: "Needs attention", dot: "#e8607d", text: "#a83452", track: "rgba(232,96,125,0.16)" },
  medium: { label: "Monitor", dot: "#d98324", text: "#8a5410", track: "rgba(217,131,36,0.16)" },
  low: { label: "Healthy", dot: "#17a34a", text: "#0f7a37", track: "rgba(23,163,74,0.16)" },
};

// Display order + friendly labels for every concern the API can return.
const CONCERN_META = [
  { key: "wrinkle", label: "Wrinkles" },
  { key: "firmness", label: "Firmness" },
  { key: "texture", label: "Texture" },
  { key: "pore", label: "Pores" },
  { key: "oiliness", label: "Oiliness" },
  { key: "acne", label: "Acne" },
  { key: "redness", label: "Redness" },
  { key: "age_spot", label: "Age spots" },
  { key: "radiance", label: "Radiance" },
  { key: "moisture", label: "Moisture" },
  { key: "dark_circle_v2", label: "Dark circles" },
  { key: "eye_bag", label: "Eye bags" },
  { key: "droopy_upper_eyelid", label: "Upper eyelid" },
  { key: "droopy_lower_eyelid", label: "Lower eyelid" },
];

// Health score (higher = better) → concern band.
const bandFromHealth = (health) => {
  if (health >= 75) return "low";
  if (health >= 50) return "medium";
  return "high";
};

const clampScore = (n) => Math.max(0, Math.min(100, Math.round(n ?? 0)));

export function SkinAnalysisResults({ analysis, imageUrl }) {
  const scores = analysis?.scores && typeof analysis.scores === "object" ? analysis.scores : null;
  const masks = analysis?.masks && typeof analysis.masks === "object" ? analysis.masks : {};
  const baseImage = analysis?.baseImage || imageUrl || null;

  // Build the ordered list of concerns we actually have data for.
  // (Hooks must run unconditionally — before any early return.)
  const concerns = useMemo(() => {
    if (!scores) return [];
    return CONCERN_META.filter((m) => scores[m.key]).map((m) => {
      const s = scores[m.key];
      const health = clampScore(s.uiScore);
      const severity = clampScore(s.severity ?? 100 - health);
      return { ...m, health, severity, band: bandFromHealth(health), hasMask: !!masks[m.key] };
    });
  }, [scores, masks]);

  // Concerns that have a heatmap mask, worst first (most interesting to show).
  const maskable = useMemo(
    () => concerns.filter((c) => c.hasMask).sort((a, b) => b.severity - a.severity),
    [concerns]
  );

  // Default the viewer to the highest-severity concern that has a mask.
  const [selectedKey, setSelectedKey] = useState(null);

  if (!analysis) return null;

  const activeKey = selectedKey ?? maskable[0]?.key ?? null;
  const activeConcern = concerns.find((c) => c.key === activeKey) || null;

  // ---- Legacy fallback: no structured scores, only flat severity fields ----
  if (!scores) {
    const legacy = [
      { label: "Wrinkles", value: clampScore(analysis.wrinkles), key: "wrinkles" },
      { label: "Redness", value: clampScore(analysis.redness), key: "redness" },
      { label: "Oiliness", value: clampScore(analysis.oiliness), key: "oiliness" },
    ];
    return (
      <div className="space-y-4 sm:space-y-6">
        {baseImage && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-soft)", background: "var(--accent-soft)" }}>
            <img src={baseImage} alt="Analyzed skin" className="w-full max-h-96 object-cover" />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {legacy.map((metric) => {
            // legacy values are SEVERITY (higher = worse) → invert for the band
            const t = SEVERITY[bandFromHealth(100 - metric.value)];
            return (
              <div key={metric.key} className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--card)", border: "1px solid var(--border-soft)" }}>
                <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--muted)" }}>{metric.label}</p>
                <p className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: t.text }}>{metric.value}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: t.dot }} aria-hidden="true" />
                  <p className="text-xs font-semibold" style={{ color: t.text }}>{t.label}</p>
                </div>
                <div className="mt-3 w-full rounded-full h-2 overflow-hidden" style={{ background: t.track }}>
                  <div className="h-full" style={{ width: `${metric.value}%`, background: t.dot }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const overall = clampScore(analysis.overall);
  const overallBand = SEVERITY[bandFromHealth(overall)];
  const skinAge = analysis.skinAge != null ? Math.round(analysis.skinAge) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Headline: overall score + skin age */}
      <div
        className="rounded-2xl p-5 sm:p-6 flex items-center gap-5 sm:gap-6"
        style={{ background: "var(--card)", border: "1px solid var(--border-soft)" }}
        role="region"
        aria-label={`Overall skin score ${overall} out of 100`}
      >
        <div className="relative flex-shrink-0" style={{ width: 84, height: 84 }}>
          <svg viewBox="0 0 36 36" width="84" height="84" aria-hidden="true">
            <path
              d="M18 2.5 a15.5 15.5 0 1 1 0 31 a15.5 15.5 0 1 1 0 -31"
              fill="none"
              stroke={overallBand.track}
              strokeWidth="3.2"
            />
            <path
              d="M18 2.5 a15.5 15.5 0 1 1 0 31 a15.5 15.5 0 1 1 0 -31"
              fill="none"
              stroke={overallBand.dot}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeDasharray={`${overall}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-semibold tracking-tight" style={{ color: overallBand.text }}>{overall}</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "var(--muted)" }}>Overall skin score</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--text)" }}>
            <span className="font-semibold" style={{ color: overallBand.text }}>{overallBand.label}</span>
            {skinAge != null && (
              <> · estimated skin age <span className="font-semibold" style={{ color: "var(--text)" }}>{skinAge}</span></>
            )}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            {concerns.length} attributes analyzed · higher scores are healthier
          </p>
        </div>
      </div>

      {/* Interactive heatmap viewer */}
      {baseImage && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-soft)", background: "var(--card)" }}>
          <div className="relative w-full" style={{ background: "var(--accent-soft)" }}>
            <img
              src={baseImage}
              alt="Analyzed face"
              className="w-full max-h-[28rem] object-contain mx-auto block"
            />
            {activeConcern?.hasMask && (
              <img
                key={activeConcern.key}
                src={masks[activeConcern.key]}
                alt={`${activeConcern.label} detection heatmap overlay`}
                className="absolute inset-0 w-full h-full object-contain mx-auto pointer-events-none"
              />
            )}
          </div>

          {maskable.length > 0 && (
            <div className="p-3 sm:p-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                  Heatmap · {activeConcern ? activeConcern.label : "none"}
                </p>
                <button
                  onClick={() => setSelectedKey("__none__")}
                  className="text-xs font-medium px-3 py-1 rounded-full transition"
                  style={
                    activeKey === "__none__" || !activeConcern
                      ? { background: "var(--button-bg)", color: "var(--button-text)" }
                      : { background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border-soft)" }
                  }
                  aria-pressed={activeKey === "__none__"}
                >
                  Clean photo
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {maskable.map((c) => {
                  const t = SEVERITY[c.band];
                  const active = activeKey === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setSelectedKey(c.key)}
                      className="flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap text-xs font-medium transition flex-shrink-0"
                      style={
                        active
                          ? { background: t.track, color: t.text, border: `1px solid ${t.dot}` }
                          : { background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border-soft)" }
                      }
                      aria-pressed={active}
                      aria-label={`Show ${c.label} heatmap, health score ${c.health}`}
                    >
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: t.dot }} aria-hidden="true" />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All concern scores */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {concerns.map((c) => {
          const t = SEVERITY[c.band];
          const selectable = c.hasMask;
          return (
            <button
              key={c.key}
              type="button"
              onClick={selectable ? () => setSelectedKey(c.key) : undefined}
              disabled={!selectable}
              className="text-left rounded-2xl p-3 sm:p-4 transition"
              style={{
                background: "var(--card)",
                border: `1px solid ${activeKey === c.key ? t.dot : "var(--border-soft)"}`,
                cursor: selectable ? "pointer" : "default",
              }}
              aria-label={`${c.label}: health score ${c.health} of 100, ${t.label}${selectable ? ". Click to view heatmap" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-medium truncate" style={{ color: "var(--muted)" }}>{c.label}</p>
                <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.dot }} aria-hidden="true" />
              </div>
              <p className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: t.text }}>{c.health}</p>
              <div className="mt-2 w-full rounded-full h-1.5 overflow-hidden" style={{ background: t.track }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${c.health}%`, background: t.dot }}
                  role="progressbar"
                  aria-valuenow={c.health}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Ingredient Guidance — Rose Derma theme.
 *
 * Surfaces recommended ingredients for the concerns that need attention. Works
 * off the structured `scores` (severity = 100 - ui_score) when present, and
 * falls back to the legacy flat severity fields otherwise. Only concerns the
 * ingredient database actually covers are shown.
 */

// Map API concern keys → ingredient-database keys.
const INGREDIENT_KEY = {
  wrinkle: "wrinkles",
  wrinkles: "wrinkles",
  redness: "redness",
  oiliness: "oiliness",
  acne: "acne",
  dark_circle_v2: "dark_circles",
  dark_circles: "dark_circles",
  moisture: "dryness", // low moisture health = dryness concern
};

const CONCERN_LABEL = {
  wrinkles: "Wrinkles",
  redness: "Redness",
  oiliness: "Oiliness",
  acne: "Acne",
  dark_circles: "Dark circles",
  dryness: "Dryness",
};

export function IngredientGuidance({ analysis }) {
  const [expandedConcerns, setExpandedConcerns] = useState({});
  if (!analysis) return null;

  // Collect { ingredientKey, severity } for covered concerns, worst first.
  const scores = analysis.scores && typeof analysis.scores === "object" ? analysis.scores : null;
  const bySeverity = new Map();

  const consider = (ingredientKey, severity) => {
    const sev = clampScore(severity);
    if (sev < 50) return; // only surface monitor/high concerns
    const prev = bySeverity.get(ingredientKey);
    if (prev == null || sev > prev) bySeverity.set(ingredientKey, sev);
  };

  if (scores) {
    for (const [apiKey, val] of Object.entries(scores)) {
      const ik = INGREDIENT_KEY[apiKey];
      if (!ik) continue;
      const severity = val.severity ?? 100 - clampScore(val.uiScore);
      consider(ik, severity);
    }
  } else {
    consider("wrinkles", analysis.wrinkles);
    consider("redness", analysis.redness);
    consider("oiliness", analysis.oiliness);
    if (analysis.acne != null) consider("acne", analysis.acne);
    if (analysis.dark_circles != null) consider("dark_circles", analysis.dark_circles);
  }

  const concerns = [...bySeverity.entries()]
    .map(([key, value]) => ({
      key,
      name: CONCERN_LABEL[key] || key,
      value,
      severity: value >= 75 ? "high" : "medium",
    }))
    .sort((a, b) => b.value - a.value);

  if (concerns.length === 0) {
    return (
      <div
        className="rounded-2xl p-4 sm:p-6"
        style={{ background: "rgba(23,163,74,0.08)", border: "1px solid rgba(23,163,74,0.25)" }}
        role="region"
        aria-label="Skin health status"
      >
        <p className="text-center font-medium text-sm sm:text-base" style={{ color: "#0f7a37" }}>
          ✨ Your skin looks great! No pressing concerns — keep up your current routine.
        </p>
      </div>
    );
  }

  const toggleConcern = (concernKey) => {
    setExpandedConcerns((prev) => ({ ...prev, [concernKey]: !prev[concernKey] }));
  };

  return (
    <div className="space-y-3 sm:space-y-6" role="region" aria-label="Ingredient recommendations for skin concerns">
      {concerns.map((concern) => {
        const ingredients = getIngredientGuidance(concern.key, concern.severity);
        const isExpanded = expandedConcerns[concern.key] !== false; // default expanded

        return (
          <div key={concern.key} className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border-soft)" }}>
            <button
              onClick={() => toggleConcern(concern.key)}
              className="w-full px-4 sm:px-6 py-4 sm:py-5 transition text-left flex items-start gap-3 min-h-[48px]"
              aria-expanded={isExpanded}
              aria-controls={`ingredients-${concern.key}`}
            >
              <span className="text-2xl sm:text-3xl flex-shrink-0" aria-hidden="true">
                {concern.severity === "high" ? "⚠️" : "🔎"}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg" style={{ color: "var(--text)" }}>
                  {concern.name} {concern.severity === "high" ? "needs attention" : "to monitor"}
                </h3>
                <p className="text-xs sm:text-sm" style={{ color: "var(--muted)" }}>
                  Concern level: {concern.value}%
                </p>
              </div>
              <svg
                className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                style={{ color: "var(--accent)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div id={`ingredients-${concern.key}`} className="px-4 sm:px-6 py-4 sm:py-5 space-y-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>Recommended ingredients</p>
                  <div className="space-y-2 sm:space-y-3">
                    {ingredients?.map((ingredient, idx) => (
                      <div key={idx} className="rounded-xl p-3 sm:p-4" style={{ background: "var(--bg)", border: "1px solid var(--border-soft)" }}>
                        <p className="font-medium text-sm sm:text-base" style={{ color: "var(--text)" }}>✓ {ingredient.name}</p>
                        <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--muted)" }}>{ingredient.benefit}</p>
                        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                          <span className="font-semibold" style={{ color: "var(--text)" }}>How to use:</span> {ingredient.how}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl" style={{ background: "rgba(217,131,36,0.1)", borderLeft: "4px solid #d98324" }} role="alert">
                  <p className="text-xs sm:text-sm font-semibold mb-1" style={{ color: "#8a5410" }}>⚠️ Things to avoid</p>
                  <p className="text-xs sm:text-sm" style={{ color: "#8a5410" }}>{ingredients?.[0]?.avoid}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
