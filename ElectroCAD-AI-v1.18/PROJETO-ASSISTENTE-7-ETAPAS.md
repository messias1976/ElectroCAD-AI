# ElectroCAD-AI — cadastro profissional de projeto

O Novo Projeto agora é um assistente em 7 etapas:
1. Identificação
2. Fornecimento
3. Ambientes
4. Pontos e cargas
5. Critérios
6. Proteções
7. Revisão

O registro `Project.projectData` é a fonte inicial de verdade. Planta 2D e Projetista têm fallback para esse registro e, depois que os módulos salvam, `plantData`/`designData` passam a complementar o projeto.

O Professor IA deve ser aberto com `?projectId=...` para usar o projeto salvo no backend como contexto canônico.
