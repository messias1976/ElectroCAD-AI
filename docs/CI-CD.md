# CI/CD — ElectroCAD-AI

## CI

O workflow `.github/workflows/ci.yml` executa:

1. instalação com `pnpm install --frozen-lockfile`;
2. validação do Prisma;
3. geração do Prisma Client;
4. testes da API;
5. build da API;
6. build do Web;
7. build das imagens Docker.

## CD com Render

Há duas formas suportadas:

### Opção A — recomendada

Configurar o serviço do Render com GitHub e **Auto-Deploy: After CI Checks Pass**. Assim, o Render aguarda o resultado do GitHub Actions antes de publicar.

### Opção B — Deploy Hook

Criar no GitHub Actions o segredo:

`RENDER_DEPLOY_HOOK_URL`

O workflow já possui um job que dispara o hook somente depois que validação e build Docker terminam com sucesso.

## Variáveis do CI

O pipeline usa valores locais de teste para:

- `DATABASE_URL`;
- `DIRECT_URL`;
- `JWT_SECRET`;
- `AI_ENCRYPTION_KEY`.

Esses valores são exclusivos do CI e não devem ser usados em produção.

## Produção

As variáveis reais devem permanecer no Render, nunca no Git. Em especial:

- `DATABASE_URL`;
- `DIRECT_URL`;
- `JWT_SECRET`;
- `AI_ENCRYPTION_KEY`;
- credenciais Asaas;
- configuração OpenAI, quando usada por variável de ambiente.

## Checklist de deploy

- [ ] GitHub Actions verde.
- [ ] API build verde.
- [ ] Web build verde.
- [ ] Docker build verde.
- [ ] Variáveis do Render configuradas.
- [ ] Banco de produção acessível.
- [ ] Prisma sincronizado/migrações revisadas.
- [ ] Asaas configurado no ambiente correto.
- [ ] OpenAI configurada no backend, se IA estiver habilitada.
- [ ] Smoke test de login, dashboard, projeto, dimensionamento, Professor IA e assinatura.
