# ElectroCAD-AI v1.15

## Planta 2D
- Pontos cadastrados no assistente de criação do projeto são carregados na planta.
- Se o ponto já possuir posição salva, ela é preservada.
- Pontos sem posição recebem uma posição inicial distribuída dentro do ambiente.
- Pontos podem ser arrastados livremente pela planta.
- Ao arrastar para outro ambiente, o `roomId` é atualizado automaticamente.
- As posições são salvas em `plantData` e sincronizadas de volta para `projectData`.

## Planta 3D
- Cena 3D centralizada horizontal e verticalmente na área de visualização.
- Transformação usa o centro geométrico como origem, evitando que a cena fique presa no canto superior esquerdo.
