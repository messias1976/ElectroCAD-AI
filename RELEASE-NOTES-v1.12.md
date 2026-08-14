# ElectroCAD-AI v1.12 — Projeto como fonte única de verdade

## Integrações
- Projeto passa a ser o centro dos dados.
- Planta 2D salva `plantData` e também sincroniza uma representação `designData` para o Projetista.
- Projetista lê primeiro a planta salva quando existir.
- Projetista salva simultaneamente dimensionamento e planta no mesmo projeto.
- Professor IA recebe `projectId` e o backend carrega o projeto autorizado diretamente do banco.
- Dashboard do assinante exibe clientes, projetos, plantas e dimensionamentos reais.
- Clientes mostram quantidade de projetos vinculados.

## Segurança
- O Professor não depende de dados antigos do `localStorage` para o contexto do projeto.
- O backend valida se o assinante é proprietário do projeto antes de enviá-lo à IA.
