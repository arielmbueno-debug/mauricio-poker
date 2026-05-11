# Manual para o Mauricio

> **Para o agente lendo isso:** este arquivo é o ponto de entrada. O Mauricio é um amigo do dono do repo — ele construiu a primeira versão da ferramenta e agora vai baixar este projeto para continuar evoluindo. Ele não necessariamente conhece toda a stack de cor (Next 15, tRPC 11, Prisma, branded types). Leia este manual em voz alta para ele, explique cada passo, espere ele confirmar que rodou antes de seguir, e adapte o nível de detalhe ao que ele perguntar. Se ele pedir para "só fazer", siga em frente — mas avise quando algo for destrutivo (`db:reset`, `db:push --force-reset`).

---

## O que é este projeto

**Poker Decisions** — dashboard de decisão (não de registro) para grinder de MTT online. Você joga, importa um CSV ou cadastra manualmente, e a ferramenta responde:

- **Qual combinação (site × modalidade × tier) é mais lucrativa ajustada a risco?** (D1)
- **Qual buy-in jogar hoje considerando a banca atual e o perfil de risco?** (D2)
- **Tem algum alerta de gestão de banca?** (D3 — exposição, downswing, volume, growth)
- **Os números têm sample size suficiente?** (D4 — Wilson CI, shrinkage k=30)
- **Tendência de ROI 30d vs lifetime.** (D5)

Decisões fora de escopo no v1 estão listadas em `README.md` — não tente implementar a v2 antes de o Mauricio pedir.

## Stack (resumo de bolso)

| camada | tecnologia | onde mexer |
|---|---|---|
| UI | Next.js 15 App Router + React 19 + Tailwind 3 | `src/app/`, `src/components/` |
| API | tRPC 11 + Zod | `src/server/routers/` |
| Domínio | TypeScript puro + branded types (USD, BuyIns, ROI) | `src/core/` |
| DB | Prisma 6 + SQLite local | `prisma/schema.prisma` |
| Testes | Vitest (só `src/core/**`) | `*.test.ts` ao lado do código |

Path alias: `@/*` → `./src/*`. Sempre prefira `@/core/...` a caminho relativo.

---

## Setup na máquina do Mauricio (passo a passo)

### Pré-requisitos

1. **Node.js 20+** instalado (verificar com `node -v`)
2. **Git** instalado (verificar com `git --version`)
3. Um editor — VS Code é o padrão

### Comandos para rodar

```bash
git clone https://github.com/arielmbueno-debug/mauricio-poker.git
cd mauricio-poker
npm install
npm run db:generate    # gera o client do Prisma
npm run db:push        # cria o arquivo SQLite + tabelas
npm run db:seed        # popula com 620 torneios mock + 3 transações
npm run dev            # sobe em http://localhost:3000
```

Atalho que roda tudo de uma vez: `npm run setup`.

> **Aviso para o agente:** se o Mauricio acabou de clonar e for rodar `npm run build` antes do `dev`, **avise para não fazer isso**. Em projeto Next.js novo durante iteração isso polui `.next/` e o dev server quebra com erro "undefined.call". Use `npm run typecheck` para validar tipos sem buildar.

### Verificação rápida de que está tudo ok

```bash
npm run typecheck   # deve passar sem erros
npm test            # roda os testes do core
```

Se ambos passam e `http://localhost:3000` abre o dashboard, está pronto.

---

## Onde encostar (mapa por intenção)

### "Quero mudar a fórmula de ROI / risco / ranking"
→ `src/core/`. Tudo lá é função pura, sem IO. Edite o arquivo, atualize o `.test.ts` vizinho, rode `npm run test:watch`.

### "Quero adicionar uma coluna no banco"
1. Editar `prisma/schema.prisma`
2. `npm run db:push` (re-aplica schema; preserva dados na maioria dos casos)
3. Se for breaking, `npm run db:reset` — **destrói os dados, confirme com o usuário primeiro**.

### "Quero adicionar um endpoint na API"
→ `src/server/routers/`. Um router por domínio. Use Zod no `.input(...)`. **Não bote lógica de negócio aqui** — chame uma função pura de `src/core/`.

### "Quero adicionar uma página ou componente"
→ `src/app/` (rota) e `src/components/` (UI reutilizável). Use Server Components por padrão; só vire `"use client"` se precisar de estado/efeito.

### "Quero importar mais dados"
→ Tela `/importar`. Schema do CSV está em `README.md` na seção "Schema do CSV de importação".

---

## Regras de ouro (não quebrar)

1. **`src/core/` é puro.** Sem Prisma, sem `fetch`, sem `process.env`. Recebe dados tipados, devolve dados tipados.
2. **Lógica de negócio mora em `core/`, não em routers.** Router só faz IO + validação.
3. **Branded types existem por um motivo.** Se o compilador reclamar que `USD` não é `BuyIns`, **não cast com `as`** — converta de fato usando a função correta.
4. **Sample size é first-class.** Qualquer UI nova que mostre ROI ou taxa precisa também mostrar a confidence pill (`src/core/sample-size.ts`).
5. **Zod só nas bordas** (CSV, form, tRPC input). Dentro de `core/`, confie nos tipos.
6. **Modalidade é decomposta** (`{ base, isTurbo, isBounty }`). Não recrie um enum flat tipo `"MTT_TURBO_BOUNTY"`.
7. **Bankroll é calculado**, não armazenado — `sum(deposits) − sum(withdrawals) + sum(profits)` em `src/core/bankroll.ts`.

## O que NÃO fazer no v1

- Auth / multiusuário (é local-first de propósito)
- Multi-currency (USD only)
- Integração ao vivo com lobby de site de poker (Lobbyze já faz; nossa diferenciação é decisão, não registro)
- Detecção de downswing por modelo de EV (D6) — precisaria de `field_size` em 100% dos registros, e não temos

Estão listadas em `README.md > Fora de escopo no v1`. Se o Mauricio quiser fazer uma dessas, ótimo — mas avise que é v2 e provavelmente exige refator de schema.

---

## Comandos do dia a dia (cola)

```bash
npm run dev                  # dev server
npm test                     # roda testes do core
npm run test:watch           # TDD
npm test -- src/core/roi     # roda um arquivo só
npm test -- -t "ROI agreg"   # roda por nome do teste
npm run typecheck            # tsc --noEmit (strict)
npm run lint                 # next lint
npm run db:push              # aplica schema
npm run db:seed              # re-popula mock
npm run db:reset             # destrói + recria + popula (CUIDADO)
```

---

## Como usar o agente daqui pra frente

Mauricio, quando você abrir o Claude Code dentro desta pasta:

1. **Comece dizendo o que quer fazer em uma frase.** Ex: "Quero adicionar um campo de notas em cada torneio" ou "O ranking está mostrando combinação com n=5, queria esconder se n<20".
2. **O agente vai ler `CLAUDE.md` automaticamente** — é onde estão as regras de arquitetura. Não precisa repetir.
3. **Se ele propuser algo que mexa em muitos arquivos, peça um plano antes** ("me mostra o plano primeiro"). Aprove o plano antes de deixar editar.
4. **Antes de aceitar uma mudança em `src/core/`**, peça para ele rodar `npm test` daquele arquivo. Core sem teste verde não entra.
5. **Quando ele terminar uma feature visual**, peça para abrir `http://localhost:3000` e confirmar que funciona — type check passar não significa que a UI está certa.
6. **Se algo quebrar misteriosamente após `npm run build`**, apague `.next/` e rode `npm run dev` de novo. É um problema conhecido em iteração rápida.

Boa sorte. Qualquer dúvida estrutural está em `README.md` (escopo de produto) e `CLAUDE.md` (regras de arquitetura). `decisions.md` tem o histórico das decisões D1–D5 com mais detalhe.
