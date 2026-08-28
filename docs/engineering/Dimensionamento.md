# Dimensionamento elétrico — fluxo do ElectroCAD-AI

## Escopo atual

O ElectroCAD-AI recebe ambientes, pontos, cargas, tensão, fases, rota e critérios de instalação para produzir um **pré-dimensionamento**. A saída não deve ser apresentada como projeto executivo sem validação profissional.

## Fluxo

1. Projeto e cliente.
2. Ambientes e dimensões.
3. Pontos elétricos e quantidades.
4. Agrupamento preliminar em iluminação, TUG e TUE.
5. Cálculo de potência total por circuito.
6. Cálculo de corrente de projeto.
7. Seleção preliminar de disjuntor.
8. Seleção preliminar de seção de condutor e verificação de Iz.
9. Queda de tensão.
10. Alertas e dados faltantes.
11. Lista de materiais sem preços.
12. Orçamento comercial somente de mão de obra/serviço técnico.

## Regra de proteção preliminar

- Iluminação: piso de seleção de 10 A.
- TUG: piso de seleção de 16 A.
- TUE/motores: seleção a partir da corrente de projeto e dados da carga.
- A seção não é escolhida apenas pela corrente: também são considerados tipo de circuito, seção mínima de referência e capacidade de condução corrigida.

## Lista de materiais

O sistema calcula quantidades e especificações, sem consultar preços de lojas. Exemplos de itens: pontos, disjuntores, disjuntor geral, DR, DPS, condutores de fase/neutro/PE, eletroduto, quadro, barramentos e identificação.

As quantidades lineares usam 10% de reserva como estimativa e precisam ser conferidas na planta executiva.

## Orçamento

O valor sugerido representa somente mão de obra/serviço técnico. Materiais não entram no preço porque variam por fornecedor, marca e região.

## Segurança

A aplicação deve sinalizar riscos, dados ausentes, queda de tensão fora do limite, falta de dados de curto-circuito, agrupamento, seletividade, aterramento e outros pontos que impeçam o fechamento executivo.

## Referência

ABNT NBR 5410:2004 é a referência normativa adotada nesta fase. Antes de emitir projeto executivo, deve-se conferir a edição aplicável e validar todas as condições reais da instalação.
