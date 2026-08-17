import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAnalysisHistory } from "../hooks/useAnalysisHistory";

// Three distinguishable warm series that sit within the Rose Derma palette.
const SERIES = {
  wrinkles: { stroke: "#e8607d", tint: "var(--accent-soft)", text: "#a83452" },
  redness: { stroke: "#e0855b", tint: "rgba(224,133,91,0.12)", text: "#9c5227" },
  oiliness: { stroke: "#d9a324", tint: "rgba(217,163,36,0.14)", text: "#8a6410" },
};

export function TrendChart() {
  const { analyses } = useAnalysisHistory();

  const chartData = useMemo(() => {
    return analyses
      .slice()
      .reverse()
      .map((analysis) => ({
        date: new Date(analysis.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        wrinkles: analysis.wrinkles || 0,
        redness: analysis.redness || 0,
        oiliness: analysis.oiliness || 0,
        fullDate: new Date(analysis.timestamp),
      }));
  }, [analyses]);

  if (chartData.length === 0) {
    return (
      <div className="lk-panel">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>Trend chart</h3>
        <div className="text-center py-8" style={{ color: "var(--muted)" }}>
          <p>No data available yet. Upload photos to see trends.</p>
        </div>
      </div>
    );
  }

  const avg = (key) =>
    (chartData.reduce((sum, d) => sum + d[key], 0) / chartData.length).toFixed(1);

  return (
    <div className="lk-panel">
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>Metric trends (last 90 days)</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
            formatter={(value) => value}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
          <Line
            type="monotone"
            dataKey="wrinkles"
            stroke={SERIES.wrinkles.stroke}
            strokeWidth={2}
            dot={{ fill: SERIES.wrinkles.stroke, r: 4 }}
            activeDot={{ r: 6 }}
            name="Wrinkles"
          />
          <Line
            type="monotone"
            dataKey="redness"
            stroke={SERIES.redness.stroke}
            strokeWidth={2}
            dot={{ fill: SERIES.redness.stroke, r: 4 }}
            activeDot={{ r: 6 }}
            name="Redness"
          />
          <Line
            type="monotone"
            dataKey="oiliness"
            stroke={SERIES.oiliness.stroke}
            strokeWidth={2}
            dot={{ fill: SERIES.oiliness.stroke, r: 4 }}
            activeDot={{ r: 6 }}
            name="Oiliness"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
        {[
          ["Wrinkles avg", "wrinkles"],
          ["Redness avg", "redness"],
          ["Oiliness avg", "oiliness"],
        ].map(([label, key]) => (
          <div key={key} className="p-3 rounded-xl" style={{ background: SERIES[key].tint }}>
            <p style={{ color: "var(--muted)" }}>{label}</p>
            <p className="text-lg font-bold" style={{ color: SERIES[key].text }}>
              {avg(key)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
