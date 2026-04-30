---
title: "OpenCode + NocoBase: uma forma open source, livre e sem amarras de construir o NocoBase"
description: "Integre o OpenCode, assistente open source de programação com IA, ao NocoBase, escolha livremente o modelo e use linguagem natural para operar o seu sistema de negócio."
keywords: "OpenCode,NocoBase,AI Agent,open source,múltiplos modelos,Skills,CLI,linguagem natural"
sidebar: false
---

:::warning Conteúdo em elaboração

O conteúdo desta página ainda está sendo escrito; algumas seções podem estar incompletas ou sofrer alterações.

:::

# OpenCode + NocoBase: uma forma open source, livre e sem amarras de construir o NocoBase

[OpenCode](https://github.com/opencode-ai/opencode) é um AI Agent de terminal open source — suporta mais de 75 modelos (Claude, GPT, Gemini, DeepSeek, etc.), sem amarras a nenhum fornecedor, dando a você liberdade para escolher o modelo mais adequado. Ao integrá-lo ao NocoBase, você pode usar linguagem natural para criar tabelas de dados, montar páginas e configurar workflows, mantendo o controle total sobre a escolha do modelo e o custo.

<!-- Necessário um screenshot do OpenCode operando o NocoBase no terminal -->

## O que é o OpenCode

OpenCode é desenvolvido pela Anomaly Innovations (140k+ Stars no GitHub) e se posiciona como "AI Agent de terminal sem amarras a fornecedores". Escrito em Go, oferece uma TUI elegante. Características principais:

- **Mais de 75 modelos suportados** — Claude, GPT, Gemini, DeepSeek, modelos locais, troque livremente entre eles
- **Zero vendor lock-in** — traga sua própria API Key e pague pelo uso real, sem precisar de assinaturas adicionais
- **Arquitetura multi-Agent** — vem com cinco papéis de Agent integrados: Build, Plan, Review, Debug, Docs
- **Privacidade em primeiro lugar** — não armazena código nem contexto; todos os dados ficam locais

O OpenCode também suporta integração com VS Code, JetBrains, Zed, Neovim e outros editores, além de ter um aplicativo de desktop independente.

## Por que escolher o OpenCode

Se você está decidindo qual AI Agent usar para operar o NocoBase, esses são os cenários em que o OpenCode se destaca:

- **Não quer ficar preso a um único modelo** — hoje use Claude, amanhã troque para GPT, depois experimente DeepSeek, tudo numa só ferramenta
- **Foco em controle de custo** — traga sua API Key, pague pelo uso e aproveite assinaturas existentes do ChatGPT Plus
- **Tem requisitos de privacidade** — código e contexto não passam por terceiros, com suporte a modelos locais
- **Gosta de alta customização** — configure o comportamento dos Agents via YAML para atender necessidades específicas da equipe

## Como funciona a conexão

O OpenCode colabora com o NocoBase desta forma:

```
Você (terminal / VS Code / JetBrains / ...)
  │
  └─→ OpenCode
        │
        ├── NocoBase Skills (deixa o Agent entender o sistema de configuração do NocoBase)
        │
        └── NocoBase CLI (executa criação, alteração, deploy, etc.)
              │
              └─→ Serviço NocoBase (seu sistema de negócio)
```

- **NocoBase Skills** — pacote de conhecimento de domínio que ensina o OpenCode a operar o NocoBase
- **NocoBase CLI** — ferramenta de linha de comando que efetivamente executa modelagem de dados, montagem de páginas, etc.
- **Serviço NocoBase** — sua instância do NocoBase em execução

## Pré-requisitos

Antes de começar, certifique-se de que o ambiente abaixo está pronto:

- OpenCode instalado ([guia de instalação](https://opencode.ai/docs/))
- Node.js >= 22 (para rodar o NocoBase CLI e os Skills)
- Se você já tem uma instância NocoBase, **como as capacidades de IA evoluem rápido, atualmente apenas a versão beta mais recente oferece a experiência completa, com a versão mínima requerida >= 2.1.0-beta.20. Recomendamos fortemente atualizar para a versão mais recente.**

## Início rápido

### Instalação com um clique via IA

Copie o prompt abaixo para o OpenCode, e ele vai cuidar automaticamente da instalação do NocoBase CLI, da inicialização e da configuração do ambiente:

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

<!-- TODO: organizar de 5 a 8 perguntas frequentes. Por exemplo: como configurar a API Key de cada modelo, como trocar de modelo, como usar modelos locais, o que fazer se a instalação dos Skills falhar, etc. -->

## Links relacionados

- [NocoBase CLI](../quick-start.md) — ferramenta de linha de comando para instalar e gerenciar o NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — pacotes de conhecimento de domínio instaláveis em AI Agents
- [Início rápido do Construtor de IA](../../ai-builder/index.md) — construa aplicativos NocoBase do zero com IA
- [Documentação oficial do OpenCode](https://opencode.ai/docs/) — guia completo de uso do OpenCode
- [Claude Code + NocoBase](../claude-code/index.md) — assistente oficial de programação com IA da Anthropic
- [Codex + NocoBase](../codex/index.md) — assistente oficial de programação com IA da OpenAI
