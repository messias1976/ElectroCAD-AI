# ElectroCAD-AI v1.14 — Painel, 3D e impressão

## Correções
- Dashboard consulta `/auth/profile` antes de decidir entre visão ADMIN e assinante, evitando mostrar dados do painel do cliente para administradores com sessão local desatualizada.
- Contagem regressiva do teste gratuito atualizada automaticamente a cada minuto no painel ADMIN.
- Editor de ambientes com rótulos, exemplos e explicações de cada campo.
- Impressão global esconde sidebar, header, navegação e controles de formulário.
- Planta 3D passou a carregar o projeto real pelo `projectId`, mostrar ambientes e pontos elétricos e permitir rotação por arraste, zoom, inclinação, seleção de ambientes e ligar/desligar pontos.
