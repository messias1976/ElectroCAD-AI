# ElectroCAD-AI v1.7 — SaaS + Planta

## SaaS
- Dashboard ADMIN agora lista todos os assinantes (exceto ADMIN).
- Exibe plano, status, dias restantes do teste gratuito e data de término.
- Contadores: total, ativos, em teste e aguardando assinatura.
- Quando o teste termina, o assinante é redirecionado para `/assinar`.
- O ADMIN recebe um botão para enviar a mensagem de assinatura por e-mail ao assinante.
- Novos cadastros começam com 14 dias de teste.
- `trialStartedAt` e `trialDays` passaram a ser armazenados no usuário.
- O comando `pnpm run setup` prepara dependências + Prisma + banco.
- `pnpm run make:admin -- email@dominio.com` promove uma conta existente para ADMIN.

## Planta
- A tela inicial ficou limpa.
- A criação/edição da planta foi movida para a aba **Editor da planta**.
- A aba **Visão geral** mostra apenas resumo, carga, pontos, ambientes e alertas.

## Segurança de acesso
- Áreas do assinante são bloqueadas após o fim do teste, salvo assinatura ativa.
- Configuração de IA continua exclusiva do ADMIN.
- O assinante não recebe acesso ao painel administrativo.
