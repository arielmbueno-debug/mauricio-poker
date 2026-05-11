"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { POKER_SITES, SITE_LABEL, type PokerSite } from "@/lib/types";
import { Plus, Loader2 } from "lucide-react";

const todayLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export function SessionForm() {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    playedAt: todayLocal(),
    site: "GGPOKER" as PokerSite,
    buyIn: "",
    reEntries: "0",
    addOns: "0",
    isTurbo: false,
    isBounty: false,
    itm: false,
    finalTablePosition: "",
    fieldSize: "",
    profit: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const create = trpc.tournaments.create.useMutation({
    onSuccess: () => {
      utils.tournaments.list.invalidate();
      utils.decisions.kpis.invalidate();
      utils.bankroll.current.invalidate();
      utils.decisions.alerts.invalidate();
      setForm((f) => ({
        ...f,
        buyIn: "",
        reEntries: "0",
        addOns: "0",
        finalTablePosition: "",
        profit: "",
        notes: "",
      }));
      setError(null);
    },
    onError: (e) => setError(e.message),
  });

  return (
    <form
      className="panel p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const buyIn = Number.parseFloat(form.buyIn);
        const profit = Number.parseFloat(form.profit);
        if (!Number.isFinite(buyIn) || !Number.isFinite(profit)) {
          setError("Buy-in e lucro são obrigatórios.");
          return;
        }
        create.mutate({
          playedAt: new Date(form.playedAt),
          site: form.site,
          buyIn,
          reEntries: Number.parseInt(form.reEntries) || 0,
          addOns: Number.parseInt(form.addOns) || 0,
          isTurbo: form.isTurbo,
          isBounty: form.isBounty,
          itm: form.itm,
          finalTablePosition: form.finalTablePosition
            ? Number.parseInt(form.finalTablePosition)
            : null,
          fieldSize: form.fieldSize ? Number.parseInt(form.fieldSize) : null,
          profit,
          notes: form.notes || null,
        });
      }}
    >
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Plus className="w-4 h-4 text-accent" /> Registrar novo torneio
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Data/hora">
          <input
            type="datetime-local"
            value={form.playedAt}
            onChange={(e) => setForm((f) => ({ ...f, playedAt: e.target.value }))}
            className="input"
          />
        </Field>
        <Field label="Site">
          <select
            value={form.site}
            onChange={(e) => setForm((f) => ({ ...f, site: e.target.value as PokerSite }))}
            className="input"
          >
            {POKER_SITES.map((s) => (
              <option key={s} value={s}>
                {SITE_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Buy-in (USD)">
          <input
            type="number"
            step="0.01"
            value={form.buyIn}
            onChange={(e) => setForm((f) => ({ ...f, buyIn: e.target.value }))}
            className="input"
            required
          />
        </Field>
        <Field label="Lucro (USD)">
          <input
            type="number"
            step="0.01"
            value={form.profit}
            onChange={(e) => setForm((f) => ({ ...f, profit: e.target.value }))}
            className="input"
            required
          />
        </Field>
        <Field label="Re-entries">
          <input
            type="number"
            min="0"
            value={form.reEntries}
            onChange={(e) => setForm((f) => ({ ...f, reEntries: e.target.value }))}
            className="input"
          />
        </Field>
        <Field label="Add-ons">
          <input
            type="number"
            min="0"
            value={form.addOns}
            onChange={(e) => setForm((f) => ({ ...f, addOns: e.target.value }))}
            className="input"
          />
        </Field>
        <Field label="Field size (opc.)">
          <input
            type="number"
            min="1"
            value={form.fieldSize}
            onChange={(e) => setForm((f) => ({ ...f, fieldSize: e.target.value }))}
            className="input"
          />
        </Field>
        <Field label="Posição (se FT)">
          <input
            type="number"
            min="1"
            max="9"
            value={form.finalTablePosition}
            onChange={(e) => setForm((f) => ({ ...f, finalTablePosition: e.target.value }))}
            className="input"
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Toggle
          label="Turbo"
          value={form.isTurbo}
          onChange={(v) => setForm((f) => ({ ...f, isTurbo: v }))}
        />
        <Toggle
          label="Bounty / PKO"
          value={form.isBounty}
          onChange={(v) => setForm((f) => ({ ...f, isBounty: v }))}
        />
        <Toggle
          label="ITM"
          value={form.itm}
          onChange={(v) => setForm((f) => ({ ...f, itm: v }))}
        />
      </div>
      {error && <div className="text-xs text-negative">{error}</div>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={create.isPending}
          className="px-3 py-1.5 bg-accent text-bg-base font-medium text-xs rounded hover:bg-accent-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {create.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Adicionar
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-2xs uppercase tracking-wider text-fg-muted">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-xs">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-accent"
      />
      <span className="text-fg-secondary">{label}</span>
    </label>
  );
}
