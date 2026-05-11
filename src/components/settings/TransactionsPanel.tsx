"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { ArrowDownToLine, ArrowUpFromLine, Loader2, Trash2 } from "lucide-react";
import { fmtUSD, fmtDate, cn } from "@/lib/utils";

export function TransactionsPanel() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.bankroll.listTransactions.useQuery();
  const [form, setForm] = useState({ kind: "deposit" as "deposit" | "withdrawal", amount: "" });
  const add = trpc.bankroll.addTransaction.useMutation({
    onSuccess: () => {
      utils.bankroll.listTransactions.invalidate();
      utils.bankroll.current.invalidate();
      utils.decisions.kpis.invalidate();
      setForm((f) => ({ ...f, amount: "" }));
    },
  });
  const del = trpc.bankroll.deleteTransaction.useMutation({
    onSuccess: () => {
      utils.bankroll.listTransactions.invalidate();
      utils.bankroll.current.invalidate();
      utils.decisions.kpis.invalidate();
    },
  });

  return (
    <div className="panel p-4 space-y-3">
      <h3 className="text-sm font-semibold">Depósitos & saques</h3>
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const amount = Number.parseFloat(form.amount);
          if (!Number.isFinite(amount) || amount <= 0) return;
          add.mutate({ kind: form.kind, amount });
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-2xs uppercase tracking-wider text-fg-muted">Tipo</span>
          <select
            value={form.kind}
            onChange={(e) =>
              setForm((f) => ({ ...f, kind: e.target.value as "deposit" | "withdrawal" }))
            }
            className="input"
          >
            <option value="deposit">Depósito</option>
            <option value="withdrawal">Saque</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-2xs uppercase tracking-wider text-fg-muted">Valor (USD)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="input"
            required
          />
        </label>
        <button
          type="submit"
          disabled={add.isPending}
          className="px-3 py-1.5 bg-accent text-bg-base text-xs font-medium rounded hover:bg-accent-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {add.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Registrar
        </button>
      </form>
      <div className="divider" />
      {isLoading ? (
        <div className="text-sm text-fg-muted">Carregando…</div>
      ) : (
        <ul className="space-y-1 text-xs tabular">
          {(data ?? []).map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-bg-hover"
            >
              <div className="flex items-center gap-2">
                {t.kind === "deposit" ? (
                  <ArrowDownToLine className="w-3.5 h-3.5 text-positive" />
                ) : (
                  <ArrowUpFromLine className="w-3.5 h-3.5 text-negative" />
                )}
                <span className="text-fg-secondary">{fmtDate(t.occurredAt)}</span>
                <span className="text-fg-muted">·</span>
                <span className="capitalize text-fg-secondary">{t.kind === "deposit" ? "Depósito" : "Saque"}</span>
                {t.note && <span className="text-fg-muted">— {t.note}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-medium",
                    t.kind === "deposit" ? "text-positive" : "text-negative",
                  )}
                >
                  {t.kind === "deposit" ? "+" : "−"}
                  {fmtUSD(t.amount)}
                </span>
                <button
                  type="button"
                  aria-label="excluir"
                  className="text-fg-muted hover:text-negative"
                  onClick={() => {
                    if (confirm("Excluir esta transação?")) del.mutate({ id: t.id });
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </li>
          ))}
          {(data ?? []).length === 0 && (
            <li className="text-fg-muted text-center py-4">Nenhuma transação registrada.</li>
          )}
        </ul>
      )}
    </div>
  );
}
