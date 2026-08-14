# ElectroCAD-AI v1.13.1

## Correção
- Adicionado `Project.projectData` ao schema Prisma para alinhar o banco com `ProjectsService` e os DTOs.
- `pnpm run setup` continua executando `prisma generate` e `prisma db push`, criando/sincronizando a coluna automaticamente.

## Como atualizar
Na raiz do projeto:

```powershell
pnpm run setup
```

Depois inicie API e web normalmente.
