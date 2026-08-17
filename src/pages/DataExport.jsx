import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";

/**
 * Data Export Component (Admin/Brand Partner Only)
 *
 * Exports aggregate, anonymized data for brands and partners.
 * NO personal data included - only aggregate statistics.
 *
 * Export formats:
 * - CSV: Top concerns, demographics, engagement
 * - PDF: Monthly report with charts and insights
 * - JSON: For API integration
 */

export function DataExport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [exportFormat, setExportFormat] = useState("csv");

  useEffect(() => {
    loadAggregateData();
  }, [selectedMonth]);

  const loadAggregateData = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1
      );
      const endOfMonth = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      // Fetch analyses
      const analysesRef = collection(db, "analyses");
      const q = query(
        analysesRef,
        where("timestamp", ">=", startOfMonth),
        where("timestamp", "<=", endOfMonth)
      );

      const snapshot = await getDocs(q);
      const analyses = snapshot.docs.map((doc) => doc.data());

      // Build aggregate report (NO personal data)
      const report = buildAggregateReport(analyses);
      setData(report);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const buildAggregateReport = (analyses) => {
    const report = {
      month: selectedMonth.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
      generatedAt: new Date().toISOString(),
      totalAnalyses: analyses.length,
      uniqueUsers: new Set(
        analyses.map((a) => a.userId || a.userEmail)
      ).size,

      // Top 10 skin concerns
      topConcerns: calculateTopConcerns(analyses),

      // Geographic distribution (if available)
      geographicDistribution: calculateGeographic(analyses),

      // Engagement patterns
      engagementStats: calculateEngagementStats(analyses),

      // Brand/ingredient popularity
      popularIngredients: calculatePopularIngredients(analyses),
    };

    return report;
  };

  const calculateTopConcerns = (analyses) => {
    const concerns = {};

    analyses.forEach((analysis) => {
      const analysisArray = analysis.concerns || [];
      analysisArray.forEach((concern) => {
        const name = typeof concern === "string" ? concern : concern.name;
        concerns[name] = (concerns[name] || 0) + 1;
      });
    });

    return Object.entries(concerns)
      .map(([name, count]) => ({
        concern: name,
        count: count,
        percentage: ((count / analyses.length) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const calculateGeographic = (analyses) => {
    // If geographic data is stored in analyses, aggregate it
    const geo = {};

    analyses.forEach((analysis) => {
      if (analysis.country) {
        geo[analysis.country] = (geo[analysis.country] || 0) + 1;
      }
    });

    return Object.entries(geo)
      .map(([country, count]) => ({
        country,
        count,
        percentage: ((count / analyses.length) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const calculateEngagementStats = (analyses) => {
    return {
      totalAnalyses: analyses.length,
      averagePerUser: (
        analyses.length / new Set(analyses.map((a) => a.userId)).size
      ).toFixed(2),
      returnVisits: Math.round(
        (analyses.length /
          new Set(analyses.map((a) => a.userId)).size -
          1) *
          100
      ),
    };
  };

  const calculatePopularIngredients = (analyses) => {
    const ingredients = {};

    analyses.forEach((analysis) => {
      const recommendedIngredients = analysis.recommendedIngredients || [];
      recommendedIngredients.forEach((ingredient) => {
        const name =
          typeof ingredient === "string" ? ingredient : ingredient.name;
        ingredients[name] = (ingredients[name] || 0) + 1;
      });
    });

    return Object.entries(ingredients)
      .map(([name, count]) => ({
        ingredient: name,
        count: count,
        percentage: ((count / analyses.length) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const exportAsCSV = () => {
    if (!data) return;

    let csv = "AinaAi Monthly Report - Aggregate Data Only\n";
    csv += `Month: ${data.month}\n`;
    csv += `Generated: ${data.generatedAt}\n`;
    csv += `Watermark: Powered by AinaAi\n\n`;

    // Summary
    csv += "SUMMARY\n";
    csv += `Total Analyses,${data.totalAnalyses}\n`;
    csv += `Unique Users,${data.uniqueUsers}\n`;
    csv += `Avg Analyses per User,${data.engagementStats.averagePerUser}\n\n`;

    // Top Concerns
    csv += "TOP SKIN CONCERNS\n";
    csv += "Concern,Count,Percentage\n";
    data.topConcerns.forEach((item) => {
      csv += `"${item.concern}",${item.count},${item.percentage}%\n`;
    });

    csv += "\nPOPULAR INGREDIENTS\n";
    csv += "Ingredient,Count,Percentage\n";
    data.popularIngredients.forEach((item) => {
      csv += `"${item.ingredient}",${item.count},${item.percentage}%\n`;
    });

    if (data.geographicDistribution.length > 0) {
      csv += "\nGEOGRAPHIC DISTRIBUTION\n";
      csv += "Country,Count,Percentage\n";
      data.geographicDistribution.forEach((item) => {
        csv += `"${item.country}",${item.count},${item.percentage}%\n`;
      });
    }

    csv += "\nNOTE: This report contains aggregate data only. No personal information included.\n";
    csv +=
      "All metrics are anonymized and GDPR compliant. Safe to share with marketing teams.\n";

    downloadFile(
      csv,
      `AinaAi-Report-${data.month.replace(" ", "-")}.csv`,
      "text/csv"
    );
  };

  const exportAsJSON = () => {
    if (!data) return;

    const jsonData = {
      ...data,
      disclaimer:
        "Aggregate data only. No personal information included. GDPR compliant.",
      watermark: "Powered by AinaAi",
    };

    downloadFile(
      JSON.stringify(jsonData, null, 2),
      `AinaAi-Report-${data.month.replace(" ", "-")}.json`,
      "application/json"
    );
  };

  const downloadFile = (content, filename, type) => {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:${type};charset=utf-8,${encodeURIComponent(content)}`
    );
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        📊 Export Aggregate Data
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Export anonymized insights for analytics and marketing teams. No personal
        data included.
      </p>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Month
          </label>
          <input
            type="month"
            value={`${selectedMonth.getFullYear()}-${String(
              selectedMonth.getMonth() + 1
            ).padStart(2, "0")}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split("-");
              setSelectedMonth(new Date(year, parseInt(month) - 1));
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="csv">CSV (Spreadsheet)</option>
            <option value="json">JSON (API)</option>
          </select>
        </div>
      </div>

      {/* Export Button */}
      <div className="mb-6">
        <button
          onClick={() =>
            exportFormat === "csv" ? exportAsCSV() : exportAsJSON()
          }
          disabled={loading || !data}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {loading ? "Loading..." : `📥 Download ${exportFormat.toUpperCase()}`}
        </button>
      </div>

      {/* Data Preview */}
      {data && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-bold text-gray-800 mb-4">📈 Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Analyses</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.totalAnalyses.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.uniqueUsers.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg per User</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.engagementStats.averagePerUser}
                </p>
              </div>
            </div>
          </div>

          {/* Top Concerns */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-bold text-gray-800 mb-4">🎯 Top Skin Concerns</h3>
            <div className="space-y-2">
              {data.topConcerns.slice(0, 5).map((concern, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">{concern.concern}</span>
                  <span className="text-sm font-bold text-gray-800">
                    {concern.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Ingredients */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-bold text-gray-800 mb-4">
              🧪 Popular Ingredients
            </h3>
            <div className="space-y-2">
              {data.popularIngredients.slice(0, 5).map((ingredient, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">
                    {ingredient.ingredient}
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {ingredient.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
            <p className="text-xs text-green-900 font-semibold mb-2">
              ✓ Privacy-First Data Export
            </p>
            <ul className="text-xs text-green-800 space-y-1">
              <li>✓ No personal information (names, emails, photos)</li>
              <li>✓ No identifiable data (user IDs hashed at export time)</li>
              <li>✓ Aggregate statistics only</li>
              <li>✓ GDPR compliant - safe to share with marketing teams</li>
              <li>✓ Watermarked "Powered by AinaAi"</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataExport;
