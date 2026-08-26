# Tutorial Introdutório do NocoBase 2.0

Este tutorial vai te guiar do zero, usando o NocoBase 2.0 para construir um **sistema mínimo de tickets de TI (HelpDesk)**. O sistema inteiro precisa de apenas **2 tabelas de dados**, sem escrever uma única linha de código, e implementa envio de tickets, gerenciamento de categorias, rastreamento de mudanças, controle de permissões e dashboard de dados.

## Sobre o Tutorial

- **Público-alvo**: pessoas de negócios, técnicas ou qualquer pessoa interessada em NocoBase (recomenda-se algum conhecimento básico de computação)
- **Projeto de exemplo**: sistema mínimo de tickets de TI (HelpDesk), apenas 2 tabelas
- **Tempo estimado**: 2-3 horas (não técnicos), 1-1,5 horas (técnicos)
- **Pré-requisitos**: ambiente Docker ou [Demo Online](https://demo-cn.nocobase.com/new) (válido por 24 horas, sem instalação)
- **Versão**: NocoBase 2.0

## O Que Você Vai Aprender

Através de 7 capítulos práticos, você vai dominar os conceitos centrais e o fluxo de construção do NocoBase:

| # | Capítulo | Pontos-chave |
|---|------|------|
| 1 | [Conhecendo o NocoBase — Em 5 minutos no ar](./01-getting-started) | Instalação Docker, modo de configuração vs modo de uso |
| 2 | [Modelagem de Dados — Construindo o esqueleto do sistema de tickets](./02-data-modeling) | Collection/Field, relacionamentos |
| 3 | [Construindo Páginas — Tornando os dados visíveis](./03-building-pages) | Block, bloco de tabela, filtragem e ordenação |
| 4 | [Formulários e Detalhes — Permitindo que os dados sejam preenchidos](./04-forms-and-details) | Bloco de formulário, regras de campo, histórico de registros |
| 5 | [Usuários e Permissões — Quem pode ver o quê](./05-roles-and-permissions) | Funções, permissões de menu, permissões de dados |
| 6 | [Workflows — Fazendo o sistema agir sozinho](./06-workflows) | Notificações automáticas, gatilhos de mudança de status |
| 7 | [Dashboard — Visão completa em um piscar de olhos](./07-dashboard) | Gráfico de pizza/linha/barra, bloco Markdown |

## Visão Geral do Modelo de Dados

Este tutorial gira em torno de um modelo de dados mínimo — apenas **2 tabelas**, mas suficientes para cobrir as funcionalidades centrais como modelagem de dados, construção de páginas, design de formulários, controle de permissões, workflows e dashboard.

| Tabela | Campos principais |
|--------|---------|
| Tickets (tickets) | Título, descrição, status, prioridade |
| Categorias (categories) | Nome da categoria, cor |

## Perguntas Frequentes

### Para quais cenários o NocoBase é adequado?

Adequado para ferramentas internas corporativas, sistemas de gerenciamento de dados, processos de aprovação, CRM, ERP e outros cenários que precisam de personalização flexível, com suporte a deploy privado.

### Quais conhecimentos são necessários para concluir este tutorial?

Não é necessário programar, mas é recomendável ter algum conhecimento básico de computação. O tutorial explica gradualmente conceitos como tabelas de dados, campos e relacionamentos. Ter experiência com bancos de dados ou Excel facilita o aprendizado.

### O sistema do tutorial pode ser expandido?

Sim. Este tutorial usa apenas 2 tabelas, mas o NocoBase suporta relacionamentos complexos entre múltiplas tabelas, integração de API externa, plugins personalizados e mais.

### Qual ambiente de deploy é necessário?

Recomenda-se Docker (Docker Desktop ou servidor Linux), no mínimo 2 cores e 4GB de memória. Também há suporte a execução via código-fonte Git. Se você só quer experimentar, pode solicitar o [Demo Online](https://demo-cn.nocobase.com/new) — sem instalação, válido por 24 horas.

### Quais limitações tem a versão gratuita?

As funcionalidades centrais são totalmente gratuitas e open source. A versão comercial oferece plugins avançados adicionais e suporte técnico, veja mais em [Preços da Versão Comercial](https://www.nocobase.com/cn/commercial).

## Stack Tecnológica Relacionada

O NocoBase 2.0 é construído sobre as seguintes tecnologias:

- **Framework Frontend**: React + [Ant Design](https://ant.design/) 5.0
- **Backend**: Node.js + Koa
- **Banco de Dados**: PostgreSQL (também suporta [MySQL](/get-started/installation/docker), MariaDB)
- **Métodos de Deploy**: [Docker](/get-started/installation/docker), Kubernetes

## Plataformas Similares para Referência

Se você está avaliando plataformas no-code/low-code, aqui vão algumas comparações:

| Plataforma | Características | Diferença em relação ao NocoBase |
|------|------|-------------------|
| [Appsmith](https://www.appsmith.com/) | No-code open source, forte personalização frontend | NocoBase foca mais em modelagem de dados |
| [Retool](https://retool.com/) | Plataforma de ferramentas internas | NocoBase é totalmente open source, sem limites de uso |
| [Airtable](https://airtable.com/) | Banco de dados colaborativo online | NocoBase suporta deploy privado, com autonomia de dados |
| [Budibase](https://budibase.com/) | Low-code open source, com self-hosting | Arquitetura plugável do NocoBase oferece maior extensibilidade |

## Documentação Relacionada

### Guia de Introdução
- [Como o NocoBase Funciona](/get-started/how-nocobase-works) — Introdução aos conceitos centrais
- [Início Rápido](/get-started/quickstart) — Instalação e configuração inicial
- [Requisitos do Sistema](/get-started/system-requirements) — Requisitos de ambiente

### Mais Tutoriais
- [Tutorial NocoBase 1.x](/tutorials/v1/index.md) — Tutorial avançado usando um sistema de gerenciamento de tarefas

### Referências de Soluções
- [Solução de Sistema de Tickets](/solution/ticket-system/index.md) — Solução inteligente de gerenciamento de tickets com IA
- [Solução de CRM](/solution/crm/index.md) — Base para gerenciamento de relacionamento com clientes
- [Funcionários de IA](/ai-employees/quick-start) — Adicionando capacidades de IA ao sistema

Pronto? Vamos começar pelo [Capítulo 1: Conhecendo o NocoBase](./01-getting-started)!
