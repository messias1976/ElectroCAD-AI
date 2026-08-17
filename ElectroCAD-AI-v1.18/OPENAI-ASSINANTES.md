# OpenAI centralizada para assinantes

A partir desta versão, a chave da OpenAI não fica mais somente no `sessionStorage` do administrador.

- O ADMIN configura a chave em **Configurações IA**.
- A chave é criptografada antes de ser salva em `AiSettings` no SQLite.
- Assinantes consultam apenas o status (`configured`, modelo e origem), nunca a chave.
- O endpoint `/ai/chat` usa a configuração central do backend.
- `OPENAI_API_KEY` continua como fallback para produção/servidor.
- O ADMIN pode testar a chave digitada, salvar no servidor e remover a configuração.

Depois de atualizar, execute `pnpm run setup` e reinicie a API e o frontend.
