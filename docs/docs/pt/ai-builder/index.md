---
title: "Início Rápido do Construtor de IA"
description: "O Construtor de IA é a capacidade de construção assistida por IA do NocoBase. Por meio da linguagem natural, você completa modelagem de dados, configuração de interface, orquestração de workflows e outras operações, oferecendo uma experiência de construção mais moderna e eficiente."
keywords: "Construtor de IA,AI Builder,NocoBase AI,Agent Skills,construção em linguagem natural,low-code com IA,início rápido"
---

# Início Rápido do Construtor de IA

O Construtor de IA é a capacidade de construção assistida por IA oferecida pelo NocoBase — você descreve a necessidade em linguagem natural e a IA completa automaticamente modelagem de dados, configuração de páginas, definição de permissões e outras operações. Trata-se de uma experiência de construção mais moderna e eficiente.

## Início rápido

Se você já instalou o [NocoBase CLI](../ai/quick-start.md), pode pular esta etapa.

### Instalação assistida por IA com um clique

Copie o prompt abaixo para o seu assistente de IA (Claude Code, Codex, Cursor, Trae etc.) e ele fará a instalação e a configuração automaticamente:

```
Me ajude a instalar o NocoBase CLI e fazer a inicialização: https://docs.nocobase.com/cn/ai/ai-quick-start.md (acesse o conteúdo do link diretamente)
```

### Instalação manual

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

O navegador abrirá automaticamente uma página de configuração visual, que vai guiar você na instalação dos NocoBase Skills, na configuração do banco de dados e na inicialização da aplicação. Para passos detalhados, consulte [Início Rápido](../ai/quick-start.md).

## Substitua a configuração manual por uma conversa

Após instalar o NocoBase CLI, você pode operar o NocoBase diretamente no seu assistente de IA usando linguagem natural. Os exemplos abaixo são cenários reais — desde criar uma única tabela até montar um sistema completo. Veja como o Construtor de IA funciona na prática.

### Descreva a necessidade do negócio e a IA projeta tabelas e relacionamentos

Diga à IA o tipo de sistema que você quer e ela cuida automaticamente do desenho das tabelas, dos tipos de campos e das relações — você não precisa desenhar um diagrama ER.

```
Estou montando um CRM. Por favor, projete e construa o modelo de dados.
```

![IA projetando modelo de dados de CRM](https://static-docs.nocobase.com/202604162126729.png)

A IA gera automaticamente as tabelas de clientes, contatos, oportunidades, pedidos e seus relacionamentos:

![Resultado do modelo de dados de CRM](https://static-docs.nocobase.com/202604162201867.png)

Para saber mais sobre modelagem de dados, consulte [Modelagem de Dados](./data-modeling).

### Descreva a página em linguagem de negócio e a IA monta para você

Você não precisa aprender regras de configuração. Diga apenas que tipo de página quer — caixa de pesquisa, tabela, filtros — e ela aparece.

```
Crie uma página de gerenciamento de clientes com uma caixa de pesquisa por nome e uma tabela de clientes mostrando nome, telefone, e-mail e data de criação.
```

![Página de gerenciamento de clientes](https://static-docs.nocobase.com/20260420100608.png)

Para saber mais sobre configuração de interface, consulte [Configuração de Interface](./ui-builder).

### Orquestre workflows automatizados com uma frase

Descreva a condição de disparo e a lógica de processamento e a IA cria o trigger e a cadeia de nós automaticamente.

```
Crie um workflow que reduz automaticamente o estoque do produto após a criação de um pedido.
```

![Workflow de redução de estoque após pedido](https://static-docs.nocobase.com/20260419234303.png)

Para saber mais sobre workflows, consulte [Gerenciamento de Workflow](./workflow).

### Tabelas, páginas e dashboards de uma só vez

:::warning Atenção

A funcionalidade de Soluções ainda está em fase de testes, com estabilidade limitada e destinada apenas a uma experiência inicial.

:::

Descreva o cenário do seu negócio em uma frase e a IA monta tabelas, páginas de gerenciamento, dashboards e gráficos para você.

```
Use o skill nocobase-dsl-reconciler para construir um sistema de gerenciamento de chamados (tickets), incluindo dashboard, lista de chamados, gerenciamento de usuários e configuração de SLA.
```

A IA primeiro apresenta a proposta de design e, após confirmação, executa toda a construção de uma só vez:

![Proposta de design do sistema de chamados](https://static-docs.nocobase.com/20260420100420.png)

![Resultado da construção do sistema de chamados](https://static-docs.nocobase.com/20260420100450.png)

Para saber mais sobre como construir sistemas completos, consulte [Soluções](./dsl-reconciler).

## Segurança e auditoria

Antes de deixar um AI Agent operar o NocoBase, recomendamos que você entenda primeiro os métodos de autenticação, o controle de permissões e a auditoria de operações — para garantir que a IA faça apenas o que deve e que cada passo fique registrado. Consulte [Segurança e Auditoria](./security).

## NocoBase Skills

[NocoBase Skills](https://github.com/nocobase/skills) são pacotes de conhecimento de domínio que podem ser instalados em AI Agents, permitindo que a IA entenda o sistema de configuração do NocoBase. O NocoBase oferece 8 Skills, cobrindo todo o fluxo de construção:

- [Gerenciamento de Ambiente](./env-bootstrap) — Verificação de ambiente, instalação, atualização e diagnóstico de falhas
- [Modelagem de Dados](./data-modeling) — Criar e gerenciar tabelas, campos e relacionamentos
- [Configuração de Interface](./ui-builder) — Criar e editar páginas, blocos, popups e interações
- [Gerenciamento de Workflow](./workflow) — Criar, editar, ativar e diagnosticar workflows
- [Configuração de Permissões](./acl) — Gerenciar papéis, políticas de permissão, vínculo de usuários e avaliação de risco
- [Soluções](./dsl-reconciler) — Construir sistemas de negócio completos em lote a partir de YAML
- [Gerenciamento de Plugins](./plugin-manage) — Visualizar, ativar e desativar plugins
- [Gerenciamento de Publicação](./publish) — Publicação entre ambientes, backup, restauração e migração

:::tip Dica

Durante a inicialização (`nb init`), o NocoBase CLI instala automaticamente os Skills — você não precisa instalar manualmente.

:::

## Links relacionados

- [NocoBase CLI](../ai/quick-start.md) — Ferramenta de linha de comando para instalar e gerenciar o NocoBase
- [Referência do NocoBase CLI](../api/cli/index.md) — Descrição completa de todos os parâmetros dos comandos
- [Plugin de Desenvolvimento com IA](../ai-dev/index.md) — Desenvolva plugins do NocoBase com auxílio de IA
- [Segurança e Auditoria](./security) — Métodos de autenticação, controle de permissões e auditoria
- [AI Employees](../ai-employees/index.md) — Capacidades de agente do NocoBase, com colaboração e execução de ações na interface de negócio
