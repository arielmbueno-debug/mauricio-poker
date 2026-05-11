"use client";

import { trpc } from "@/lib/trpc/client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { fmtUSD, fmtDate } from "@/lib/utils";

export function BankrollChart() {
  const { data, isLoading } = trpc.bankroll.history.useQuery();
  if (isLoading) {
    return (
      <div className="panel p-4 h-72 flex items-center justify-center text-fg-muted">
        Carregando histórico de banca…
      </div>
    );
  }
  const points = (data ?? []).map((p) => ({
    ts: new Date(p.at).getTime(),
    label: fmtDate(p.at),
    balance: Math.round(p.balance),
  }));

  return (
    <div className="panel p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-fg-primary">Banca ao longo do tempo</h3>
        <span className="text-2xs text-fg-muted tabular">
          {points.length} eventos
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="brGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4a437" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#d4a437" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2731" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#6b7785" }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#6b7785" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => fmtUSD(v, { compact: true })}
              width={60}
            />
            <Tooltip
              formatter={(v: number) => [fmtUSD(v), "Banca"]}
              labelFormatter={(l) => l}
              contentStyle={{
                backgroundColor: "#141a22",
                border: "1px solid #2a3340",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#d4a437"
              strokeWidth={1.5}
              fill="url(#brGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
