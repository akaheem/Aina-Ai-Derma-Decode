import React, { useState, useMemo } from "react";
import { getIngredientGuidance, lifestyleGuidance } from "../data/ingredients";

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

// Route every API concern key to its guidance: a topical ingredient-DB key,
// or a lifestyle key for concerns without a genuine topical fix.
const CONCERN_GUIDANCE = {
  wrinkle: { type: "topical", key: "wrinkles", label: "Wrinkles" },
  firmness: { type: "topical", key: "firmness", label: "Firmness" },
  texture: { type: "topical", key: "texture", label: "Texture" },
  pore: { type: "topical", key: "pores", label: "Pores" },
  oiliness: { type: "topical", key: "oiliness", label: "Oiliness" },
  acne: { type: "topical", key: "acne", label: "Acne" },
  redness: { type: "topical", key: "redness", label: "Redness" },
  age_spot: { type: "topical", key: "age_spots", label: "Age spots" },
  radiance: { type: "topical", key: "radiance", label: "Radiance" },
  moisture: { type: "topical", key: "dryness", label: "Dryness" }, // low moisture health = dryness
  dark_circle_v2: { type: "topical", key: "dark_circles", label: "Dark circles" },
  eye_bag: { type: "lifestyle", key: "eye_bags", label: "Eye bags" },
  droopy_upper_eyelid: { type: "lifestyle", key: "droopy_upper_eyelid", label: "Upper eyelid" },
  droopy_lower_eyelid: { type: "lifestyle", key: "droopy_lower_eyelid", label: "Lower eyelid" },
};

// Legacy flat severity fields → the API concern key they correspond to.
const LEGACY_CONCERN_KEY = {
  wrinkles: "wrinkle",
  redness: "redness",
  oiliness: "oiliness",
  acne: "acne",
  dark_circles: "dark_circle_v2",
};

// Health score (higher = better) → guidance tier. >= 90 is not surfaced.
const tierFromHealth = (health) => {
  if (health < 75) return "attention"; // ⚠️ Needs attention
  if (health < 90) return "monitor"; // 🔎 Room to improve
  return "great";
};

/**
 * Ingredient & lifestyle guidance — Rose Derma theme.
 *
 * Surfaces guidance for every concern below a healthy score. Health is read
 * from the structured `scores` (`uiScore`, higher = better) when present, and
 * derived from the legacy flat severity fields otherwise. Concerns at health
 * >= 90 are not shown; a per-concern tier drives the emphasis:
 *   - health < 75  → "Needs attention" (⚠️)
 *   - health 75-89 → "Room to improve" (🔎)
 * Topical concerns render an ingredient list; concerns without a real topical
 * fix (eye bags, eyelid droop) render honest lifestyle/professional tips.
 * The all-clear message shows only when every covered concern is >= 90.
 */
export function IngredientGuidance({ analysis }) {
  const [expandedConcerns, setExpandedConcerns] = useState({});
  if (!analysis) return null;

  const scores = analysis.scores && typeof analysis.scores === "object" ? analysis.scores : null;

  // Collect { apiKey, guidance, health } for every recognized concern.
  const collected = [];
  if (scores) {
    for (const [apiKey, val] of Object.entries(scores)) {
      const guidance = CONCERN_GUIDANCE[apiKey];
      if (!guidance || !val) continue;
      const health = val.uiScore != null ? clampScore(val.uiScore) : 100 - clampScore(val.severity);
      collected.push({ apiKey, guidance, health });
    }
  } else {
    for (const [flatKey, apiKey] of Object.entries(LEGACY_CONCERN_KEY)) {
      const sev = analysis[flatKey];
      if (sev == null) continue;
      const guidance = CONCERN_GUIDANCE[apiKey];
      if (!guidance) continue;
      collected.push({ apiKey, guidance, health: 100 - clampScore(sev) }); // flat fields are severities
    }
  }

  // Only surface concerns below healthy; worst (lowest health) first.
  const concerns = collected.filter((c) => c.health < 90).sort((a, b) => a.health - b.health);

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
    <div className="space-y-3 sm:space-y-6" role="region" aria-label="Guidance for skin concerns">
      {concerns.map(({ apiKey, guidance, health }) => {
        const tier = tierFromHealth(health);
        const isAttention = tier === "attention";
        const isExpanded = expandedConcerns[apiKey] !== false; // default expanded
        const bodyId = `guidance-${apiKey}`;
        const ingredients = guidance.type === "topical" ? getIngredientGuidance(guidance.key, "high") : null;
        const lifestyle = guidance.type === "lifestyle" ? lifestyleGuidance[guidance.key] : null;

        return (
          <div key={apiKey} className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border-soft)" }}>
            <button
              onClick={() => toggleConcern(apiKey)}
              className="w-full px-4 sm:px-6 py-4 sm:py-5 transition text-left flex items-start gap-3 min-h-[48px]"
              aria-expanded={isExpanded}
              aria-controls={bodyId}
            >
              <span className="text-2xl sm:text-3xl flex-shrink-0" aria-hidden="true">
                {isAttention ? "⚠️" : "🔎"}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg" style={{ color: "var(--text)" }}>
                  {guidance.label} {isAttention ? "needs attention" : "— room to improve"}
                </h3>
                <p className="text-xs sm:text-sm" style={{ color: "var(--muted)" }}>
                  Skin health: {health}%
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
              <div id={bodyId} className="px-4 sm:px-6 py-4 sm:py-5 space-y-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
                {guidance.type === "topical" ? (
                  <>
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

                    {ingredients?.[0]?.avoid && (
                      <div className="p-3 sm:p-4 rounded-xl" style={{ background: "rgba(217,131,36,0.1)", borderLeft: "4px solid #d98324" }} role="alert">
                        <p className="text-xs sm:text-sm font-semibold mb-1" style={{ color: "#8a5410" }}>⚠️ Things to avoid</p>
                        <p className="text-xs sm:text-sm" style={{ color: "#8a5410" }}>{ingredients[0].avoid}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {lifestyle?.note && (
                      <p className="text-sm" style={{ color: "var(--muted)" }}>{lifestyle.note}</p>
                    )}
                    <div>
                      <p className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>What can help</p>
                      <ul className="space-y-2">
                        {lifestyle?.tips?.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm" style={{ color: "var(--muted)" }}>
                            <span aria-hidden="true" style={{ color: "var(--accent)" }}>•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
