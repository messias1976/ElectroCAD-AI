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

Para motores, a corrente nominal considera tensão, número de fases, rendimento e fator de potência.

### Proteção e condutor

A seleção é preliminar e usa valores padronizados de disjuntores. Para iluminação, o algoritmo considera 10 A como piso de seleção; para TUG, considera 16 A como piso de seleção, evitando resultados incoerentes como um circuito de tomadas protegido por 6 A apenas porque a corrente calculada é baixa. Para TUE e motores, o valor é calculado a partir da corrente de projeto e dos dados disponíveis.

A seção mínima de referência é 1,5 mm² para iluminação e 2,5 mm² para TUG/TUE. A capacidade de condução corrigida deve atender à corrente de projeto e à proteção selecionada.

A base atual de referência usa cobre/PVC 70 °C, método B1, 30 °C e dois condutores carregados. Os fatores de temperatura e agrupamento podem ser informados explicitamente.

### Queda de tensão

Para circuitos monofásicos, a rotina usa estimativa de ida e volta:

`ΔV = 2 × L × I × R`

Para circuitos trifásicos, utiliza a forma correspondente com `√3`.

O limite configurável padrão é 4% para circuitos terminais. A resistência utilizada é uma referência de pré-dimensionamento e deve ser substituída/confirmada conforme seção, temperatura de operação, material e condições reais.

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

## DR, DPS, aterramento e segurança

O resultado pode exigir DR de alta sensibilidade, com sensibilidade configurável. A aplicação real deve verificar os circuitos abrangidos, seletividade e esquema de aterramento.

A lista preliminar também reserva um conjunto de DPS Classe II, mas a especificação definitiva depende do sistema de alimentação, esquema de ligação e análise do projeto.

## Materiais

O sistema **não atribui preço aos materiais**. O preço não é calculado porque varia por loja, marca, região e fornecedor. O ElectroCAD retorna apenas:

- item;
- especificação técnica;
- quantidade estimada;
- unidade;
- base do cálculo.

A lista inclui, conforme os dados disponíveis, pontos, disjuntores dos circuitos, disjuntor geral, DR, DPS, condutores de fase/neutro/PE, eletroduto, quadro de distribuição, barramentos e identificação dos circuitos.

Comprimentos de condutores e eletrodutos recebem reserva de 10% apenas como estimativa de rota/corte e devem ser conferidos com a planta executiva.

## Orçamento de serviço

O orçamento comercial do sistema é exclusivamente de **mão de obra/serviço técnico**. Não inclui preço de materiais, compra em loja, execução física, ART/RRT ou taxas.

A composição pode considerar complexidade por ambiente, pontos, circuitos, planta e dimensionamento. O valor é uma sugestão comercial e deve ser ajustado pelo profissional conforme escopo, região e responsabilidade assumida.

## Saída obrigatória

Para cada circuito, o sistema deve apresentar:

1. **Diagnóstico** — `✅ OK` ou `⚠️ Revisar`.
2. **Cálculos/Justificativas** — potência, corrente, proteção, seção/Iz e queda de tensão.
3. **Alertas** — dados ausentes, limites excedidos e verificações pendentes.
4. **Próximos passos** — informações necessárias para evoluir para projeto executivo.

## Referência normativa

A implementação utiliza ABNT NBR 5410:2004 como referência técnica de pré-dimensionamento. A ABNT mantém capacitação específica para instalações elétricas de baixa tensão baseada na NBR 5410; a versão normativa aplicável deve ser conferida antes de qualquer projeto executivo. citeturn0search0

## Limitações atuais

Ainda não estão completos: banco integral de tabelas e fatores de correção, curto-circuito, seletividade, impedâncias/reatâncias completas, coordenação de proteção, dimensionamento executivo completo de DPS/DR/barramentos e todos os critérios de projeto executivo.
