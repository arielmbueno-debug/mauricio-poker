"use client";

import { RiskProfileSelector } from "@/components/settings/RiskProfileSelector";
import { TransactionsPanel } from "@/components/settings/TransactionsPanel";
import { trpc } from "@/lib/trpc/client";
import { fmtUSD } from "@/lib/utils";

export default function ConfiguracoesPage() {
  const { data } = trpc.bankroll.current.useQuery();
  return (
    <div className="space-y-5 max-w-[1000px]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-2xs text-fg-muted mt-0.5">
          Perfil de risco e gestão de transações. Bankroll é auto-computado a partir delas.
        </p>
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="panel p-4">
            <div className="stat-label">DEPÓSITOS</div>
            <div className="text-xl font-semibold tabular text-positive mt-1">
              +{fmtUSD(data.deposits)}
            </div>
          </div>
          <div className="panel p-4">
            <div className="stat-label">SAQUES</div>
            <div className="text-xl font-semibold tabular text-negative mt-1">
              −{fmtUSD(data.withdrawals)}
            </div>
          </div>
          <div className="panel p-4">
            <div className="stat-label">LUCRO POKER</div>
            <div className={`text-xl font-semibold tabular mt-1 ${data.profits >= 0 ? "text-positive" : "text-negative"}`}>
              {data.profits >= 0 ? "+" : ""}
              {fmtUSD(data.profits)}
            </div>
          </div>
        </div>
      )}

      <RiskProfileSelector />
      <TransactionsPanel />
    </div>
  );
}
