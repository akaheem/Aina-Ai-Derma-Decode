import React, { useMemo, useState } from "react";
import { useAnalysisHistory } from "../hooks/useAnalysisHistory";

/**
 * Skin Insights & Trends Page
 * Shows user's personal trends and comparisons to typical user
 * Displays most improved and needs attention metrics
 * Provides personalized recommendations based on data
 */
export function SkinInsights() {
  const { analyses } = useAnalysisHistory();
  const [sortBy, setSortBy] = useState("trend"); // trend, improvement, needs-attention

  const insights = useMemo(() => {
    if (analyses.length < 2) {
      return null;
    }

    const sorted = [...analyses].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];
    const timeSpan = Math.floor(
      (new Date(newest.timestamp) - new Date(oldest.timestamp)) / (1000 * 60 * 60 * 24)
    );

    // Calculate metric improvements
    const metrics = ["wrinkles", "redness", "oiliness", "acne", "dark_circles"];
    const improvements = {};

    metrics.forEach((metric) => {
      const oldValue = oldest[metric] || 0;
      const newValue = newest[metric] || 0;
      const improvement = ((oldValue - newValue) / oldValue) * 100 || 0;
      const change = oldValue - newValue;

      improvements[metric] = {
        improvement,
        change,
        oldValue,
        newValue,
        direction: change > 0 ? "down" : change < 0 ? "up" : "stable",
      };
    });

    // Sort metrics by improvement
    const sortedMetrics = Object.entries(improvements).sort(
      (a, b) => b[1].improvement - a[1].improvement
    );

    const mostImproved = sortedMetrics[0];
    const needsAttention = sortedMetrics[sortedMetrics.length - 1];

    // Calculate overall health score
    const oldScore = calculateHealthScore(oldest);
    const newScore = calculateHealthScore(newest);
    const overallImprovement = ((newScore - oldScore) / oldScore) * 100 || 0;

    // Typical benchmarks (8 weeks)
    const typicalImprovement = 15; // Percentage improvement in 8 weeks
    const weeks = Math.round(timeSpan / 7);
    const adjustedTypical = (typicalImprovement / 8) * weeks;

    return {
      timeSpan,
      weeks,
      oldScore,
      newScore,
      overallImprovement,
      improvements,
      mostImproved,
      needsAttention,
      sortedMetrics,
      isAheadOfCurve: overallImprovement > adjustedTypical,
      adjustedTypical,
      analyses: sorted,
    };
  }, [analyses]);

  const calculateHealthScore = (analysis) => {
    const weightedSum =
      (analysis.wrinkles || 0) * 0.3 +
      (analysis.redness || 0) * 0.2 +
      (analysis.oiliness || 0) * 0.2 +
      (analysis.acne || 0) * 0.2 +
      (analysis.dark_circles || 0) * 0.1;

    return Math.max(0, Math.min(100, 100 - weightedSum));
  };

  const getMetricLabel = (metric) => {
    const labels = {
      wrinkles: "Wrinkles",
      redness: "Redness",
      oiliness: "Oiliness",
      acne: "Acne",
      dark_circles: "Dark Circles",
    };
    return labels[metric] || metric;
  };

  const getMetricEmoji = (metric) => {
    const emojis = {
      wrinkles: "✨",
      redness: "🔴",
      oiliness: "💧",
      acne: "⭘",
      dark_circles: "🌙",
    };
    return emojis[metric] || "📊";
  };

  const getRecommendations = (insights) => {
    if (!insights) return [];

    const recs = [];

    // Overall trend
    if (insights.overallImprovement > 0) {
      recs.push({
        type: "positive",
        title: "Keep doing what you're doing!",
        body: `Your routine is working. Continue with your current approach - you're seeing real improvements.`,
        icon: "👍",
      });
    } else if (insights.overallImprovement < -5) {
      recs.push({
        type: "warning",
        title: "Time to adjust your routine",
        body: `Your skin metrics have changed. Consider reassessing your current routine and ingredients.`,
        icon: "⚠️",
      });
    }

    // Ahead of curve
    if (insights.isAheadOfCurve) {
      recs.push({
        type: "positive",
        title: "You're ahead of the curve!",
        body: `Your improvement rate (${insights.overallImprovement.toFixed(1)}%) is better than typical users. Consistency is paying off.`,
        icon: "🚀",
      });
    }

    // For most improved
    if (insights.mostImproved) {
      const metricName = getMetricLabel(insights.mostImproved[0]);
      const improvement = insights.mostImproved[1].improvement;

      if (insights.mostImproved[0] === "wrinkles") {
        recs.push({
          type: "positive",
          title: `${metricName} improvement: ${improvement.toFixed(0)}%`,
          body: "Retinol and peptides are clearly working. Keep up with your night routine.",
          icon: "✨",
        });
      } else if (insights.mostImproved[0] === "redness") {
        recs.push({
          type: "positive",
          title: `${metricName} improvement: ${improvement.toFixed(0)}%`,
          body: "Your skin is calming down. Niacinamide and centella asiatica are helping.",
          icon: "🟢",
        });
      } else if (insights.mostImproved[0] === "acne") {
        recs.push({
          type: "positive",
          title: `${metricName} improvement: ${improvement.toFixed(0)}%`,
          body: "Your acne treatment is effective. Don't skip steps, consistency is key.",
          icon: "✅",
        });
      }
    }

    // For needs attention
    if (insights.needsAttention && insights.needsAttention[1].change < -2) {
      const metricName = getMetricLabel(insights.needsAttention[0]);

      if (insights.needsAttention[0] === "oiliness") {
        recs.push({
          type: "warning",
          title: `${metricName} increasing (↑ ${Math.abs(insights.needsAttention[1].change).toFixed(0)})`,
          body: "Consider adding Niacinamide or a lightweight mattifying moisturizer.",
          icon: "💧",
        });
      } else if (insights.needsAttention[0] === "dark_circles") {
        recs.push({
          type: "warning",
          title: `${metricName} increasing (↑ ${Math.abs(insights.needsAttention[1].change).toFixed(0)})`,
          body: "Try a caffeine-based eye serum and ensure adequate sleep.",
          icon: "😴",
        });
      }
    }

    return recs;
  };

  if (!insights) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Skin Insights & Trends</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Need at least 2 analyses to see trends. Start by uploading a photo!</p>
        </div>
      </div>
    );
  }

  const recommendations = getRecommendations(insights);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Skin Insights & Trends</h2>
        <p className="text-gray-600">
          Based on {insights.analyses.length} analyses over {insights.timeSpan} days
        </p>
      </div>

      {/* Overall Progress Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-blue-900">Your Progress</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-700 mb-1">Overall Improvement</p>
            <p className="text-4xl font-bold text-blue-600">
              {Math.max(0, insights.overallImprovement).toFixed(1)}%
            </p>
            <p className="text-xs text-blue-600 mt-1">in {insights.weeks} weeks</p>
          </div>

          <div>
            <p className="text-sm text-blue-700 mb-1">Typical User Benchmark</p>
            <p className="text-4xl font-bold text-blue-600">
              {insights.adjustedTypical.toFixed(1)}%
            </p>
            <p className="text-xs text-blue-600 mt-1">in {insights.weeks} weeks</p>
          </div>
        </div>

        {insights.isAheadOfCurve && (
          <div className="mt-4 p-3 bg-blue-600 text-white rounded-lg">
            <p className="font-semibold">You're ahead of the curve! 🚀</p>
            <p className="text-sm mt-1">
              Your improvement rate exceeds typical users. Your routine is working.
            </p>
          </div>
        )}
      </div>

      {/* Health Score Comparison */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Health Score Change</h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Then</p>
            <p className="text-3xl font-bold text-gray-800">
              {insights.oldScore.toFixed(1)}
            </p>
          </div>

          <div className="flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 mb-2">Now</p>
            <p className="text-3xl font-bold text-green-600">
              {insights.newScore.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-sm text-blue-900 font-medium">
            +{(insights.newScore - insights.oldScore).toFixed(1)} points improvement
          </p>
        </div>
      </div>

      {/* Metric Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Metric Breakdown</h3>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setSortBy("trend")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === "trend"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Metrics
          </button>
          <button
            onClick={() => setSortBy("improvement")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === "improvement"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Most Improved
          </button>
          <button
            onClick={() => setSortBy("needs-attention")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortBy === "needs-attention"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Needs Attention
          </button>
        </div>

        <div className="space-y-3">
          {insights.sortedMetrics.map(([metric, data]) => {
            const isImprovement = data.improvement > 0;
            const bgColor = isImprovement ? "bg-green-50" : "bg-red-50";
            const textColor = isImprovement ? "text-green-600" : "text-red-600";

            return (
              <div key={metric} className={`${bgColor} p-4 rounded-lg border border-gray-200`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getMetricEmoji(metric)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {getMetricLabel(metric)}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {data.oldValue.toFixed(1)} → {data.newValue.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${textColor}`}>
                      {isImprovement ? "↓" : "↑"} {Math.abs(data.improvement).toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isImprovement ? "bg-green-600" : "bg-red-600"}`}
                    style={{
                      width: `${Math.min(100, Math.abs(data.improvement))}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Recommendations</h3>

        {recommendations.length === 0 ? (
          <p className="text-gray-500">Keep collecting data for personalized recommendations.</p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.type === "positive"
                    ? "bg-green-50 border-green-500"
                    : "bg-yellow-50 border-yellow-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{rec.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-800">{rec.title}</h4>
                    <p className="text-sm text-gray-700 mt-1">{rec.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
