# Regras de engenharia — ElectroCAD-AI

## Objetivo

O motor atual é de **pré-dimensionamento** de instalações elétricas de baixa tensão. Ele não substitui projeto executivo nem responsabilidade técnica.

## Entradas principais

- Sistema de tensão e fases.
- Tipo de circuito.
- Pontos, quantidade e potência unitária.
- Tensão do circuito.
- Comprimento de rota.
- Fator de potência.
- Método de instalação e isolação.
- Fatores de correção de temperatura e agrupamento.
- Disjuntor e condutor propostos, quando existentes.
- Para motores: potência, tensão, número de fases, rendimento, fator de potência, fator de serviço e corrente de partida quando disponível.

## Cálculos

### Cargas comuns

`P_total = Σ(qtd × potência_unitária)`

`Ib = P_total / (V × fp)`

Para o pré-dimensionamento, o motor usa a fórmula monofásica ou trifásica com rendimento e fator de potência.

### Proteção e condutor

O motor atual seleciona preliminarmente o menor disjuntor padronizado que atenda à corrente de projeto e seleciona seção cuja capacidade de condução corrigida atenda à proteção e à corrente calculada.

A base atual de referência usa cobre/PVC 70 °C, método B1, 30 °C e dois condutores carregados. Os fatores de temperatura e agrupamento podem ser informados explicitamente.

### Queda de tensão

Para circuitos monofásicos, a rotina usa uma estimativa de ida e volta. Para circuitos trifásicos, usa a forma correspondente com `√3`.

O limite configurável padrão é 4% para circuitos terminais.

### Motores

O motor calcula:

- corrente nominal estimada;
- corrente de projeto com fator de serviço, quando aplicável;
- corrente de partida estimada;
- queda de tensão em regime;
- estimativa de queda na partida;
- alerta quando a queda de partida ultrapassa 10%;
- alerta para motores acima de 3,7 kW (5 CV).

A análise de partida ainda precisa de impedância real da instalação, dados do fabricante e método de partida para projeto executivo.

## DR, aterramento e segurança

O resultado pode exigir DR de alta sensibilidade, com sensibilidade configurável. A aplicação real deve verificar os circuitos abrangidos, seletividade e esquema de aterramento.

## Materiais

O sistema **não atribui preço aos materiais**. Ele retorna apenas:

- item;
- especificação;
- quantidade estimada;
- unidade;
- base do cálculo.

Comprimentos de condutores e eletrodutos recebem reserva de 10% apenas como estimativa de rota/corte e devem ser conferidos com a planta executiva.

## Orçamento

O orçamento comercial do sistema é exclusivamente de **mão de obra/serviço técnico**. Não inclui material, compra em loja, execução, ART/RRT ou taxas.

## Referência normativa

A implementação utiliza ABNT NBR 5410:2004 como referência. Entre os pontos consultados estão a Tabela 36 para capacidade de condução e as regras de queda de tensão e motores. Antes de qualquer projeto executivo, deve ser verificada a edição normativa aplicável e as condições reais da instalação.

## Limitações atuais

Ainda não estão completos: banco integral de tabelas e fatores de correção, curto-circuito, seletividade, impedâncias/reatâncias completas, coordenação de proteção, DPS, barramentos e todos os critérios de projeto executivo.
