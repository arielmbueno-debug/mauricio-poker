"use client";

import { CsvDropzone } from "@/components/import/CsvDropzone";

const SAMPLE_CSV = `data,site,buy_in,re_entries,add_ons,turbo,bounty,itm,posicao_mesa_final,field_size,lucro
2026-04-15,GGPoker,22,0,0,false,true,true,3,840,420
2026-04-15,PokerStars,11,1,0,true,false,false,,1200,-22
2026-04-14,GG,55,0,0,false,true,true,,420,80`;

export default function ImportarPage() {
  return (
    <div className="space-y-5 max-w-[1000px]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Importar histórico</h1>
        <p className="text-2xs text-fg-muted mt-0.5">
          Importação em massa via CSV. O sistema valida cada linha antes de commit.
        </p>
      </div>

      <CsvDropzone />

      <div className="panel p-4 space-y-2">
        <h3 className="text-sm font-semibold">Formato esperado</h3>
        <p className="text-xs text-fg-secondary">
          Cabeçalhos em qualquer caixa, separador vírgula, datas em ISO ou DD/MM/AAAA. Booleanos
          aceitam true/false/1/0/sim/não.
        </p>
        <pre className="text-2xs tabular bg-bg-elev rounded p-3 overflow-x-auto text-fg-secondary">
          {SAMPLE_CSV}
        </pre>
        <p className="text-2xs text-fg-muted">
          Site aceita: PokerStars/Stars/PS, GGPoker/GG, partypoker/Party, 888poker/888, WPT Global.
        </p>
      </div>
    </div>
  );
}
