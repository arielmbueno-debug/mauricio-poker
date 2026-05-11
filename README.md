# Poker Decisions

Dashboard de decisões para grinders de MTT online. Foco em **estratégia** (qual torneio priorizar, qual buy-in jogar) e não em registro histórico.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript estrito
- tRPC 11 + TanStack Query — type-safety end-to-end client↔server
- Prisma 6 + SQLite — DB local, zero config
- Tailwind CSS 3 + Recharts — UI Lobbyze-style (dark + dense + data-first)
- Zod — validação nas bordas (CSV, formulários, API)
- Vitest — testes unitários do core de domínio
- Branded types (USD, BuyIns, ROI, Probability) — impede confundir unidades no compilador

## Setup (do zero)

```bash
npm install
npm run db:generate    # gera o client Prisma
npm run db:push        # cria SQLite + tabelas
npm run db:seed        # 620 torneios mock realistas + 3 transações
npm run dev            # http://localhost:3000
```

Atalho: `npm run setup` faz tudo de uma vez.

## Scripts

| script | função |
|---|---|
| `npm run dev` | dev server (http://localhost:3000) |
| `npm run build` | build de produção |
| `npm run start` | serve build de produção |
| `npm test` | roda os testes do core (Vitest) |
| `npm run test:watch` | TDD mode |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:reset` | dropa, recria, re-seed |
| `npm run db:seed` | apenas re-seed |

## Estrutura

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Visão Geral (home)
│   ├── decisoes/           # rankings + alertas + buy-in alvo
│   ├── sessoes/            # CRUD de torneios + form
│   ├── importar/           # CSV upload + preview
│   ├── configuracoes/      # perfil de risco + transações
│   └── api/trpc/[trpc]/    # tRPC fetch adapter
├── components/             # UI components (charts, tables, cards, forms)
├── core/                   # Algoritmos puros (TDD'd com Vitest)
│   ├── roi.ts              # ROI por torneio e agregado
│   ├── itm.ts              # taxa ITM e FT
│   ├── wilson.ts           # CI para proporções e ROI
│   ├── risk-adjusted-roi.ts# Sharpe-like ratio + shrinkage
│   ├── trend.ts            # 30d vs lifetime
│   ├── buy-in-target.ts    # multiplicadores por perfil/modalidade
│   ├── sample-size.ts      # confiança por n
│   ├── rankings.ts         # ranking de combinações (site × tipo × tier)
│   ├── alerts.ts           # geração de alertas/insights
│   └── bankroll.ts         # cálculo da banca a partir de transações
├── server/
│   ├── trpc.ts             # tRPC instance + superjson
│   └── routers/
│       ├── tournaments.ts  # CRUD + bulk
│       ├── bankroll.ts     # banca + histórico + transações
│       ├── decisions.ts    # KPIs, rankings, alerts, daily target
│       ├── importer.ts     # CSV preview + commit
│       └── settings.ts     # perfil de risco
└── lib/
    ├── types.ts            # branded types + enums
    ├── schemas.ts          # Zod schemas
    ├── db.ts               # Prisma singleton
    ├── utils.ts            # cn, fmtUSD, fmtPct, fmtDate
    └── trpc/               # client + provider

prisma/
├── schema.prisma           # 3 models: Tournament, Transaction, Settings
└── seed.ts                 # gerador de mock realista (calibrado por baseline ROI)
```

## Decisões de produto que o sistema toma

| ID | Decisão | Algoritmo |
|---|---|---|
| **D1** | Ranking risk-adjusted de (site × modalidade × tier) | mean/stddev + shrinkage k=30 |
| **D2** | Buy-in alvo do dia (range) | BR / multiplicador por perfil + modalidade |
| **D3** | Alertas de gestão de banca | regras: exposição, downswing, volume, growth |
| **D4** | Avisos de sample size insuficiente | classes: low (<30) / moderate / good / high |
| **D5** | Tendência ROI 30d vs lifetime | delta com threshold 5pp |

Fora de escopo no v1 (planejados para v2):
- D6: downswing detection com modelo de EV (precisaria de field size em 100% dos registros)
- Integração ao vivo com lobbies (Lobbyze faz isso bem; nossa diferenciação é decisão)
- Multi-currency com câmbio dinâmico
- Auth multi-usuário (single-user local-first)

## Schema do CSV de importação

Cabeçalhos aceitos (case-insensitive, sublinhado):
```
data,site,buy_in,re_entries,add_ons,turbo,bounty,itm,posicao_mesa_final,field_size,lucro
```

Site reconhece: `PokerStars`, `Stars`, `PS`, `GGPoker`, `GG`, `partypoker`, `Party`, `888poker`, `888`, `WPT Global`, `WPT`.

Booleanos: `true`/`false`/`1`/`0`/`sim`/`não`.

Datas: ISO (`2026-04-15`) ou parseable por `Date`.

## Filosofia de design

- **Decisão > registro**: cada tela responde a uma pergunta acionável.
- **Sample size é first-class**: não confiamos em números com n<30. UI sempre mostra confidence pill.
- **Branded types** travam unidades no compilador: você não consegue passar BuyIns onde USD é esperado, mesmo que ambos sejam `number` em runtime.
- **Zod nas bordas**, tipos puros no miolo. Validação só onde é necessária (CSV, forms).
- **Local-first**: sem cloud, sem auth, sem custo. Migração para Postgres é uma troca de string de conexão.

## Limitações conhecidas

- CSV drag-and-drop não implementado (só file picker)
- Não há editor de torneio (só criar/excluir)
- Posição só registrável quando chegou na FT (refletindo o schema do usuário)
- Sem multi-currency (USD only)
