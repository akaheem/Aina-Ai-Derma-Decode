import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAnalysisHistory } from "../hooks/useAnalysisHistory";

export function ReportExport() {
  const { analyses } = useAnalysisHistory();
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef(null);

  const generateMetricsRecommendations = (fromAnalysis, toAnalysis) => {
    const recommendations = [];

    // Wrinkles recommendations
    if (toAnalysis.wrinkles < fromAnalysis.wrinkles) {
      recommendations.push("✓ Wrinkles are improving - continue with your current routine");
    } else if (toAnalysis.wrinkles > fromAnalysis.wrinkles) {
      recommendations.push("⚠ Wrinkles have increased - consider adding retinol or peptide products");
    }

    // Redness recommendations
    if (toAnalysis.redness < fromAnalysis.redness) {
      recommendations.push("✓ Redness is decreasing - keep using calming ingredients");
    } else if (toAnalysis.redness > fromAnalysis.redness) {
      recommendations.push("⚠ Redness has increased - avoid potential irritants and use soothing products");
    }

    // Oiliness recommendations
    if (toAnalysis.oiliness < fromAnalysis.oiliness) {
      recommendations.push("✓ Oiliness is reducing - maintain your current skincare routine");
    } else if (toAnalysis.oiliness > fromAnalysis.oiliness) {
      recommendations.push("⚠ Oiliness has increased - consider oil-control products");
    }

    if (recommendations.length === 0) {
      recommendations.push("• Your skin metrics are stable - maintain consistency with your routine");
    }

    return recommendations;
  };

  const calculateSkinScore = (analysis) => {
    const weightedSum =
      (analysis.wrinkles || 0) * 0.3 +
      (analysis.redness || 0) * 0.2 +
      (analysis.oiliness || 0) * 0.2 +
      (analysis.acne || 0) * 0.2 +
      (analysis.dark_circles || 0) * 0.1;
    return Math.max(0, Math.min(100, 100 - weightedSum)).toFixed(1);
  };

  const downloadPDF = async () => {
    if (analyses.length < 2) {
      alert("You need at least 2 analyses to generate a report");
      return;
    }

    setIsGenerating(true);
    try {
      const fromAnalysis = analyses[analyses.length - 1]; // Oldest
      const toAnalysis = analyses[0]; // Most recent

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Title
      doc.setFontSize(24);
      doc.setTextColor(30, 41, 59);
      doc.text("Skin Analysis Report", pageWidth / 2, yPosition, { align: "center" });

      yPosition += 15;
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      const dateRange = `${new Date(fromAnalysis.timestamp).toLocaleDateString()} to ${new Date(toAnalysis.timestamp).toLocaleDateString()}`;
      doc.text(dateRange, pageWidth / 2, yPosition, { align: "center" });

      // Summary Section
      yPosition += 15;
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Summary", 20, yPosition);

      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(60, 80, 110);

      const recommendations = generateMetricsRecommendations(
        fromAnalysis,
        toAnalysis
      );
      recommendations.forEach((rec) => {
        doc.text(rec, 25, yPosition);
        yPosition += 7;
      });

      // Metrics Comparison Section
      yPosition += 5;
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Metrics Comparison", 20, yPosition);

      yPosition += 10;
      doc.setFontSize(9);

      const metrics = [
        { name: "Wrinkles", key: "wrinkles" },
        { name: "Redness", key: "redness" },
        { name: "Oiliness", key: "oiliness" },
      ];

      metrics.forEach((metric) => {
        const oldValue = fromAnalysis[metric.key] || 0;
        const newValue = toAnalysis[metric.key] || 0;
        const delta = newValue - oldValue;
        const percentage =
          oldValue !== 0 ? ((delta / oldValue) * 100).toFixed(1) : 0;

        doc.setTextColor(60, 80, 110);
        doc.text(metric.name, 25, yPosition);
        doc.text(
          `${oldValue} → ${newValue} (${delta > 0 ? "+" : ""}${delta}, ${percentage}%)`,
          120,
          yPosition
        );
        yPosition += 6;
      });

      // Skin Health Scores
      yPosition += 8;
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Skin Health Score", 20, yPosition);

      yPosition += 10;
      doc.setFontSize(10);
      const scoreFrom = calculateSkinScore(fromAnalysis);
      const scoreTo = calculateSkinScore(toAnalysis);

      doc.setTextColor(60, 80, 110);
      doc.text(`Initial Score: ${scoreFrom}/100`, 25, yPosition);
      yPosition += 6;
      doc.text(`Current Score: ${scoreTo}/100`, 25, yPosition);
      yPosition += 6;

      const scoreImprovement = scoreTo - scoreFrom;
      if (scoreImprovement > 0) {
        doc.setTextColor(34, 197, 94);
      } else {
        doc.setTextColor(239, 68, 68);
      }
      const changeText = `Change: ${scoreImprovement > 0 ? "+" : ""}${scoreImprovement.toFixed(1)} points`;
      doc.text(changeText, 25, yPosition);

      // Footer
      yPosition = doc.internal.pageSize.getHeight() - 20;
      doc.setFontSize(9);
      doc.setTextColor(150, 160, 180);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} | AinaAi Skin Analysis`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );

      // Save PDF
      doc.save(`skin-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF report");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (analyses.length < 2) {
      alert("You need at least 2 analyses to generate a report");
      return;
    }

    setIsGenerating(true);
    try {
      const element = reportRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `skin-report-${new Date().toISOString().split("T")[0]}.png`;
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  if (analyses.length < 2) {
    return (
      <div className="lk-panel">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>Export report</h3>
        <div className="text-center py-8" style={{ color: "var(--muted)" }}>
          <p>You need at least 2 analyses to generate a report</p>
        </div>
      </div>
    );
  }

  const fromAnalysis = analyses[analyses.length - 1];
  const toAnalysis = analyses[0];
  const scoreDelta = calculateSkinScore(toAnalysis) - calculateSkinScore(fromAnalysis);
  const improved = scoreDelta >= 0;

  return (
    <div className="space-y-6">
      {/* Report Preview — explicit hex/rgba colors so html2canvas captures cleanly */}
      <div
        ref={reportRef}
        className="rounded-2xl p-8"
        style={{ background: "#fffdfb", border: "1px solid rgba(46,31,36,0.1)" }}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: "#2e1f24" }}>
            Skin Analysis Report
          </h2>
          <p style={{ color: "#6b5157" }}>
            {new Date(fromAnalysis.timestamp).toLocaleDateString()} to{" "}
            {new Date(toAnalysis.timestamp).toLocaleDateString()}
          </p>
        </div>

        {/* Summary */}
        <div className="mb-8 p-4 rounded-xl" style={{ background: "#fbe0e6", border: "1px solid rgba(232,96,125,0.25)" }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: "#2e1f24" }}>Summary</h3>
          <ul className="space-y-2 text-sm" style={{ color: "#2e1f24" }}>
            {generateMetricsRecommendations(fromAnalysis, toAnalysis).map(
              (rec, idx) => (
                <li key={idx}>{rec}</li>
              )
            )}
          </ul>
        </div>

        {/* Metrics Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "#2e1f24" }}>
            Metrics Comparison
          </h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(46,31,36,0.15)" }}>
                <th className="text-left p-2 font-semibold" style={{ color: "#2e1f24" }}>Metric</th>
                <th className="text-right p-2 font-semibold" style={{ color: "#2e1f24" }}>Before</th>
                <th className="text-right p-2 font-semibold" style={{ color: "#2e1f24" }}>After</th>
                <th className="text-right p-2 font-semibold" style={{ color: "#2e1f24" }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {["wrinkles", "redness", "oiliness"].map((metric) => {
                const oldValue = fromAnalysis[metric] || 0;
                const newValue = toAnalysis[metric] || 0;
                const delta = newValue - oldValue;
                const percentage =
                  oldValue !== 0 ? ((delta / oldValue) * 100).toFixed(1) : 0;
                const deltaColor = delta < 0 ? "#0f7a37" : delta > 0 ? "#a83452" : "#6b5157";

                return (
                  <tr key={metric} style={{ borderBottom: "1px solid rgba(46,31,36,0.1)" }}>
                    <td className="p-2 capitalize font-medium" style={{ color: "#2e1f24" }}>
                      {metric}
                    </td>
                    <td className="text-right p-2" style={{ color: "#6b5157" }}>{oldValue}</td>
                    <td className="text-right p-2" style={{ color: "#6b5157" }}>{newValue}</td>
                    <td className="text-right p-2 font-semibold" style={{ color: deltaColor }}>
                      {delta > 0 ? "+" : ""}
                      {delta} ({percentage}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Skin Health Scores */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl" style={{ background: "#fdf3f3", border: "1px solid rgba(46,31,36,0.1)" }}>
            <p className="text-sm mb-1" style={{ color: "#6b5157" }}>Initial Score</p>
            <p className="text-2xl font-bold" style={{ color: "#2e1f24" }}>
              {calculateSkinScore(fromAnalysis)}/100
            </p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "#fdf3f3", border: "1px solid rgba(46,31,36,0.1)" }}>
            <p className="text-sm mb-1" style={{ color: "#6b5157" }}>Current Score</p>
            <p className="text-2xl font-bold" style={{ color: "#2e1f24" }}>
              {calculateSkinScore(toAnalysis)}/100
            </p>
          </div>
          <div
            className="p-4 rounded-xl"
            style={
              improved
                ? { background: "rgba(23,163,74,0.1)", border: "1px solid rgba(23,163,74,0.3)" }
                : { background: "#fbe0e6", border: "1px solid rgba(232,96,125,0.35)" }
            }
          >
            <p className="text-sm mb-1" style={{ color: "#6b5157" }}>Improvement</p>
            <p className="text-2xl font-bold" style={{ color: improved ? "#0f7a37" : "#a83452" }}>
              {scoreDelta.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 text-center text-xs" style={{ borderTop: "1px solid rgba(46,31,36,0.1)", color: "#6b5157" }}>
          <p>Generated on {new Date().toLocaleDateString()} | AinaAi Skin Analysis</p>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="lk-panel flex gap-4">
        <button
          onClick={downloadPDF}
          disabled={isGenerating}
          className="lk-btn-primary flex-1"
          style={{ flex: 1, opacity: isGenerating ? 0.5 : 1 }}
        >
          {isGenerating ? "Generating…" : "📥 Download PDF"}
        </button>
        <button
          onClick={downloadImage}
          disabled={isGenerating}
          className="flex-1 px-4 py-3 rounded-full font-medium transition"
          style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border-soft)", opacity: isGenerating ? 0.5 : 1 }}
        >
          {isGenerating ? "Generating…" : "🖼️ Download image"}
        </button>
      </div>
    </div>
  );
}
