---
title: "Claude Code + NocoBase: o cérebro de IA mais poderoso, seu arquiteto-chefe NocoBase"
description: "Integre o Claude Code, assistente oficial de programação com IA da Anthropic, ao NocoBase, e use linguagem natural para operar o seu sistema de negócio através de Skills e do CLI."
keywords: "Claude Code,NocoBase,AI Agent,Anthropic,Skills,CLI,linguagem natural"
sidebar: false
---

:::warning Conteúdo em elaboração

O conteúdo desta página ainda está sendo escrito; algumas seções podem estar incompletas ou sofrer alterações.

:::

# Claude Code + NocoBase: o cérebro de IA mais poderoso, seu arquiteto-chefe NocoBase

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) é o assistente oficial de programação com IA lançado pela Anthropic — roda diretamente no terminal, entende toda a sua base de código e ajuda em tarefas que vão desde a codificação até a construção de sistemas. Ao integrá-lo ao NocoBase, você pode usar linguagem natural para criar tabelas de dados, montar páginas e configurar workflows, aproveitando a experiência de construção potencializada por um dos modelos de IA mais poderosos disponíveis.

<!-- Necessário um screenshot do Claude Code operando o NocoBase no terminal -->

## O que é o Claude Code

Claude Code é um AI Agent em formato CLI lançado pela Anthropic, baseado nos modelos da família Claude. Ele roda diretamente no terminal, compreende o contexto do projeto e executa operações. Características principais:

- **Capacidade de modelo de ponta** — baseado em Claude Opus / Sonnet, com desempenho de liderança em compreensão e geração de código
- **Nativo no terminal** — roda direto no terminal, integrando-se sem fricção ao fluxo de trabalho do desenvolvedor
- **Consciente do projeto** — entende automaticamente a estrutura do projeto, dependências e padrões de código
- **Coordenação de várias ferramentas** — suporta leitura/escrita de arquivos, execução de comandos, busca em código e mais

O Claude Code também suporta integração com VS Code, JetBrains e outras IDEs, podendo ser usado como aplicativo de desktop independente ou como Web App.

## Por que escolher o Claude Code

Se você está decidindo qual AI Agent usar para operar o NocoBase, esses são os cenários em que o Claude Code se destaca:

- **Você busca a melhor capacidade de modelo** — os modelos da família Claude se destacam em raciocínio complexo e geração de código
- **Fluxo de trabalho de desenvolvedor** — nativo no terminal, integra-se perfeitamente com a sua IDE, Git, npm e demais ferramentas
- **Necessita de entendimento profundo do projeto** — o Claude Code analisa automaticamente a estrutura do projeto e oferece sugestões adequadas ao contexto
- **Atua tanto na construção quanto no desenvolvimento** — ajuda você tanto a construir aplicativos NocoBase quanto a desenvolver plugins customizados

## Como funciona a conexão

O Claude Code colabora com o NocoBase desta forma:

```
Você (terminal / VS Code / JetBrains / ...)
  │
  └─→ Claude Code
        │
        ├── NocoBase Skills (deixa o Agent entender o sistema de configuração do NocoBase)
        │
        └── NocoBase CLI (executa criação, alteração, deploy, etc.)
              │
              └─→ Serviço NocoBase (seu sistema de negócio)
```

- **NocoBase Skills** — pacote de conhecimento de domínio que ensina o Claude Code a operar o NocoBase
- **NocoBase CLI** — ferramenta de linha de comando que efetivamente executa modelagem de dados, montagem de páginas, etc.
- **Serviço NocoBase** — sua instância do NocoBase em execução

## Pré-requisitos

Antes de começar, certifique-se de que o ambiente abaixo está pronto:

- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)
- Node.js >= 22 (para rodar o NocoBase CLI e os Skills)
- Se você já tem uma instância NocoBase, **como as capacidades de IA evoluem rápido, atualmente apenas a versão beta mais recente oferece a experiência completa, com a versão mínima requerida >= 2.1.0-beta.20. Recomendamos fortemente atualizar para a versão mais recente.**

## Início rápido

### Instalação com um clique via IA

Copie o prompt abaixo para o Claude Code, e ele vai cuidar automaticamente da instalação do NocoBase CLI, da inicialização e da configuração do ambiente:

```
Me ajuda a instalar o NocoBase CLI e finalizar a inicialização: https://docs.nocobase.com/cn/ai/ai-quick-start.md (acesse o conteúdo do link diretamente)
```

### Instalação manual

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

O navegador abre automaticamente uma página visual de configuração que orienta você a instalar os NocoBase Skills, configurar o banco de dados e iniciar a aplicação. Para os passos detalhados, consulte o [Início rápido](../quick-start.md).

Depois de concluir a instalação, execute `nb env list` para confirmar o status do ambiente:

```bash
nb env list
```

Confirme que a saída mostra um ambiente configurado e o status de execução.

## Perguntas frequentes

<!-- TODO: organizar de 5 a 8 perguntas frequentes. Por exemplo: como configurar a API Key, quais modelos o Claude Code suporta, como usar no VS Code, o que fazer se a instalação dos Skills falhar, etc. -->

## Links relacionados

- [NocoBase CLI](../quick-start.md) — ferramenta de linha de comando para instalar e gerenciar o NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — pacotes de conhecimento de domínio instaláveis em AI Agents
- [Início rápido do Construtor de IA](../../ai-builder/index.md) — construa aplicativos NocoBase do zero com IA
- [Documentação oficial do Claude Code](https://docs.anthropic.com/en/docs/claude-code) — guia completo de uso do Claude Code
- [OpenClaw + NocoBase](../openclaw/index.md) — o AI Agent open source mais popular do mundo, com deploy de um clique no Lark
- [Codex + NocoBase](../codex/index.md) — assistente oficial de programação com IA da OpenAI
- [OpenCode + NocoBase](../opencode/index.md) — AI Agent de terminal open source com mais de 75 modelos suportados
