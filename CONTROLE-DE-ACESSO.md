# ElectroCAD-AI v1.6 — Multi-tenant e perfis

## Perfis

### ADMIN — Administrador do SaaS
- Dashboard administrativo
- Planos e assinaturas
- Métricas SaaS
- Configurações da IA/OpenAI
- Visualização administrativa dos clientes
- Demais ferramentas do produto

### SUBSCRIBER — Assinante
- Dashboard próprio
- Seus clientes
- Seus projetos
- Planta elétrica
- Projetista
- Professor ElectroCAD
- Não vê nem acessa configurações da IA
- Não vê nem altera planos/assinaturas do SaaS
- Não vê métricas administrativas

## Isolamento de dados

Cada cliente cadastrado por um assinante recebe `ownerId` do usuário autenticado. A API filtra a lista e impede que um assinante consulte, altere ou exclua clientes de outro assinante.

## Novo cadastro

`/auth/register` sempre cria o usuário como `SUBSCRIBER`. Nunca aceite `role` vindo do formulário público.

## Transformar uma conta em administrador

Na raiz do projeto, depois de configurar o banco:

```powershell
pnpm run make:admin -- seu_usuario
```

Isso promove somente o usuário informado para `ADMIN`.

## Preparação do projeto

```powershell
pnpm run setup
```

O setup instala dependências, gera o Prisma Client e sincroniza o schema com o SQLite.

## Segurança

A restrição existe em dois níveis:
1. Frontend: menus e rotas administrativas ficam ocultos/bloqueados para assinantes.
2. Backend: endpoints administrativos usam JWT + `AdminGuard`, portanto acessar a URL manualmente não libera o recurso.

A chave OpenAI do SaaS deve ficar no backend (`OPENAI_API_KEY`). O assinante usa o Professor sem receber acesso à configuração da infraestrutura de IA.
