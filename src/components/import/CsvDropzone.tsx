"use client";

import { useState } from "react";
import Papa from "papaparse";
import { trpc } from "@/lib/trpc/client";
import { Upload, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export function CsvDropzone() {
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [previewResult, setPreviewResult] = useState<{
    valid: { length: number };
    errors: { row: number; message: string }[];
    totalRows: number;
  } | null>(null);
  const [validBuffer, setValidBuffer] = useState<unknown[]>([]);
  const [committed, setCommitted] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const preview = trpc.importer.preview.useMutation({
    onSuccess: (res) => {
      setPreviewResult({ valid: { length: res.valid.length }, errors: res.errors, totalRows: res.totalRows });
      setValidBuffer(res.valid);
    },
  });
  const commit = trpc.importer.commit.useMutation({
    onSuccess: (res) => {
      setCommitted(res.inserted);
      utils.tournaments.list.invalidate();
      utils.decisions.kpis.invalidate();
      utils.bankroll.current.invalidate();
      utils.tournaments.count.invalidate();
    },
  });

  const handleFile = (file: File) => {
    setParsing(true);
    setCommitted(null);
    setPreviewResult(null);
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, ""),
      complete: (res) => {
        setParsing(false);
        setRows(res.data);
        preview.mutate({ rows: res.data });
      },
      error: () => setParsing(false),
    });
  };

  return (
    <div className="space-y-4">
      <div className="panel p-6 border-dashed border-border-strong">
        <label
          htmlFor="csv-input"
          className="flex flex-col items-center justify-center gap-3 cursor-pointer"
        >
          <Upload className="w-8 h-8 text-fg-muted" />
          <div className="text-center">
            <div className="text-sm font-medium">Selecione um arquivo CSV</div>
            <div className="text-2xs text-fg-muted mt-1 max-w-md">
              Colunas esperadas (pt-BR aceitas): data, site, buy_in, re_entries, add_ons,
              turbo, bounty, itm, posicao_mesa_final, field_size, lucro
            </div>
          </div>
          <input
            id="csv-input"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <span className="text-2xs text-fg-dim">ou arraste e solte (em breve)</span>
        </label>
      </div>

      {parsing && (
        <div className="panel p-3 text-sm text-fg-muted flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> processando CSV…
        </div>
      )}

      {rows && previewResult && (
        <div className="space-y-3">
          <div className="panel p-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">Pré-visualização</h3>
              <span className="text-2xs text-fg-muted">{previewResult.totalRows} linhas</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <Stat
                label="Válidas"
                value={previewResult.valid.length}
                color="text-positive"
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              />
              <Stat
                label="Com erro"
                value={previewResult.errors.length}
                color="text-negative"
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
              />
              <Stat
                label="Total"
                value={previewResult.totalRows}
                color="text-fg-secondary"
                icon={null}
              />
            </div>
            {previewResult.errors.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-fg-secondary">
                  Ver erros ({previewResult.errors.length})
                </summary>
                <ul className="mt-2 space-y-0.5 text-fg-muted">
                  {previewResult.errors.slice(0, 20).map((e) => (
                    <li key={e.row}>
                      <span className="text-fg-secondary">linha {e.row}</span>: {e.message}
                    </li>
                  ))}
                  {previewResult.errors.length > 20 && (
                    <li>… +{previewResult.errors.length - 20} erros</li>
                  )}
                </ul>
              </details>
            )}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={previewResult.valid.length === 0 || commit.isPending}
                onClick={() => commit.mutate({ tournaments: validBuffer as never })}
                className="px-3 py-1.5 bg-accent text-bg-base font-medium text-xs rounded hover:bg-accent-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {commit.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Importar {previewResult.valid.length} torneios
              </button>
            </div>
          </div>
        </div>
      )}

      {committed != null && (
        <div className="panel p-3 text-sm flex items-center gap-2 border-positive/40 bg-positive-dim/30 text-positive">
          <CheckCircle2 className="w-4 h-4" />
          {committed} torneios importados com sucesso.
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-2xs text-fg-muted uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <span className={`text-lg font-semibold tabular ${color}`}>{value}</span>
    </div>
  );
}
