"use client";

import { trpc } from "@/lib/trpc/client";
import { fmtUSD, fmtDate, cn } from "@/lib/utils";
import { SITE_LABEL, type PokerSite } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function SessionsTable() {
  const [take, setTake] = useState(100);
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.tournaments.list.useQuery({ take });
  const deleteOne = trpc.tournaments.delete.useMutation({
    onSuccess: () => {
      utils.tournaments.list.invalidate();
      utils.decisions.kpis.invalidate();
      utils.bankroll.current.invalidate();
    },
  });

  if (isLoading) {
    return <div className="panel p-4 text-fg-muted text-sm">Carregando torneios…</div>;
  }
  const rows = data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-2xs text-fg-muted">
        <span>{rows.length} torneios exibidos</span>
        <button
          type="button"
          className="underline hover:text-fg-secondary"
          onClick={() => setTake((n) => n + 100)}
        >
          mostrar mais
        </button>
      </div>
      <div className="panel overflow-hidden">
        <table className="w-full text-xs tabular">
          <thead className="text-fg-muted border-b border-border bg-bg-elev/50">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider">Data</th>
              <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider">Site</th>
              <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider">Tipo</th>
              <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider text-right">Buy-in</th>
              <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider text-right">Re/Add</th>
              <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider text-right">Field</th>
              <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider text-right">Pos</th>
              <th className="px-3 py-2 font-medium uppercase text-2xs tracking-wider text-right">Lucro</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="table-row">
                <td className="px-3 py-2 text-fg-secondary">{fmtDate(t.playedAt)}</td>
                <td className="px-3 py-2 text-fg-primary">
                  {SITE_LABEL[t.site as PokerSite] ?? t.site}
                </td>
                <td className="px-3 py-2 text-fg-secondary">
                  {t.isTurbo ? "Turbo " : ""}
                  {t.isBounty ? "PKO" : "Reg"}
                </td>
                <td className="px-3 py-2 text-right text-fg-secondary">{fmtUSD(t.buyIn)}</td>
                <td className="px-3 py-2 text-right text-fg-muted">
                  {t.reEntries}/{t.addOns}
                </td>
                <td className="px-3 py-2 text-right text-fg-muted">{t.fieldSize ?? "—"}</td>
                <td className="px-3 py-2 text-right text-fg-secondary">
                  {t.finalTablePosition ?? (t.itm ? "ITM" : "—")}
                </td>
                <td
                  className={cn(
                    "px-3 py-2 text-right font-medium",
                    t.profit >= 0 ? "text-positive" : "text-negative",
                  )}
                >
                  {fmtUSD(t.profit)}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    aria-label="excluir"
                    className="text-fg-muted hover:text-negative transition-colors"
                    onClick={() => {
                      if (confirm("Excluir esse torneio?")) deleteOne.mutate({ id: t.id });
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-fg-muted">
                  Nenhum torneio registrado ainda. Use o formulário acima ou /importar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
