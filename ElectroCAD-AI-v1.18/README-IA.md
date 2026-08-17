# Professor ElectroCAD + OpenAI

## Configuração rápida

1. Entre em `apps/api` e copie `.env.example` para `.env`.
2. Opcionalmente coloque `OPENAI_API_KEY=...` no `.env` do backend. Nunca publique essa chave.
3. Inicie a API: `pnpm run dev:api`.
4. Inicie a web: `pnpm run dev:web`.
5. Acesse **Configurações IA** no menu.
6. Informe sua chave e clique em **Testar conexão**.
7. Abra **Professor IA** e use **Analisar projeto**.

A chave digitada na interface é mantida somente em `sessionStorage` e enviada ao backend apenas quando uma operação de IA é solicitada. Para produção, prefira `OPENAI_API_KEY` no servidor e não peça a chave de cada usuário.

## Endpoints

- `POST /ai/test` — testa o modelo configurado.
- `POST /ai/chat` — envia uma pergunta e, opcionalmente, o contexto do projeto.

## Segurança

- Não coloque a chave em `VITE_OPENAI_API_KEY`.
- Não faça commit de `.env`.
- Restrinja o acesso ao backend e use HTTPS em produção.
- O Professor é um assistente de pré-dimensionamento; suas respostas não substituem projeto e responsabilidade técnica.
