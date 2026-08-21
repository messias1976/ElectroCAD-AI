# Status da versão entregue

## Corrigido
- `apps/api/src/subscriptions/plans.service.ts`: corrigida a inferência de `saved` como `never` e separados os campos enviados ao Prisma.
- Planos padrão não prometem Automação, que ainda não existe no produto.
- `apps/web/src/pages/Dashboard/DashboardPage.tsx`: gestão individual de assinantes com botão Gerenciar, atualização do assinante selecionado após ações, trial, plano, status e exclusão.
- `apps/web/src/pages/LandingPage.tsx`: landing simples, branca, responsiva e sincronizada com `/plans`.

## Validação
Não foi possível executar `pnpm install --frozen-lockfile` neste ambiente porque o registry npm estava indisponível (erro DNS `EAI_AGAIN registry.npmjs.org`). Por isso os builds não puderam ser executados aqui.

Execute localmente após extrair:

```powershell
pnpm install --frozen-lockfile
pnpm --filter api exec prisma generate
pnpm --filter api run build
pnpm --filter api run test -- --runInBand
pnpm --filter web run build
```
