# Roadmap — ElectroCAD-AI

Atualizado em 28/08/2026.

## 1. Produto / MVP

### Implementado
- Autenticação por JWT e rotas protegidas.
- Login/cadastro e restauração dos acessos de perfil e dimensionamento.
- Dashboard do assinante com plano atual e período de teste.
- Perfil do assinante com dados cadastrais e cancelamento de assinatura.
- Clientes e projetos com CRUD real via NestJS/Prisma.
- Projetista/planta 2D e impressão do projeto em múltiplas páginas.
- Persistência dos dados do projeto no backend.
- Página de dimensionamento e orçamento.
- Lista preliminar de materiais por quantidade e especificação, sem preços.
- Orçamento comercial separado, somente para mão de obra/serviço técnico.

### Em evolução
- Editor de engenharia unificado para ambientes, cargas, circuitos e pontos.
- Quadro de cargas e diagrama unifilar integrados ao motor de cálculo.
- Memorial integrado ao resultado do motor de cálculo e ao PDF final.
- Persistência robusta das posições da planta 2D após edição e recarregamento.

## 2. Motor elétrico / ABNT NBR 5410

### Implementado para pré-dimensionamento
- Cálculo de potência por circuito.
- Corrente de projeto para cargas comuns.
- Corrente nominal de motores monofásicos e trifásicos com eficiência/fator de potência.
- Fator de serviço do motor quando informado.
- Seleção preliminar de disjuntor por valores padronizados.
- Piso de seleção de 10 A para iluminação e 16 A para TUG, evitando proteções incoerentes por corrente muito baixa.
- Seleção preliminar de seção de condutor e verificação de Iz.
- Fatores de temperatura e agrupamento como entradas explícitas.
- Queda de tensão em regime.
- Estimativa de corrente de partida e queda de tensão de partida de motores.
- Alertas para motores acima de 3,7 kW (5 CV), partida e dados críticos ausentes.
- DR de alta sensibilidade como requisito configurável.
- Lista de materiais com quantidades e especificações, sem preços.
- Orçamento comercial separado: somente mão de obra/serviço técnico.

### Ainda necessário para chamar de “motor NBR 5410 completo”
- Aplicar todas as tabelas de capacidade de condução conforme método real, número de condutores carregados e condições de instalação.
- Banco completo de fatores de correção de temperatura/agrupamento.
- Cálculo completo de impedância/reatância e curto-circuito.
- Coordenação/seletividade entre proteções.
- Dimensionamento completo de PE, neutro, barramentos, DPS e DR.
- Regras específicas para motores, partida, proteção de sobrecarga e curto-circuito com dados reais do fabricante.
- Validação normativa e testes de engenharia antes de considerar o resultado como projeto executivo.

**Status: ⚠️ motor funcional para pré-dimensionamento; ainda não é um motor executivo completo.**

## 3. IA / Professor ElectroCAD

### Implementado
- Professor IA conectado ao projeto salvo no servidor.
- Configuração administrativa da OpenAI com chave protegida no backend.
- Chat técnico com diagnóstico, cálculos/justificativas, alertas e próximos passos.
- Endpoint de geração estruturada de projeto (`POST /ai/generate-project`).
- Fluxo de geração estruturada de rascunho com ambientes, circuitos, pontos, critérios, motores e dados faltantes.

### Próxima evolução
- Aplicar a geração da IA diretamente ao modelo do projeto sem perder dados manuais.
- Revisar automaticamente o resultado contra o motor elétrico antes de apresentar o projeto.
- Gerar projeto completo em modo assistido, sempre mantendo a indicação de pré-dimensionamento e validação profissional.

**Status: ⚠️ IA gera estrutura/rascunho; projeto executivo automático ainda não.**

## 4. SaaS / Assinaturas / Asaas

### Implementado
- Planos e assinaturas.
- Checkout com nome, e-mail e CPF/CNPJ.
- Integração Asaas em sandbox/homologação.
- Tratamento de cliente Asaas excluído com recriação.
- Cancelamento de assinatura pelo perfil.
- Exibição do plano atual e período de teste.

### Ainda necessário
- Validar todo o ciclo de webhook em produção.
- Confirmar idempotência de eventos e reconciliação de pagamentos.
- Configurar definitivamente as variáveis de produção no Render.

## 5. Orçamento e materiais

Regra do produto:
- **Não calcular preço de material.** O preço depende da loja, marca, região e fornecedor.
- O ElectroCAD calcula **quantidades, unidades e especificações técnicas** dos materiais.
- O orçamento do serviço calcula **somente mão de obra/serviço técnico**, sem material, compra em loja, execução física, ART/RRT ou taxas.

## 6. CI/CD

### Estrutura existente
- GitHub Actions para validação da aplicação.
- Validação do Prisma.
- Geração do Prisma Client.
- Testes da API.
- Build da API.
- Build do Web.
- Build das imagens Docker da API e Web.
- Job de deploy Render preparado por `RENDER_DEPLOY_HOOK_URL`.

### Configuração final externa
- Se o Render estiver com Auto-Deploy / After CI Checks Pass, não é necessário deploy hook.
- Caso seja usado deploy hook, criar o segredo `RENDER_DEPLOY_HOOK_URL` no GitHub.

**Status: ⚠️ estrutura de CI/CD existe; precisa validação final do pipeline e deploy.**

## 7. Documentação

### Atualizada nesta etapa
- `ROADMAP.md` — estado real do produto.
- `docs/ENGINEERING-CALCULATIONS.md` — regras do motor, materiais e orçamento.
- `docs/engineering/Dimensionamento.md` — fluxo de dimensionamento.

### Manter sincronizados
- `docs/AI-PROJECT-GENERATION.md` — contrato da geração estruturada pela IA.
- `docs/CI-CD.md` — pipeline e configuração do Render.
- `docs/RELEASE-CHECKLIST.md` — checklist antes de publicar.
