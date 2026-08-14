# Desenvolvimento local

Este documento descreve como preparar o ambiente de desenvolvimento para o monorepo Electrocad AI.

Pré-requisitos

- Node.js >= 18
- pnpm >= 8 (o `package.json` indica `pnpm@11.1.2` como packageManager)
- PostgreSQL (ou use um container)

Passos rápidos

1. Instale dependências na raiz:

```bash
pnpm install
```

2. Copie o arquivo de exemplo de variáveis de ambiente e preencha os valores:

```bash
cp .env.example .env
# Edite .env com suas credenciais (DB, JWT, Stripe, SMTP, etc.)
```

3. Em terminais separados, inicie API e frontend:

Terminal 1 (API):

```bash
pnpm run dev:api
```

Terminal 2 (Web):

```bash
pnpm run dev:web
```

Observações

- Os comandos acima usam filtros do pnpm para executar os scripts definidos em `apps/api` e `apps/web`.
- Para execução em containers, crie `Dockerfile`s em `apps/api` e `apps/web` e use `docker-compose` ou Kubernetes conforme sua preferência.

Próximos passos recomendados

- Implementar autenticação e autorização (JWT + roles).
- Criar tabelas de assinaturas/pagamentos e integrar com provedor de pagamentos (Asaas no Brasil ou Stripe internacional).
- Adicionar CI básico com GitHub Actions para build e testes.

Configuração adicional para Asaas

1. No arquivo `.env`, defina `ASAAS_API_KEY` e `ASAAS_WEBHOOK_SECRET`.
2. O endpoint de webhook está disponível em `POST /payments/webhook` na API e deve ser configurado no painel Asaas.
3. O serviço inicial implementado no backend apenas registra eventos de webhook — é preciso integrar com a persistência (DB) para liberar acessos após confirmação de pagamento.

