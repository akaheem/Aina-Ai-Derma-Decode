import React, { useState } from "react";
import { useAnalysisHistory } from "../hooks/useAnalysisHistory";
import { LoadingSpinner } from "./LoadingSpinner";

// Concern severity chip: high = rose, medium = amber, low = green.
const severityChip = (value) => {
  if (value >= 75) return { color: "#a83452", background: "var(--accent-soft)" };
  if (value >= 50) return { color: "#8a5410", background: "rgba(217,131,36,0.12)" };
  return { color: "#0f7a37", background: "rgba(23,163,74,0.1)" };
};

export function AnalysisHistory({ onSelectAnalysis }) {
  const { analyses, loading, error, hasMore, loadMore } = useAnalysisHistory();
  const [expandedId, setExpandedId] = useState(null);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && analyses.length === 0) {
    return (
      <div className="lk-panel">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && analyses.length === 0) {
    return (
      <div className="lk-panel">
        <div className="p-4 rounded-xl" style={{ background: "#fdeaee", color: "#a83452" }}>
          <p className="font-medium">Error loading history</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="lk-panel">
        <div className="text-center py-8">
          <p className="mb-2" style={{ color: "var(--text)" }}>📷 No analyses yet</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Upload your first photo to start tracking your skin improvement
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lk-panel">
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>Analysis history</h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {analyses.map((analysis) => (
          <div key={analysis.id}>
            <button
              onClick={() => {
                setExpandedId(expandedId === analysis.id ? null : analysis.id);
                if (onSelectAnalysis && expandedId !== analysis.id) {
                  onSelectAnalysis(analysis);
                }
              }}
              className="w-full text-left p-3 rounded-xl transition"
              style={{ border: "1px solid var(--border-soft)", background: "var(--card)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium" style={{ color: "var(--text)" }}>
                    {formatDate(analysis.timestamp)}
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[
                      ["Wrinkles", analysis.wrinkles],
                      ["Redness", analysis.redness],
                      ["Oiliness", analysis.oiliness],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={severityChip(value)}
                      >
                        {label}: {value}
                      </div>
                    ))}
                  </div>
                </div>
                {analysis.imageUrl && (
                  <img
                    src={analysis.imageUrl}
                    alt="Analysis thumbnail"
                    className="w-12 h-12 rounded-xl ml-4 object-cover"
                  />
                )}
              </div>
            </button>

            {expandedId === analysis.id && (
              <div className="mt-2 p-3 rounded-xl text-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-soft)" }}>
                {analysis.imageUrl && (
                  <img
                    src={analysis.imageUrl}
                    alt="Full analysis"
                    className="w-full rounded-xl mb-3 max-h-48 object-cover"
                  />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p style={{ color: "var(--muted)" }}>Acne</p>
                    <p className="font-bold" style={{ color: "var(--text)" }}>{analysis.acne || 0}</p>
                  </div>
                  <div>
                    <p style={{ color: "var(--muted)" }}>Dark circles</p>
                    <p className="font-bold" style={{ color: "var(--text)" }}>{analysis.dark_circles || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full mt-4 px-4 py-2 rounded-full font-medium transition"
          style={{ color: "var(--accent)", opacity: loading ? 0.5 : 1 }}
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
