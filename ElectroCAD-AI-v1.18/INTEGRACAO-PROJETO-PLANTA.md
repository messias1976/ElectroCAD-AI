# Integração Projeto ↔ Planta ↔ Projetista

Fluxo recomendado:

1. Cadastre um cliente em **Clientes**.
2. Crie um projeto em **Projetos** e vincule o cliente.
3. Abra **Planta** pelo botão do projeto ou selecione o projeto no topo da planta.
4. Edite os pontos na Planta 2D. O editor salva `plantData` no próprio projeto.
5. Use **Enviar ao projetista**. O Projetista abre o mesmo `projectId`.
6. O dimensionamento pode ser salvo no mesmo projeto em `designData`.
7. Ao voltar para a Planta, o sistema prioriza `plantData`; se não houver planta salva, usa `designData` para inicializar ambientes e pontos.

O backend protege projetos por `userId`, evitando que assinantes acessem projetos de outros assinantes.
