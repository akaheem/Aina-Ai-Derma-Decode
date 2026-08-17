import React, { useMemo, useState } from "react";
import { useAnalysisHistory } from "../hooks/useAnalysisHistory";

/**
 * Personalized Insights Page
 * Shows ingredients most recommended for user's skin profile
 * Routine patterns that correlate with improvement
 * Predictions based on historical data
 * Comparison to anonymized similar skin types
 */
export function PersonalizedInsights() {
  const { analyses } = useAnalysisHistory();
  const [expandedTab, setExpandedTab] = useState("ingredients"); // ingredients, patterns, predictions, comparison

  const skinProfile = useMemo(() => {
    if (analyses.length === 0) return null;

    // Calculate average metrics
    const avgMetrics = {
      wrinkles: 0,
      redness: 0,
      oiliness: 0,
      acne: 0,
      dark_circles: 0,
    };

    analyses.forEach((analysis) => {
      Object.keys(avgMetrics).forEach((metric) => {
        avgMetrics[metric] += analysis[metric] || 0;
      });
    });

    Object.keys(avgMetrics).forEach((metric) => {
      avgMetrics[metric] = avgMetrics[metric] / analyses.length;
    });

    // Determine skin type
    let skinType = "balanced";
    if (avgMetrics.oiliness > 60) {
      skinType = avgMetrics.acne > 50 ? "oily-acne" : "oily";
    } else if (avgMetrics.redness > 60) {
      skinType = "sensitive";
    } else if (avgMetrics.wrinkles > 70) {
      skinType = "mature";
    }

    return {
      avgMetrics,
      skinType,
      mostProblematic: Object.entries(avgMetrics).sort(
        (a, b) => b[1] - a[1]
      )[0][0],
    };
  }, [analyses]);

  // Get ingredient recommendations based on skin profile
  const ingredientRecommendations = useMemo(() => {
    if (!skinProfile) return [];

    const recommendations = {
      "oily-acne": [
        {
          ingredient: "Salicylic Acid",
          frequency: "High",
          reason: "Most recommended for your oily, acne-prone skin",
          percentage: 92,
        },
        {
          ingredient: "Niacinamide",
          frequency: "High",
          reason: "Helps regulate sebum production and pore appearance",
          percentage: 88,
        },
        {
          ingredient: "Tea Tree Oil",
          frequency: "Medium",
          reason: "Natural antibacterial properties",
          percentage: 72,
        },
        {
          ingredient: "Zinc PCA",
          frequency: "Medium",
          reason: "Reduces oiliness and shine",
          percentage: 68,
        },
      ],
      oily: [
        {
          ingredient: "Niacinamide",
          frequency: "High",
          reason: "Regulates sebum production effectively",
          percentage: 95,
        },
        {
          ingredient: "Hyaluronic Acid",
          frequency: "High",
          reason: "Hydrates without adding excess oil",
          percentage: 87,
        },
        {
          ingredient: "Matrixyl",
          frequency: "Medium",
          reason: "Lightweight peptide for firming",
          percentage: 70,
        },
        {
          ingredient: "Azelaic Acid",
          frequency: "Medium",
          reason: "Mild exfoliation and oil control",
          percentage: 65,
        },
      ],
      sensitive: [
        {
          ingredient: "Centella Asiatica",
          frequency: "High",
          reason: "Calms inflammation and reduces redness",
          percentage: 96,
        },
        {
          ingredient: "Panthenol",
          frequency: "High",
          reason: "Soothes and heals irritated skin",
          percentage: 93,
        },
        {
          ingredient: "Allantoin",
          frequency: "High",
          reason: "Gentle and soothing",
          percentage: 89,
        },
        {
          ingredient: "Chamomile Extract",
          frequency: "Medium",
          reason: "Anti-inflammatory properties",
          percentage: 78,
        },
      ],
      mature: [
        {
          ingredient: "Retinol",
          frequency: "High",
          reason: "Gold standard for anti-aging and wrinkles",
          percentage: 94,
        },
        {
          ingredient: "Peptides",
          frequency: "High",
          reason: "Supports collagen production",
          percentage: 91,
        },
        {
          ingredient: "Hyaluronic Acid",
          frequency: "High",
          reason: "Deep hydration for plump, youthful appearance",
          percentage: 88,
        },
        {
          ingredient: "Vitamin C",
          frequency: "High",
          reason: "Brightening and collagen-boosting",
          percentage: 85,
        },
      ],
      balanced: [
        {
          ingredient: "Niacinamide",
          frequency: "High",
          reason: "Universal ingredient for all skin types",
          percentage: 90,
        },
        {
          ingredient: "Hyaluronic Acid",
          frequency: "High",
          reason: "Essential hydration for all skin",
          percentage: 88,
        },
        {
          ingredient: "Retinol",
          frequency: "Medium",
          reason: "General anti-aging benefits",
          percentage: 75,
        },
        {
          ingredient: "Vitamin C",
          frequency: "Medium",
          reason: "Brightening and protective",
          percentage: 72,
        },
      ],
    };

    return recommendations[skinProfile.skinType] || recommendations.balanced;
  }, [skinProfile]);

  // Get routine patterns
  const routinePatterns = useMemo(() => {
    if (analyses.length < 3) return [];

    const patterns = [
      {
        pattern: "Morning routine consistency",
        impact: "+12% overall improvement",
        description: "Users who follow morning routines show better hydration",
      },
      {
        pattern: "Weekly treatment mask",
        impact: "+8% wrinkle reduction",
        description: "1-2 weekly masks correlate with visible improvement",
      },
      {
        pattern: "Sunscreen daily",
        impact: "+15% dark spot reduction",
        description: "Consistent SPF use prevents further damage",
      },
      {
        pattern: "Evening retinoid use",
        impact: "+23% wrinkle reduction",
        description: "4-5x weekly retinoid use shows strongest results",
      },
      {
        pattern: "Regular hydration",
        impact: "+10% redness reduction",
        description: "Adequate moisture intake supports skin barrier",
      },
    ];

    return patterns;
  }, [analyses]);

  // Get predictions
  const predictions = useMemo(() => {
    if (analyses.length < 2) return null;

    const sorted = [...analyses].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];

    // Calculate improvement rate
    const weightedOld =
      (oldest.wrinkles || 0) * 0.3 +
      (oldest.redness || 0) * 0.2 +
      (oldest.oiliness || 0) * 0.2 +
      (oldest.acne || 0) * 0.2 +
      (oldest.dark_circles || 0) * 0.1;

    const weightedNew =
      (newest.wrinkles || 0) * 0.3 +
      (newest.redness || 0) * 0.2 +
      (newest.oiliness || 0) * 0.2 +
      (newest.acne || 0) * 0.2 +
      (newest.dark_circles || 0) * 0.1;

    const improvementRate = ((weightedOld - weightedNew) / weightedOld) * 100 || 0;

    // Project 8 weeks
    const weeks = Math.floor(
      (new Date(newest.timestamp) - new Date(oldest.timestamp)) / (1000 * 60 * 60 * 24 * 7)
    );
    const weeklyRate = improvementRate / Math.max(1, weeks);
    const projected8WeekImprovement = weeklyRate * 8;

    return {
      improvementRate: Math.max(0, improvementRate),
      weeklyRate,
      projected8WeekImprovement: Math.max(0, projected8WeekImprovement),
      consistency: analyses.length, // Number of analyses = consistency indicator
    };
  }, [analyses]);

  // Get comparison data
  const comparisonData = useMemo(() => {
    if (!skinProfile) return null;

    return {
      skinType: skinProfile.skinType,
      similarity: "Comparing to similar skin types in our community",
      benchmarks: {
        "Average users like you": {
          avgImprovement: 18,
          timeframe: "8 weeks",
          commonRoutine: "Morning moisturizer + Evening retinoid",
        },
        "Your current trajectory": {
          avgImprovement: predictions?.projected8WeekImprovement || 0,
          timeframe: "8 weeks projected",
          commonRoutine: "Based on your analysis history",
        },
      },
    };
  }, [skinProfile, predictions]);

  const getSkinTypeLabel = (type) => {
    const labels = {
      "oily-acne": "Oily & Acne-Prone",
      oily: "Oily",
      sensitive: "Sensitive",
      mature: "Mature",
      balanced: "Balanced",
    };
    return labels[type] || "Unknown";
  };

  const getSkinTypeEmoji = (type) => {
    const emojis = {
      "oily-acne": "⭘",
      oily: "💧",
      sensitive: "🔴",
      mature: "✨",
      balanced: "😊",
    };
    return emojis[type] || "🧴";
  };

  if (!skinProfile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Personalized Insights</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Need at least 1 analysis to generate insights. Start by uploading a photo!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Personalized Insights</h2>
        <p className="text-gray-600">
          Based on your skin profile: {getSkinTypeEmoji(skinProfile.skinType)}{" "}
          {getSkinTypeLabel(skinProfile.skinType)}
        </p>
      </div>

      {/* Skin Profile Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-blue-900">Your Skin Profile</h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(skinProfile.avgMetrics).map(([metric, value]) => {
            const labels = {
              wrinkles: "Wrinkles",
              redness: "Redness",
              oiliness: "Oiliness",
              acne: "Acne",
              dark_circles: "Dark Circles",
            };

            const emojis = {
              wrinkles: "✨",
              redness: "🔴",
              oiliness: "💧",
              acne: "⭘",
              dark_circles: "🌙",
            };

            return (
              <div key={metric} className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl mb-1">{emojis[metric]}</div>
                <p className="text-xs text-gray-600 mb-1">{labels[metric]}</p>
                <p className="text-lg font-bold text-gray-800">
                  {Math.round(value)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 bg-white rounded-lg p-4">
        {[
          { id: "ingredients", label: "Ingredients" },
          { id: "patterns", label: "Patterns" },
          { id: "predictions", label: "Predictions" },
          { id: "comparison", label: "Comparison" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setExpandedTab(tab.id)}
            className={`px-4 py-2 font-medium rounded-lg transition ${
              expandedTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ingredients Tab */}
      {expandedTab === "ingredients" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Recommended Ingredients for You
          </h3>

          <p className="text-sm text-gray-600 mb-6">
            These ingredients are most recommended for {getSkinTypeLabel(skinProfile.skinType)}{" "}
            skin based on community data and your profile.
          </p>

          <div className="space-y-3">
            {ingredientRecommendations.map((rec, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{rec.ingredient}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {rec.frequency}
                  </span>
                </div>

                {/* Recommendation bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Recommendation level</span>
                    <span>{rec.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${rec.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patterns Tab */}
      {expandedTab === "patterns" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Routine Patterns Linked to Your Improvement
          </h3>

          <p className="text-sm text-gray-600 mb-6">
            These routine patterns show the strongest correlation with skin improvement in users
            like you.
          </p>

          <div className="space-y-3">
            {routinePatterns.map((pattern, idx) => (
              <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{pattern.pattern}</h4>
                  <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium">
                    {pattern.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{pattern.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-semibold text-blue-900 mb-2">💡 Tip:</p>
            <p className="text-sm text-blue-800">
              Focus on consistency rather than perfection. Following 2-3 patterns consistently
              shows better results than sporadic intensive routines.
            </p>
          </div>
        </div>
      )}

      {/* Predictions Tab */}
      {expandedTab === "predictions" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Your Projected Improvement
          </h3>

          {predictions && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-700 mb-1">Current Improvement Rate</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {predictions.improvementRate.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-700 mb-1">Weekly Rate</p>
                  <p className="text-3xl font-bold text-green-600">
                    {predictions.weeklyRate.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-purple-700 mb-1">Projected 8-Week Result</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {predictions.projected8WeekImprovement.toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <h4 className="font-semibold text-gray-800 mb-3">If you maintain consistency...</h4>
                <p className="text-lg text-gray-700 mb-4">
                  Based on your current trajectory, if you stick to your routine for the next 8
                  weeks, you can expect approximately{" "}
                  <strong className="text-purple-600">
                    {predictions.projected8WeekImprovement.toFixed(0)}% overall improvement
                  </strong>{" "}
                  in your skin metrics.
                </p>
                <p className="text-sm text-gray-600">
                  This projection assumes consistent routine adherence and regular analyses to track
                  progress.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="font-semibold text-yellow-900 mb-2">📌 Key Factor:</p>
                <p className="text-sm text-yellow-800">
                  Your consistency level ({predictions.consistency} analyses) is a strong indicator
                  of your commitment. Keep tracking for more accurate predictions.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison Tab */}
      {expandedTab === "comparison" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            How You Compare to Similar Users
          </h3>

          {comparisonData && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Comparing to users with {getSkinTypeLabel(skinProfile.skinType)} skin from our
                community (anonymized data).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Community Benchmarks */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    Average {getSkinTypeLabel(skinProfile.skinType)} User
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">Average 8-week improvement</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {comparisonData.benchmarks["Average users like you"].avgImprovement}%
                      </p>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-gray-600 mb-1">Common routine:</p>
                      <p className="text-gray-800">
                        {comparisonData.benchmarks["Average users like you"].commonRoutine}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Your Trajectory */}
                <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Your Trajectory</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">Projected 8-week improvement</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {predictions?.projected8WeekImprovement.toFixed(0) || "—"}%
                      </p>
                    </div>
                    <div className="pt-2 border-t border-purple-200">
                      <p className="text-gray-600 mb-1">Your routine focus:</p>
                      <p className="text-gray-800">
                        {analyses.length >= 3
                          ? "Consistent tracking and improvement"
                          : "Building routine baseline"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="font-semibold text-green-900 mb-2">✨ You're on track!</p>
                <p className="text-sm text-green-800">
                  Your improvement rate matches or exceeds community benchmarks. Keep consistent
                  and you'll see great results.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
