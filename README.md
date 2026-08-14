# Electrocad AI

Electrocad AI é uma plataforma SaaS (Software como Serviço) direcionada a eletricistas e empresas de serviços elétricos. O objetivo é digitalizar, automatizar e otimizar todo o fluxo de trabalho técnico e comercial — desde orçamentos e projetos até execução, manutenção e gestão do relacionamento com clientes — com suporte de ferramentas de engenharia assistida por inteligência artificial.

## Descrição do projeto

A plataforma oferece um conjunto integrado de funcionalidades para profissionais do setor elétrico: geração e dimensionamento de projetos, cálculo de cargas, criação de esquemas unifilares, orçamentos automatizados, gestão de ordens de serviço, registro de medições em campo e um painel administrativo para acompanhar performance, custos e faturamento. Componentes de IA ajudam a acelerar tarefas repetitivas (ex.: sugerir bitolas, disjuntores e proteções, gerar listas de materiais, documentar projetos) e a reduzir erros humanos.

## Problema que resolvemos

- Processos manuais e planilhas dispersas causam retrabalho e erros de cálculo.
- Orçamentos lentos reduzem taxa de conversão de clientes.
- Falta de um histórico técnico centralizado dificulta manutenção e conformidade.

Electrocad AI unifica dados técnicos, comerciais e históricos, fornecendo ferramentas que aumentam produtividade, qualidade técnica e previsibilidade financeira.

## Principais funcionalidades

- Editor de projetos elétricos com geração de diagrama unifilar.
- Cálculos automáticos: dimensionamento de condutores, proteção, equilíbrio de carga e demanda.
- Geração de lista de materiais (BOM) e estimativa de custos.
- Orçamentos personalizáveis e envio de propostas por e-mail/PDF.
- Gestão de clientes e ordens de serviço (OS) com histórico e anexos.
- Checklists e assistência de inspeção para segurança e conformidade.
- Integração com sensores/IoT (opcional) para leituras remotas.
- Painel de indicadores (KPIs) e relatórios financeiros.
- Multiusuário, permissões por função e controle de versão de projetos.

## Público-alvo

- Eletricistas autônomos que precisam otimizar orçamentos e execução.
- Pequenas e médias empresas de instalações elétricas.
- Consultores e projetistas elétricos que desejam acelerar entregas.

## Benefícios

- Redução do tempo de elaboração de projetos e orçamentos.
- Menos erros de dimensionamento e escolha de materiais.
- Melhor rastreabilidade e histórico técnico para manutenção.
- Aumento da profissionalização e imagem comercial.

## Arquitetura (visão geral)

Plataforma monorepo com backend (API), frontend web e motores de cálculo/IA desacoplados. Projetada para escalabilidade SaaS, multi-tenant e deploy em infraestrutura cloud. O repositório contém apps e pacotes modulares para permitir evolução incremental.

## Tecnologias principais

- Node.js, TypeScript
- Frameworks: NestJS (backend), React + Vite (frontend)
- Monorepo gerenciado por pnpm
- Banco de dados relacional (ex.: PostgreSQL) e caches/filas conforme necessidade
- IA/ML: componentes para sugestões técnicas e automação de documentação

## Como começar (desenvolvimento)

1. Clone o repositório.
2. Instale dependências na raiz com `pnpm install`.
3. Execute o frontend com `pnpm --filter web dev` e o backend com `pnpm --filter api dev`.
4. Consulte os READMEs específicos em `apps/api` e `apps/web` para instruções de execução local e scripts de desenvolvimento.

> Observação: este repositório é um monorepo; cada app possui suas próprias instruções e scripts.

## Contribuição

Contribuições são bem-vindas. Abra issues para bugs e feature requests, e envie pull requests com descrições claras das mudanças. Siga as convenções de commit e o guia de estilo do projeto.

## Progresso atual

- Frontend com telas de login, dashboard, clientes, assinaturas, métricas e obras.
- Backend NestJS com APIs de autenticação, assinaturas, clientes e projetos.
- CRUD real de clientes e projetos usando Prisma.
- Landing page de marketing com planos configuráveis.
- Autenticação básica no frontend usando token local.
- Estrutura de rotas e proteção de páginas já implementada.

## Licença

O projeto está licenciado conforme o arquivo `LICENSE` na raiz do repositório.

## Contato

Para dúvidas e parcerias, abra uma issue no repositório ou entre em contato com os mantenedores listados no repositório.


## Exemplos de telas

Abaixo estão descrições de telas e componentes-chave que a plataforma deverá expor (mockups de alto nível):

- **Dashboard**: visão geral com KPIs (projetos ativos, faturamento mensal, tarefas pendentes, tempo médio de execução). Gráficos de receita, andamento de ordens de serviço e indicadores de qualidade.
- **Projetos**: lista de projetos com filtros (cliente, status, data). Acesso rápido a versão atual do projeto, versão histórica, anexos e comentários.
- **Editor de Projeto (Diagrama Unifilar)**: editor visual para desenhar e editar esquemas unifilares, posicionar cargas, definir circuitos, e aplicar cálculos automáticos. Painel lateral com propriedades do componente e sugestões de IA.
- **Cálculos & Dimensionamento**: tela que exibe cálculos detalhados (cálculo de condutores, proteção, demanda), parâmetros adotados, e recomendações de alterações.
- **Orçamento / Proposta**: construtor de propostas com itens de BOM, serviços, prazos e margem; geração de PDF e envio por e-mail.
- **Ordens de Serviço (OS)**: criação e acompanhamento de OS, checklist de execução, fotos e leituras de campo, assinatura digital do cliente.
- **Clientes**: CRM leve com histórico de chamados, projetos relacionados e documentos.
- **Admin / Configuração**: gerenciamento de usuários, permissões por função, regras de cálculo e parâmetros padrão.

## Fluxo de usuário (exemplo)

1. Eletricista cria um novo projeto a partir do dashboard (ou a partir de um cliente existente).
2. No editor unifilar, o usuário posiciona cargas e elementos; o sistema sugere bitolas, disjuntores e proteções automaticamente com base nas regras técnicas.
3. O usuário revisa os cálculos e ajusta parâmetros (fator de demanda, agrupamento de circuitos, etc.).
4. Gera-se a lista de materiais (BOM) e o orçamento, que pode ser personalizado (adicionar margem, descontos, condições de pagamento).
5. Envia a proposta em PDF por e-mail para o cliente; após aprovação, converte-se a proposta em Ordem de Serviço.
6. Técnicos recebem a OS no app web (ou mobile), registram medições, fotos e assinam o checklist após conclusão.
7. Dados de execução são centralizados para relatórios e manutenção futura.

## Deploy & CI (exemplo de instruções)

Exemplo de fluxo básico de CI/CD usando GitHub Actions e Docker. Ajuste conforme sua infraestrutura (AWS/GCP/Azure, Kubernetes, Vercel, etc.).

- Passos básicos de build e CI:

```yaml
name: CI
on: [push, pull_request]
jobs:
	build:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- name: Setup Node
				uses: actions/setup-node@v4
				with:
					node-version: '20'
			- name: Install dependencies
				run: pnpm install --frozen-lockfile
			- name: Build
				run: pnpm -w build
			- name: Run tests
				run: pnpm -w test
```

- Exemplo simples de Docker build (imagem monolítica ou por serviço):

```bash
docker build -t electrocad-ai/web -f apps/web/Dockerfile .
docker build -t electrocad-ai/api -f apps/api/Dockerfile .
```

- Deploy (exemplo Kubernetes / registry):

```bash
docker push <registry>/electrocad-ai/web:latest
kubectl apply -f k8s/deployments/web.yaml
```

- Notas/boas práticas:
	- Utilize secrets gerenciados para chaves e conexões de banco de dados.
	- Automatize migrations no pipeline (executar `pnpm --filter apps/api run migrate` em etapa controlada).
	- Rode testes de integração em um ambiente isolado (DB em container) antes do deploy em produção.
	- Considere deploy canary / blue-green para atualizações sem downtime.

## Preparação para deploy (o que já fiz)

- Adicionados `Dockerfile` em `apps/api` e `apps/web` para builds otimizados.
- Criado `docker-compose.yml` para execução local com PostgreSQL.
- Workflow GitHub Actions inicial em `.github/workflows/ci.yml` para build, testes e criação de imagens Docker.
- Prisma configurado em `apps/api/prisma/schema.prisma` com modelos `User` e `Subscription`.

## Como rodar localmente com Docker (rápido)

1. Copie `.env.example` para `.env` e ajuste se necessário.
2. Suba os serviços com:

```bash
docker compose up --build
```

3. A API ficará disponível em `http://localhost:3000` e o frontend em `http://localhost:5173`.

Obs: para rodar migrations localmente antes do primeiro `up`, você pode rodar (na raiz):

```bash
pnpm --filter api run prisma:generate
pnpm --filter api run prisma:migrate
```






## Projetista Automático v1.3

Fluxo principal: **Projeto → Ambientes e pontos → Gerar projeto elétrico**.

O módulo `/projetista` agora cria automaticamente circuitos para iluminação, TUG e TUE, quadro de cargas, diagrama unifilar simplificado, memorial resumido e lista preliminar de materiais. O quadro pode ser exportado para CSV e o projeto pode ser impresso em PDF pelo navegador.

> Os resultados de condutor, disjuntor e queda de tensão são pré-dimensionamentos. A validação final deve considerar todos os critérios aplicáveis da ABNT NBR 5410 e a responsabilidade técnica do profissional habilitado.
