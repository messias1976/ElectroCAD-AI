# Geração automática de projeto pela IA

## Endpoint

`POST /ai/generate-project`

O endpoint exige autenticação JWT e usa a configuração de IA protegida no backend.

## Entrada

```json
{
  "prompt": "Descreva o projeto desejado",
  "projectId": "opcional",
  "model": "opcional"
}
```

Quando `projectId` é informado, o backend valida a propriedade do projeto antes de usar os dados salvos como contexto.

## Saída

A IA retorna um rascunho JSON com:

- identificação do projeto;
- fornecimento elétrico;
- critérios de instalação;
- ambientes;
- circuitos;
- pontos e potências;
- motores, quando aplicável;
- materiais por quantidade/especificação;
- orçamento marcado como somente mão de obra;
- diagnóstico;
- alertas;
- dados faltantes;
- próximos passos.

## Regras obrigatórias

1. Não inventar dados críticos.
2. Usar `null` quando uma entrada necessária não estiver disponível.
3. Listar dados faltantes.
4. Não calcular preço de material.
5. Não tratar o resultado como projeto executivo.
6. Para motores, solicitar dados reais do fabricante quando necessários.
7. Encaminhar o resultado para o motor de dimensionamento antes de considerar os números finais.

## Interface

O Professor ElectroCAD possui o botão **Gerar projeto completo**. O texto digitado pelo usuário é usado como solicitação; se o campo estiver vazio, a IA usa o projeto atual como contexto.

O resultado aparece como rascunho estruturado para revisão. A próxima evolução é adicionar a ação explícita **Aplicar ao projeto**, com confirmação do usuário, para evitar sobrescrita acidental.
