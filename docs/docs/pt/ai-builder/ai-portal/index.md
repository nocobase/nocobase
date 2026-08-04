---
title: "Início rápido do AI Portal"
description: "A construção com AI Portal consiste em deixar um AI Agent escrever o código do seu sistema de negócio, com o NocoBase fornecendo autenticação, banco de dados, API e permissões como base. O código fica em uma entrada de aplicação chamada AI Portal."
keywords: "construção com AI Portal,Construtor de IA,AI Portal,NocoBase AI,base do NocoBase,desenvolvimento frontend,React,shadcn/ui,AI Agent,início rápido"
---

# Início rápido do AI Portal

Percebemos que o vibe coding com IA até consegue produzir uma página bonita, mas tem dificuldade para se conectar a um sistema de negócio real — ou acaba reimplementando do zero a autenticação, as permissões e o desenho das tabelas.

O NocoBase, como plataforma low-code/no-code, já oferece tudo isso. Você pode tratá-lo como a base do núcleo do seu sistema, deixando o AI Agent focado na lógica de negócio enquanto o NocoBase fornece uma infraestrutura confiável de autenticação, banco de dados, API e permissões.

Para isso oferecemos uma entrada de aplicação chamada **AI Portal**. O código-fonte dela fica local e é reservado para o AI Agent escrever. O código escrito nessa entrada acessa diretamente as capacidades nativas do NocoBase, e as páginas construídas ficam prontas para acesso.

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

## O que o NocoBase oferece

Quando você constrói um sistema de negócio, o tempo normalmente não vai para as páginas, e sim para tudo o que está por trás delas — login de usuário, verificação de permissões, desenho das tabelas, APIs de CRUD, upload e download de arquivos. Todo sistema precisa disso, e refazer tudo do zero a cada vez não compensa.

O NocoBase já oferece tudo isso:

- **Autenticação** — Login com usuário e senha funciona de imediato. OIDC, SAML, CAS, LDAP, SMS, DingTalk, WeCom e outros funcionam depois de habilitados no servidor, e o frontend só precisa se conectar a eles
- **Banco de dados e múltiplas fontes de dados** — Gerenciamento de tabelas integrado, além de conexões com fontes de dados externas como MySQL e PostgreSQL
- **REST API** — Assim que existe uma tabela, os endpoints de CRUD vêm junto, com suporte a filtro, ordenação, paginação e campos de relacionamento
- **Controle de acesso** — ACL baseada em papéis, até o nível de campo e de registro. O frontend pode ler as permissões do usuário atual e decidir o que exibir
- **Workflow** — Automação de processos de negócio, disparada pelo frontend ou por alterações nos dados
- **Armazenamento de arquivos** — Upload e download

![AI Portal Template](https://static-docs.nocobase.com/20260803161414.png)

Sobre essas capacidades construímos um [template de sistema](https://github.com/nocobase/portal-template-default) padrão que o AI Agent pode copiar para colocar uma aplicação funcional no ar. O NocoBase também oferece um conjunto de Skills como [Modelagem de Dados](../data-modeling.md) e [Configuração de Permissões](../acl.md), de modo que, depois que você descreve a necessidade do negócio, o AI Agent não só gera as páginas de frontend como também cria as tabelas e configura as permissões, entregando um sistema de negócio completo.

## Pré-requisitos

- NocoBase >= 3.0.0-alpha.6
- Node.js >= 22
- [pnpm](https://pnpm.io/installation) — o template de Portal usa ele para instalar dependências e iniciar o servidor de desenvolvimento
- A versão alpha do `nocobase cli` (**atenção: por enquanto só a versão alpha é suportada**)
  - `npm install -g @nocobase/cli@alpha`
  - Além de uma aplicação NocoBase já inicializada via `nb init --ui`. Consulte o [Guia de integração para AI Agent](../../ai/quick-start.md)
- Um AI Agent, como Claude Code, Codex ou Cursor

## Passo 1: confirme que você já tem um AI Portal

Confirme primeiro que o `main` padrão está lá:

```bash
nb portal list
```

![nb portal list](https://static-docs.nocobase.com/20260803163517.png)

A saída lista o nome do Portal, a URL de acesso, o tipo de Portal, o source storage, o caminho de desenvolvimento, o status de ativação e o status de padrão.

Depois de baixar o código-fonte, o `info` mostra mais detalhes, como para onde apontam o caminho de desenvolvimento e o caminho de deploy:

```bash
nb portal info main
```

## Passo 2: inicie o modo de desenvolvimento

```bash
# Baixar o código-fonte do portal
nb portal pull main
# Iniciar o servidor de desenvolvimento
nb portal dev main
```

O servidor de desenvolvimento roda por padrão em `http://localhost:5173`.

O template já vem com uma página de gerenciamento de usuários construída sobre a tabela `users` do NocoBase. Faça login e dê uma olhada — ela também é um bom exemplo inicial para a IA seguir.

![portal dev home page](https://static-docs.nocobase.com/20260802220652.png)

## Passo 3: peça à IA para mudar uma página

Entre no workspace de desenvolvimento do Portal (o `pull` deixa em `./main` por padrão; se não tiver certeza, consulte o caminho de desenvolvimento com `nb portal info main`), abra ali o seu AI Agent — Claude Code, Codex, Cursor, o que você preferir — e passe um prompt:

```
Adicione uma página de gerenciamento de clientes
com uma lista de clientes, busca por nome e uma gaveta de detalhes que abre ao clicar em uma linha
```

<!-- 需要一个视频，展示从输入提示词到 AI 完成页面编写、开发服务热更新出效果的完整过程 -->

A IA lê as páginas e extensões existentes, escreve a nova página seguindo as convenções do template, e você vê o resultado em `http://localhost:5173`.

Para aprender a trabalhar de forma eficaz com um AI Agent, consulte [Construção com AI Agent](./agent-workflow.md).

## Passo 4: faça o deploy

Quando as alterações locais estiverem boas, envie o código-fonte para o remoto e depois compile e faça o deploy:

```bash
nb portal push main --message "Add customer management page"
nb portal deploy main
```

Para onde o `push` envia depende da configuração de source storage deste Portal. O padrão é `nocobase`, com o código-fonte gerenciado pelo NocoBase. Se você mudar para `git` com [`nb portal config`](../../api/cli/portal/config.md), o `push` faz commit e envia o código-fonte para o repositório Git que você indicou, e o `--message` passa a ser a mensagem do commit do Git. Veja [Deploy e gerenciamento de código-fonte](./deploy.md#source-storage) para mais detalhes.

Depois do deploy, acesse `/x/main/` para ver as suas alterações.

Com isso o ciclo completo está fechado — você descreve o que precisa, a IA escreve o código, você confere localmente e então envia e faz o deploy.

## Quando você precisar de mais entradas

Uma aplicação pode ter vários Portals. A equipe interna usa um, os clientes externos usam outro — as páginas e permissões ficam totalmente separadas, enquanto os dados são compartilhados:

```bash
nb portal create customer
```

A criação gera `./customer` no diretório atual como workspace de desenvolvimento, ou você pode apontar para outro lugar com `--path`. Um Portal novo é desenvolvido com `nb portal dev` e implantado com `nb portal deploy` igual ao primeiro — entre no workspace dele e abra o seu AI Agent. Veja [Deploy e gerenciamento de código-fonte](./deploy.md) para mais detalhes.

## Experimente a demo

Se você quiser ver a construção com AI Portal em ação, solicite um ambiente de demonstração em https://demo.nocobase.com/new . Depois de preencher o formulário, geramos um ambiente de demonstração dedicado para você, contendo várias aplicações de AI Portal construídas sobre a base do NocoBase.

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

Depois escolha um AI Portal e entre:

![AI Portal CRM](https://static-docs.nocobase.com/20260803154700.png)

A página de boas-vindas do Portal também traz um prompt que permite ao seu AI Agent se conectar diretamente a essa aplicação de AI Portal, baixar o código da aplicação, iniciar um servidor de desenvolvimento local, alterar páginas e depois enviar e fazer o deploy de volta no ambiente de demonstração. Atualize a página após um deploy bem-sucedido e você verá o resultado.

## Próximos passos

- [Construção com AI Agent](./agent-workflow.md) — Como escrever prompts e como reverter quando a IA erra
- [Estrutura do projeto e stack técnica](./project-structure.md) — As convenções de diretórios do template e os comandos mais usados
- [Deploy e gerenciamento de código-fonte](./deploy.md) — Colocar o código-fonte do Portal sob Git e o deploy em múltiplos ambientes

## Links relacionados

- [Construção com AI Agent](./agent-workflow.md) — Conduza a IA em linguagem natural para escrever as páginas do Portal
- [Estrutura do projeto e stack técnica](./project-structure.md) — As convenções de diretórios do template e os comandos mais usados
- [Componentes padrão e extensões](./components.md) — A base de componentes shadcn/ui e o mecanismo de extensão
- [Deploy e gerenciamento de código-fonte](./deploy.md) — O fluxo completo de desenvolvimento, envio e deploy
- [Guia de integração para AI Agent](../../ai/quick-start.md) — Instale o NocoBase CLI e conclua a inicialização
- [Início Rápido do Construtor de IA](../index.md) — A outra forma de construir, sem escrever código
- [Controle de Versão](../version-control.md) — Snapshots de versão para a construção no-code
- [Referência do comando `nb portal`](../../api/cli/portal/index.md) — Descrição completa dos parâmetros de todos os comandos de Portal
