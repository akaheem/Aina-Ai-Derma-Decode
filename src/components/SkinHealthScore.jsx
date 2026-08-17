import React, { useMemo } from "react";
import { useAnalysisHistory } from "../hooks/useAnalysisHistory";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Health score is inverted vs. concern severity: a HIGH score is good.
// good = green, fair = amber, poor = rose (rose doubles as the palette accent).
const scoreHex = (score) => (score >= 75 ? "#17a34a" : score >= 50 ? "#d98324" : "#e8607d");
const scoreText = (score) => (score >= 75 ? "#0f7a37" : score >= 50 ? "#8a5410" : "#a83452");
const scoreTint = (score) =>
  score >= 75 ? "rgba(23,163,74,0.08)" : score >= 50 ? "rgba(217,131,36,0.08)" : "var(--accent-soft)";

export function SkinHealthScore() {
  const { analyses } = useAnalysisHistory();

  const scoreData = useMemo(() => {
    return analyses
      .slice()
      .reverse()
      .map((analysis) => {
        // Formula: 100 - ((wrinkles*0.3 + redness*0.2 + oiliness*0.2 + acne*0.2 + dark_circles*0.1) / 100)
        const weightedSum =
          (analysis.wrinkles || 0) * 0.3 +
          (analysis.redness || 0) * 0.2 +
          (analysis.oiliness || 0) * 0.2 +
          (analysis.acne || 0) * 0.2 +
          (analysis.dark_circles || 0) * 0.1;

        const score = Math.max(0, Math.min(100, 100 - weightedSum));

        return {
          date: new Date(analysis.timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          score: parseFloat(score.toFixed(1)),
          fullDate: new Date(analysis.timestamp),
        };
      });
  }, [analyses]);

  const currentScore = scoreData.length > 0 ? scoreData[scoreData.length - 1].score : 0;
  const previousScore = scoreData.length > 1 ? scoreData[scoreData.length - 2].score : currentScore;
  const scoreTrend = currentScore - previousScore;

  const getScoreLabel = (score) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Needs improvement";
  };

  if (scoreData.length === 0) {
    return (
      <div className="lk-panel">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>Skin health score</h3>
        <div className="text-center py-8" style={{ color: "var(--muted)" }}>
          <p>No score data available yet. Upload photos to see your score.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lk-panel">
      <h3 className="text-lg font-semibold mb-6" style={{ color: "var(--text)" }}>Skin health score</h3>

      {/* Large Score Display */}
      <div className="rounded-2xl p-6 mb-6 text-center" style={{ background: scoreTint(currentScore) }}>
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-full h-full" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(46,31,36,0.1)" strokeWidth="8" />
            {/* Score circle */}
            <circle
              cx="60"
              cy="60"
              r="55"
              fill="none"
              stroke={scoreHex(currentScore)}
              strokeWidth="8"
              strokeDasharray={`${(currentScore / 100) * 345.6} 345.6`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-4xl font-semibold" style={{ color: scoreText(currentScore) }}>
              {currentScore.toFixed(1)}
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>/ 100</span>
          </div>
        </div>

        <p className="text-xl font-semibold" style={{ color: scoreText(currentScore) }}>
          {getScoreLabel(currentScore)}
        </p>

        {scoreTrend !== 0 && (
          <p className="text-sm mt-2" style={{ color: scoreTrend > 0 ? "#0f7a37" : "#a83452" }}>
            {scoreTrend > 0 ? "↑" : "↓"} {Math.abs(scoreTrend).toFixed(1)} points from last analysis
          </p>
        )}
      </div>

      {/* Score Breakdown */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3" style={{ color: "var(--text)" }}>Score breakdown</h4>
        <div className="space-y-2 text-sm">
          {[
            ["Wrinkles (30% weight)", "×0.30"],
            ["Redness (20% weight)", "×0.20"],
            ["Oiliness (20% weight)", "×0.20"],
            ["Acne (20% weight)", "×0.20"],
            ["Dark circles (10% weight)", "×0.10"],
          ].map(([label, weight]) => (
            <div key={label} className="flex justify-between" style={{ color: "var(--muted)" }}>
              <span>{label}</span>
              <span className="font-medium" style={{ color: "var(--text)" }}>{weight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Score Trend Chart */}
      <div>
        <h4 className="font-semibold mb-3" style={{ color: "var(--text)" }}>Score trend</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={scoreData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(46,31,36,0.08)" />
            <XAxis dataKey="date" stroke="#6b5157" style={{ fontSize: "12px" }} />
            <YAxis stroke="#6b5157" style={{ fontSize: "12px" }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fffdfb",
                border: "1px solid rgba(46,31,36,0.1)",
                borderRadius: "12px",
              }}
              labelStyle={{ color: "#2e1f24" }}
              formatter={(value) => `${value.toFixed(1)}`}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#e8607d"
              strokeWidth={2}
              dot={{ fill: "#e8607d", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
