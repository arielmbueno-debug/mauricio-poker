"use client";

import { trpc } from "@/lib/trpc/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

export function RoiByModalityChart() {
  const { data, isLoading } = trpc.decisions.byModality.useQuery();
  if (isLoading) {
    return (
      <div className="panel p-4 h-72 flex items-center justify-center text-fg-muted">
        Calculando…
      </div>
    );
  }
  const rows = (data ?? []).map((d) => ({
    label: d.label,
    roi: d.roi * 100,
    n: d.n,
  }));
  return (
    <div className="panel p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-fg-primary">ROI por modalidade</h3>
        <span className="text-2xs text-fg-muted">Turbo × Bounty</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2731" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#6b7785" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#6b7785" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              width={48}
            />
            <Tooltip
              formatter={(v: number, _name, ctx) => [`${v.toFixed(1)}%`, `ROI (${(ctx.payload as { n: number }).n}t)`]}
              contentStyle={{ backgroundColor: "#141a22", border: "1px solid #2a3340", fontSize: 12 }}
            />
            <Bar dataKey="roi" radius={[2, 2, 0, 0]}>
              {rows.map((r) => (
                <Cell key={r.label} fill={r.roi >= 0 ? "#34d399" : "#f87171"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
