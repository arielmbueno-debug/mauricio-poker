"use client";

import { SessionsTable } from "@/components/sessions/SessionsTable";
import { SessionForm } from "@/components/sessions/SessionForm";

export default function SessoesPage() {
  return (
    <div className="space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Sessões</h1>
        <p className="text-2xs text-fg-muted mt-0.5">
          Lista de torneios registrados. Adicione novos pelo formulário ou /importar.
        </p>
      </div>
      <SessionForm />
      <SessionsTable />
    </div>
  );
}
