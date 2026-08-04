---
title: "Início Rápido do Construtor de IA"
description: "O Construtor de IA é a capacidade de construção assistida por IA oferecida pelo NocoBase. Use linguagem natural para fazer modelagem de dados, montar interfaces, orquestrar workflows e configurar permissões, seja por configuração no-code ou com a IA escrevendo código."
keywords: "Construtor de IA,AI Builder,NocoBase AI,Agent Skills,construção em linguagem natural,low-code com IA,AI Portal,início rápido"
---

# Início Rápido do Construtor de IA

O Construtor de IA é a capacidade de construção assistida por IA oferecida pelo NocoBase — você descreve a necessidade do negócio em linguagem natural e um AI Agent monta o sistema para você. Ele cobre a cadeia inteira, da modelagem de dados, montagem de interfaces, orquestração de workflows e configuração de permissões até a entrada em produção.

Quando o assunto é **como a interface é construída**, há duas formas:

- **IA + construção com Portal no-code** — A IA monta a sua interface a partir das capacidades de configuração no-code do NocoBase, produzindo configuração armazenada no banco de dados. Serve para CRUD padrão e backoffices internos, e pessoas de negócio conseguem continuar ajustando pela própria interface depois
- **Construção com AI Portal** — O NocoBase fornece a base (dados, autenticação, permissões e mais) enquanto o AI Agent escreve código localmente, com um resultado que você pode comitar direto no Git. Depois de compilar e fazer o deploy, ele fica acessível pelo [AI Portal](./ai-portal/index.md). Serve para interações customizadas, sistemas de negócio complexos e casos com requisitos visuais específicos

De um jeito ou de outro, tabelas, permissões e workflows passam pelo mesmo conjunto de Skills — enquanto o AI Agent escreve as páginas, ele também cria as suas tabelas e configura as permissões pelo caminho, montando um sistema de negócio completo, passo a passo, pela conversa.

## Como escolher entre as duas formas

Cada uma dessas duas formas corresponde a uma entrada de acesso. Uma aplicação NocoBase pode ter várias entradas compartilhando os mesmos dados, e o caminho de acesso indica qual é qual:

```text
/v/<name>    Portal no-code
/x/<name>    AI Portal
```

![two types of portal](https://static-docs.nocobase.com/20260804091849.png)

As diferenças:

| | Portal no-code | AI Portal |
| --- | --- | --- |
| Caminho de acesso | `/v/<name>` | `/x/<name>` |
| De onde vêm as páginas | Configuradas na interface, com a IA podendo ajudar a alterar a configuração | Código React, escrito pelo AI Agent |
| Resultado | Configuração armazenada no banco de dados | Código-fonte que você pode comitar no Git |
| Como você itera | Clicando pela interface, ou pedindo à IA para alterar a configuração | Alterando o código, `dev` → `deploy` |
| Gerenciamento de versões | Snapshots pelo [Controle de Versão](./version-control.md) | Git, ou o source storage do NocoBase |
| Liberdade na interface | Limitada pelas capacidades dos blocos, com padrões definidos de layout e interação | O que você quiser que ela seja |
| Capacidades prontas | Dashboards, calendário, kanban e outros blocos funcionam de imediato | O código do template padrão que oferecemos, ou o que o AI Agent implementar |
| Curva de aprendizado | Exige conhecer blocos, campos e afins do NocoBase | Exige alguma familiaridade em trabalhar com AI Agents |
| Indicado para | CRUD padrão, backoffices internos | Interações customizadas, sistemas de negócio complexos, requisitos visuais específicos |

Um Portal no-code já basta nestes casos:

- A estrutura da página é bem padrão — uma tabela comum mais um formulário, em que configurar é mais rápido do que escrever código
- Pessoas de negócio que não escrevem código precisam ajustar as páginas por conta própria
- Você só quer as capacidades de bloco nativas do NocoBase, como dashboards, visão de calendário e visão kanban
- Você está construindo sozinho, ou não precisa de várias pessoas construindo juntas

Para todo o resto, recomendamos construir com o [AI Portal](./ai-portal/index.md). Na construção com Portal no-code, a IA tem contexto demais para aprender — tipos de bloco, estruturas de configuração, regras de interação — e, para sistemas de negócio que exigem uma construção complexa, eficiência, manutenibilidade e colaboração em equipe ficam todas aquém.

Então adotamos outra abordagem: **escrever código de frontend é o que a IA faz de melhor**, então deixe que ela faça o que faz de melhor. O NocoBase atua como base do núcleo do sistema e o frontend fica por conta da IA. Os mesmos requisitos, mais rápido e melhor. **A IA constrói com liberdade. O NocoBase garante a confiabilidade.**

Os dois modos também podem ser combinados: configure rapidamente o backoffice interno com um Portal no-code e refine o portal voltado ao cliente com um AI Portal — os dois na mesma aplicação, compartilhando um único conjunto de dados e usuários.

## Início rápido

::: warning Atenção
Para experimentar a construção com AI Portal, instale a versão alpha do NocoBase CLI (`npm install -g @nocobase/cli@alpha`).
:::

Se você já instalou o [NocoBase CLI](../ai/quick-start.md), pode pular esta etapa.

### Instalação assistida por IA com um clique

Copie o prompt abaixo para o seu assistente de IA (Claude Code, Codex, Cursor, Trae etc.) e ele fará a instalação e a configuração automaticamente:

```
Me ajude a instalar o NocoBase CLI e fazer a inicialização: https://docs.nocobase.com/pt/ai/ai-quick-start.md (acesse o conteúdo do link diretamente)
```

### Instalação manual

```bash
npm install -g @nocobase/cli@alpha
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

### Construa um marco e a IA salva uma versão restaurável para você

Depois de concluir uma página, um conjunto de tabelas de dados ou um fluxo de trabalho, deixe a IA salvar o estado atual como versão — se uma configuração der errado, você sempre pode voltar ao último marco claro.

```
Salve a construção atual como versão: página de gerenciamento de clientes, área de filtros e formulário de edição concluídos
```

![A IA cria uma versão após a criação](https://static-docs.nocobase.com/20260611115804.png)

A IA não salva uma versão a cada alteração de campo; ela só salva após concluir e verificar um marco claro, o que mantém a lista de versões legível e facilita decidir para onde voltar.

Para saber mais sobre o controle de versão, consulte [Controle de Versão](./version-control).

### Orquestre workflows automatizados com uma frase

Descreva a condição de disparo e a lógica de processamento e a IA cria o trigger e a cadeia de nós automaticamente.

```
Crie um workflow que reduz automaticamente o estoque do produto após a criação de um pedido.
```

![Workflow de redução de estoque após pedido](https://static-docs.nocobase.com/20260419234303.png)

Para saber mais sobre workflows, consulte [Gerenciamento de Workflow](./workflow).

### Descreva a página em linguagem de negócio e a IA monta para você

O NocoBase oferece por padrão um **AI Portal** e um **Portal no-code**. Você não precisa aprender regras de configuração. Diga apenas que tipo de página quer — caixa de pesquisa, tabela, filtros — e ela aparece.

![portal manage](https://static-docs.nocobase.com/20260804104517.png)

Para construir por um Portal no-code (o Portal padrão se chama admin):

```
Crie no admin uma página de gerenciamento de clientes com uma caixa de pesquisa por nome e uma tabela de clientes mostrando nome, telefone, e-mail e data de criação.
```

![Página de gerenciamento de clientes](https://static-docs.nocobase.com/20260420100608.png)

Para construir por um AI Portal (o Portal padrão se chama main):

```
Crie no main portal uma página de gerenciamento de clientes com uma caixa de pesquisa e uma tabela de clientes mostrando nome, telefone e setor.
```

![portal page](https://static-docs.nocobase.com/20260803204422.png)

Para saber mais sobre configuração de interface, consulte [Configuração de Interface](./ui-builder) ou [Construção com AI Portal](./ai-portal/index.md).

## Segurança e auditoria

Antes de deixar um AI Agent operar o NocoBase, recomendamos que você entenda primeiro os métodos de autenticação, o controle de permissões e a auditoria de operações — para garantir que a IA faça apenas o que deve e que cada passo fique registrado. Consulte [Segurança e Auditoria](./security).

## NocoBase Skills

[NocoBase Skills](https://github.com/nocobase/skills) são pacotes de conhecimento de domínio que podem ser instalados em AI Agents, permitindo que a IA entenda o sistema de configuração do NocoBase. O NocoBase oferece vários Skills, cobrindo todo o fluxo de construção:

- [Gerenciamento de Ambiente](./env-bootstrap) — Verificação de ambiente, instalação, atualização e diagnóstico de falhas
- [Modelagem de Dados](./data-modeling) — Criar e gerenciar tabelas, campos e relacionamentos
- [Configuração de Interface](./ui-builder) — Criar e editar páginas, blocos, popups e interações
- [Gerenciamento de Workflow](./workflow) — Criar, editar, ativar e diagnosticar workflows
- [Configuração de Permissões](./acl) — Gerenciar papéis, políticas de permissão, vínculo de usuários e avaliação de risco
- [Soluções](./dsl-reconciler) — Construir sistemas de negócio completos em lote a partir de YAML
- [Gerenciamento de Plugins](./plugin-manage) — Visualizar, ativar e desativar plugins
- [Gerenciamento de Publicação](./publish) — Publicação entre ambientes, backup, restauração e migração
- [Controle de Versão](./version-control) — Salvar versões restauráveis após marcos concluídos
- [Construção com AI Portal](https://github.com/nocobase/skills/blob/main/skills/nocobase-ai-builder/SKILL.md) - Deixe o AI Agent escrever código em um AI Portal para montar as interfaces do sistema

:::tip Dica

Durante a inicialização (`nb init`), o NocoBase CLI instala automaticamente os Skills — você não precisa instalar manualmente.

:::

## Links relacionados

- [AI Portal](./ai-portal/index.md) — A outra forma de construir, com o AI Agent escrevendo o código de frontend diretamente
- [NocoBase CLI](../ai/quick-start.md) — Ferramenta de linha de comando para instalar e gerenciar o NocoBase
- [Referência do NocoBase CLI](../api/cli/index.md) — Descrição completa de todos os parâmetros dos comandos
- [Plugin de Desenvolvimento com IA](../ai-dev/index.md) — Desenvolva plugins do NocoBase com auxílio de IA
- [Segurança e Auditoria](./security) — Métodos de autenticação, controle de permissões e auditoria
- [AI Employees](../ai-employees/index.md) — Capacidades de agente do NocoBase, com colaboração e execução de ações na interface de negócio
