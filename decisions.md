# AFK — Decisions Log

Este documento registra cada decisão tomada autonomamente durante a execução AFK,
com o trade-off considerado. Revise para discordar pontualmente.

---

## Decisões de produto (definidas no grill)

- **Use case v1**: pós-sessão / estratégico (sem live data). Cortado: pré-sessão live e híbrido — exigiriam scraping de lobbies, instável e contra ToS.
- **Schema de tournament**: data, site, buy-in, re-entries, add-ons, turbo, bounty, itm, posição (só FT), field size (opcional), lucro. Reflete o que o usuário já registra.
- **Modalidades**: MTT + flags turbo/bounty. Sem hyper/sat/spin.
- **Bankroll**: USD, auto-computado de transações, perfil moderado por padrão.
- **Decisões em escopo**: D1 (ranking), D2 (daily target), D3 (alerts), D4 (sample size), D5 (trend 30d). D6 (downswing detection) ficou de fora.
- **Stack**: Next.js 15 + tRPC + Prisma + SQLite + Tailwind + Vitest.
- **Tela primária**: Visão Geral com KPIs + gráficos (escolha do usuário).
- **Visual**: Lobbyze-style — dark + denso + data-first.
- **Seed**: mock data realista (~620 torneios em 18 meses).

---

## Decisões técnicas autônomas (durante AFK)

### Arquitetura

- **Não usei shadcn/ui CLI** — inline minimalist primitives (button, card, input via Tailwind). Razão: setup do CLI exige flow interativo, e nossas necessidades são suficientemente simples. Trade-off: menos componentes prontos, mais HTML/Tailwind à mão.
- **Não usei NextAuth ou auth alguma** — é local-first, single-user. Trade-off: se for hospedado, vai precisar auth.
- **`force-dynamic` não aplicado**: todas as queries do dashboard rodam no client via tRPC + TanStack Query. Páginas são `"use client"`. Trade-off: SSR seria mais rápido no first paint mas exigiria contexto de DB no server component.
- **Prisma client singleton via `globalThis`** — padrão Prisma para dev hot-reload (evita criar múltiplas conexões).

### Schema do Prisma

- **Sem migrations** — usando `prisma db push` (single-user local não precisa de versionamento de migration). Trade-off: se for crescer/share, migrar pra migrations explícitas.
- **`site` como `String` no DB, enum no TS** — SQLite não tem enum nativo. Mantemos enum no lado TS via `POKER_SITES` const-as-tuple.
- **Sem foreign keys** — só Tournament, Transaction, Settings, sem joins necessários para v1.
- **`finalTablePosition Int?`** — null se não chegou na FT. Match com o que o usuário já registra.

### Branded types

- Implementados com `unique symbol` brand pattern (Matt Pocock-style). Trade-off: vs Zod's `.brand()` — escolhi o symbol-based porque é zero-cost no runtime e mais comum no estilo dele.
- Aplicados em: `USD`, `BuyIns`, `ROI`, `Probability`, `Count`. Faltam casos onde poderia ser usado (e.g., field size é só `number`); só aplicado onde a confusão entre unidades seria real risco.

### Algoritmos do core

- **Wilson Score** para CI de proporções (ITM, etc.) — mais estável que normal approximation em samples pequenos ou p próximo de 0/1.
- **Normal approximation** para CI de ROI — ROI é unbounded, Wilson não se aplica.
- **Shrinkage k=30** no ranking — a `n` = 30 a confiança é metade da observação. Decisão: balancear sensibilidade vs sample size. Trade-off: k=10 dá mais peso a samples pequenos; k=100 trata tudo abaixo de 100 como ruído.
- **Sample-size buckets**: low <30, moderate <100, good <500, high ≥500. Convenção próxima à literatura de stats; ajustável em `src/core/sample-size.ts`.
- **`tournamentROI` para freerolls retorna 0** ao invés de Infinity ou erro — mais útil para agregação.
- **`aggregateROI` é pesada por custo, não média de ROIs** — invariante a tamanho de buy-in, evita que um freeroll com $50 de lucro distorça o ROI total.

### Multiplicadores de bankroll

Tabela em `src/core/buy-in-target.ts` — números são heurísticas de comunidade MTT/PKO:

|  | Cons. | Mod. | Aggr. |
|---|---|---|---|
| MTT regular | 200 | 150 | 100 |
| MTT turbo | 150 | 120 | 80 |
| PKO regular | 175 | 130 | 90 |
| PKO turbo | 130 | 100 | 70 |

Trade-off: hyper-turbo precisaria de outros (40-50 BIs), mas usuário não joga hyper.
Sweet spot é 0.5x–1x do max, arbitrário mas comum.

### Seed mock

- **Distribuição de profit calibrada via exponencial** com mean = (1 + baselineROI) / cashRate, onde cashRate = 22% (taxa ITM realista). Garante que o ROI empírico do mock match a baseline pretendida.
- **Baselines por (site, turbo, bounty)** — GG PKO regular é o "sweet spot" com +22% (sugere edge do jogador), party em geral negativo. Pode ser editado em `prisma/seed.ts`.
- **620 torneios em 18 meses** — sample suficiente pra que rankings tenham `n` em 30-100 para combinações principais, dando confidence pills variando entre "moderate" e "good".

### tRPC

- **`publicProcedure` para tudo** — single-user local não precisa de auth. Trade-off: se publicar, virtualmente todos os endpoints precisariam de proteção.
- **`superjson` transformer** — para serializar `Date` (Prisma retorna `Date`, JSON não tem). Padrão tRPC.
- **Router por entidade** (tournaments, bankroll, decisions, importer, settings) — divisão clara de responsabilidades.
- **Não usei tRPC server-side calls em Server Components** — manteve tudo client-side com TanStack Query para hidratação fácil e cache compartilhado.

### UI

- **"Visão Geral" como home** (escolha do usuário) — KPIs + gráficos + top rankings + alerts.
- **"Lobbyze-style" interpretado como dark + denso + data-first** — apesar do Lobbyze real ser light mode, o usuário pediu dark e denso. Cores: preto/cinza com accent dourado (#d4a437) que ecoa pyramid/gold do Lobbyze.
- **Recharts ao invés de Visx/D3** — menos código, suficiente para os 3 gráficos do dashboard. Trade-off: customização limitada.
- **Sem tema light** — usuário pediu dark, então só dark. Toggle pode vir depois.
- **Tabular numbers** em CSS — números alinham bonito em tabelas. Decisão de polish.
- **Pills de confidence** com cores semânticas — vermelho para low, dourado para moderate, azul para good, verde para high.

### Importação CSV

- **PapaParse no client** — parsing acontece no browser, só rows validados sobem pro server. Trade-off: arquivos enormes (>10MB) podem travar a aba.
- **Preview antes do commit** — usuário confirma quantos válidos vão entrar. Erros listados com número da linha.
- **Aliases de site** (`gg`, `stars`, `888`, etc.) — flexibilidade no que o usuário cola.
- **Sem drag-and-drop** — só file picker. Falei "em breve" na UI; vai pra v1.1.

### Testes

- **62 tests passando** em 10 arquivos. Coverage focado no `src/core/` (algoritmos puros).
- **Sem testes de UI** — Vitest config exclui componentes. UI seria coberto por Playwright/e2e em v2.
- **Sem testes de tRPC** — handlers são wrappers finos sobre o core e o Prisma. Trade-off: bug em handler passa despercebido até integração manual.

### Hardening (escopo nas bordas)

- **Zod schemas** em todas as entradas externas: tournamentInputSchema, transactionInputSchema, csvRowSchema, riskProfileSchema.
- **Coerção segura** no CSV: strings com vírgula viram número, "sim"/"não"/"1"/"0" viram boolean, datas inválidas dão erro com número da linha.
- **Limites de input**: bulkCreate max 5000, preview max 5000, take max 1000.
- **Sem error boundaries explícitas** — Next.js default catches. Trade-off: se a query do tRPC quebrar, a UI mostra erro técnico ao invés de fallback bonito.

---

## Skills aplicadas durante o AFK

| Skill | Status | Como foi usada |
|---|---|---|
| **grill-me** | ✅ Invocada | Sessão de 13 perguntas estruturadas pra resolver árvore de decisões |
| **firecrawl-scrape** (via WebFetch) | ✅ Aplicada | Lobbyze pesquisado, achados salvos em `research/lobbyze.md` |
| **tdd** | ✅ Princípios aplicados | Tests escritos junto com impl no core; 62/62 passando |
| **harden** | ✅ Princípios aplicados | Zod nas bordas, branded types, limites em tudo |
| **polish** | ✅ Princípios aplicados | Tabular nums, alinhamento, confidence pills, espaçamento consistente |
| **audit** | ✅ Princípios aplicados | TS estrito, sem `any`, build limpo |
| **setup-matt-pocock-skills** | ❌ Não existe | Skill não encontrada na lista; princípios aplicados manualmente (branded types, `satisfies`, Zod, tRPC end-to-end) |
| **impeccable** | ⏭️ Não invocada | Skill não invocada explicitamente (custo de contexto) — design feito com referência Lobbyze + Tailwind |

---

## O que NÃO foi feito (próximos passos sugeridos)

1. **Conectar dados reais**: importe sua planilha via /importar.
2. **Validar baseline ROI**: depois do import real, conferir se decisões fazem sentido (GG PKO realmente é seu melhor jogo?).
3. **D6 (downswing detection)**: requer modelo de EV. Precisa de field size em todos os registros + cálculo de Sklansky bucks.
4. **Pre-session live**: scraping de lobbies (caso queira competir com Lobbyze nessa frente).
5. **Multi-currency**: BRL ↔ USD para sites BR.
6. **Mobile responsive**: layout funciona em mobile mas não é otimizado.
7. **Export**: dump pra CSV/Excel pra contabilidade.
8. **Backup automático**: SQLite vai num arquivo só, snapshots periódicos seriam saudáveis.

---

## Comandos para validar tudo

```bash
npm test            # 62 tests, esperado 62 passed
npm run typecheck   # zero erros
npm run build       # 8 rotas geradas
npm run dev         # localhost:3000 — confira /,  /decisoes, /sessoes, /importar, /configuracoes
```
