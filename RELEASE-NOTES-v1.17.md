# ElectroCAD-AI v1.17 — Motor de Planta

- Pontos recebem `sourceId` estável e são mesclados sem substituição destrutiva.
- Salvar a planta atualiza posições/ambientes dos pontos, sem remover pontos existentes do projeto.
- Portas e janelas podem trocar entre as quatro paredes durante o arraste.
- A largura de portas/janelas é recalculada com limites da parede e pode ser ajustada pelo manipulador.
- Planta 3D foi reestruturada para derivar a geometria diretamente de ambientes, aberturas e pontos salvos.
- Não inclui `.env`, `node_modules` ou banco local.
