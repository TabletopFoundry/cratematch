"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

import type { RadarDatum } from "@/lib/types";

export function TasteRadarChart({ data }: { data: RadarDatum[] }) {
  const summaryText = data
    .map((d) => `${d.subject}: ${Math.round((d.score / d.fullMark) * 100)}%`)
    .join(", ");

  return (
    <div
      className="h-72 w-full"
      role="img"
      aria-label={`Taste profile radar chart. ${summaryText}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(120,53,15,0.18)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#7c2d12", fontSize: 12 }} />
          <Radar
            name="Taste profile"
            dataKey="score"
            stroke="#c2410c"
            fill="#fb923c"
            fillOpacity={0.55}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      <table className="sr-only">
        <caption>Taste profile scores</caption>
        <thead>
          <tr><th>Dimension</th><th>Score</th><th>Max</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.subject}>
              <td>{d.subject}</td>
              <td>{d.score}</td>
              <td>{d.fullMark}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
