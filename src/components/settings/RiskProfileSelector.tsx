"use client";

import { trpc } from "@/lib/trpc/client";
import { RISK_PROFILES, type RiskProfile } from "@/lib/types";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<RiskProfile, { name: string; desc: string }> = {
  conservative: {
    name: "Conservador",
    desc: "200 BIs MTT / 175 PKO. Para quem não tem reload disponível.",
  },
  moderate: {
    name: "Moderado",
    desc: "150 BIs MTT / 130 PKO. Padrão profissional.",
  },
  aggressive: {
    name: "Agressivo",
    desc: "100 BIs MTT / 90 PKO. Só com reload imediato.",
  },
};

export function RiskProfileSelector() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.settings.get.useQuery();
  const update = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      utils.decisions.dailyTarget.invalidate();
      utils.decisions.alerts.invalidate();
    },
  });
  if (isLoading || !data) {
    return <div className="panel p-4 text-fg-muted text-sm">Carregando…</div>;
  }
  return (
    <div className="panel p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold">Perfil de risco</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {RISK_PROFILES.map((p) => {
          const active = data.riskProfile === p;
          const meta = LABELS[p];
          return (
            <button
              key={p}
              type="button"
              onClick={() => update.mutate({ riskProfile: p })}
              className={cn(
                "rounded p-3 border text-left transition-colors",
                active
                  ? "border-accent bg-accent-dim/40 text-fg-primary"
                  : "border-border bg-bg-elev/50 text-fg-secondary hover:bg-bg-hover",
              )}
            >
              <div className="text-sm font-medium">{meta.name}</div>
              <div className="text-2xs text-fg-muted mt-1 leading-snug">{meta.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
