# ElectroCAD-AI v1.9 — Projeto integrado e editor 2D limpo

- Projetos passam a persistir `designData` e `plantData` no PostgreSQL/SQLite via Prisma.
- Projetos são vinculados ao usuário autenticado (`userId`) e o backend restringe acesso por proprietário.
- Criação de projeto valida o acesso do usuário ao cliente.
- Planta 2D permite selecionar um projeto no topo, carregar dados salvos e salvar diretamente no projeto.
- Se o projeto tiver dimensionamento salvo e nenhuma planta, a planta é inicializada a partir dos ambientes/pontos do dimensionamento.
- Projetos cadastrados ganham atalhos para Planta e Projetista.
- Projetista Automático carrega e salva o dimensionamento no projeto selecionado.
- Ferramentas da Planta 2D foram movidas para uma barra horizontal acima do desenho.
- Propriedades do ponto selecionado também ficam na barra superior, eliminando a coluna lateral e reduzindo a rolagem.
- Planta 3D continua em aba isolada.
