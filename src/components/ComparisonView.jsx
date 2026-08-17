import React, { useState, useMemo } from "react";
import { useAnalysisHistory } from "../hooks/useAnalysisHistory";

export function ComparisonView() {
  const { analyses } = useAnalysisHistory();
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const comparison = useMemo(() => {
    if (!fromDate || !toDate) return null;

    const fromAnalysis = analyses.find(
      (a) =>
        new Date(a.timestamp).toDateString() ===
        new Date(fromDate).toDateString()
    );
    const toAnalysis = analyses.find(
      (a) =>
        new Date(a.timestamp).toDateString() ===
        new Date(toDate).toDateString()
    );

    if (!fromAnalysis || !toAnalysis) return null;

    const metrics = ["wrinkles", "redness", "oiliness"];
    const result = {};

    metrics.forEach((metric) => {
      const oldValue = fromAnalysis[metric] || 0;
      const newValue = toAnalysis[metric] || 0;
      const delta = newValue - oldValue;
      const percentage =
        oldValue !== 0 ? ((delta / oldValue) * 100).toFixed(1) : 0;

      result[metric] = {
        old: oldValue,
        new: newValue,
        delta,
        percentage,
        improved: delta < 0,
      };
    });

    return {
      fromDate: fromAnalysis.timestamp,
      toDate: toAnalysis.timestamp,
      metrics: result,
    };
  }, [fromDate, toDate, analyses]);

  const getMetricLabel = (metric) => {
    const labels = {
      wrinkles: "Wrinkles",
      redness: "Redness",
      oiliness: "Oiliness",
    };
    return labels[metric] || metric;
  };

  const getTrendIcon = (improved) => (improved ? "↓" : "↑");
  // improved (concern went down) = green; worse = rose.
  const getTrendColor = (improved) => (improved ? "#0f7a37" : "#a83452");

  const dateOptions = (
    <>
      <option value="">Select a date…</option>
      {analyses.map((analysis) => (
        <option
          key={analysis.id}
          value={new Date(analysis.timestamp).toISOString().split("T")[0]}
        >
          {new Date(analysis.timestamp).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </option>
      ))}
    </>
  );

  return (
    <div className="lk-panel">
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>Comparison view</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
            From date
          </label>
          <select
            value={fromDate ? new Date(fromDate).toISOString().split("T")[0] : ""}
            onChange={(e) => {
              if (e.target.value) {
                const selectedAnalysis = analyses.find(
                  (a) =>
                    new Date(a.timestamp).toISOString().split("T")[0] ===
                    e.target.value
                );
                setFromDate(selectedAnalysis?.timestamp || null);
              }
            }}
            className="w-full"
          >
            {dateOptions}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
            To date
          </label>
          <select
            value={toDate ? new Date(toDate).toISOString().split("T")[0] : ""}
            onChange={(e) => {
              if (e.target.value) {
                const selectedAnalysis = analyses.find(
                  (a) =>
                    new Date(a.timestamp).toISOString().split("T")[0] ===
                    e.target.value
                );
                setToDate(selectedAnalysis?.timestamp || null);
              }
            }}
            className="w-full"
          >
            {dateOptions}
          </select>
        </div>
      </div>

      {comparison && (
        <div className="space-y-4">
          <div className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            Comparing {new Date(comparison.fromDate).toLocaleDateString()} to{" "}
            {new Date(comparison.toDate).toLocaleDateString()}
          </div>

          {Object.entries(comparison.metrics).map(([metric, data]) => (
            <div key={metric} className="rounded-xl p-4" style={{ border: "1px solid var(--border-soft)" }}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold" style={{ color: "var(--text)" }}>
                  {getMetricLabel(metric)}
                </h4>
                <span className="font-bold" style={{ color: getTrendColor(data.improved) }}>
                  {getTrendIcon(data.improved)} {Math.abs(data.percentage)}%
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-end">
                    <span className="text-sm" style={{ color: "var(--muted)" }}>Before</span>
                    <span className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                      {data.old}
                    </span>
                  </div>
                </div>

                <div style={{ color: "var(--muted)" }}>→</div>

                <div className="flex-1">
                  <div className="flex justify-between items-end">
                    <span className="text-sm" style={{ color: "var(--muted)" }}>After</span>
                    <span className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                      {data.new}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-full h-2 overflow-hidden" style={{ background: "var(--accent-soft)" }}>
                <div
                  className="h-full transition-all"
                  style={{
                    background: data.improved ? "#17a34a" : "#e8607d",
                    width: `${Math.max(Math.min((data.new / 100) * 100, 100), 5)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {(!fromDate || !toDate) && (
        <div className="text-center py-8" style={{ color: "var(--muted)" }}>
          <p>Select two dates to compare your skin metrics</p>
        </div>
      )}

      {comparison === null && fromDate && toDate && (
        <div className="text-center py-8 rounded-xl" style={{ color: "#8a5410", background: "rgba(217,131,36,0.1)" }}>
          <p>No comparison available for selected dates</p>
        </div>
      )}
    </div>
  );
}
