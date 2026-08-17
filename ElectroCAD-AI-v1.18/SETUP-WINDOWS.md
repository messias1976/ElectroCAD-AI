# Setup no Windows

Na raiz do projeto, execute apenas:

```powershell
pnpm run setup
```

O comando cria automaticamente `apps/api/.env` quando ele não existir e então executa:

1. `pnpm install`
2. `prisma generate`
3. `prisma db push`

O `DATABASE_URL` usado pelo SQLite é `file:./dev.db`, relativo ao `apps/api/prisma/schema.prisma`, portanto o banco fica em `apps/api/prisma/dev.db`.

Se você já possui `apps/api/.env`, o setup não sobrescreve o arquivo.

Depois:

```powershell
pnpm run dev:api
```

Em outro terminal:

```powershell
pnpm run dev:web
```
