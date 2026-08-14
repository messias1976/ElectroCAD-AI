# ElectroCAD-AI v1.16

## Planta 2D
- ambientes podem ser movidos e organizados lado a lado;
- criação de novos ambientes;
- portas e janelas podem ser inseridas nas bordas dos ambientes;
- portas/janelas são persistidas no projeto;
- pontos cadastrados permanecem como fonte de verdade;
- pontos podem ser reposicionados sem perder potência, tensão ou vínculo;
- posições e aberturas são sincronizadas em `projectData` e `plantData`.

## Planta 3D
- todos os pontos são mesclados a partir de projeto + planta + dimensionamento, evitando desaparecimento;
- coordenadas 2D absolutas são convertidas para coordenadas relativas dentro do ambiente;
- ambientes são visualizados como volumes com paredes;
- portas e janelas aparecem nas respectivas paredes;
- modo Corte de visão facilita visualizar o interior;
- controles de rotação e zoom permanecem disponíveis.
