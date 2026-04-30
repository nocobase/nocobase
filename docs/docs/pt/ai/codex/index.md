---
title: "Use Codex para operar o NocoBase, conciliando construção e desenvolvimento"
description: "Integre o Codex, assistente oficial de programação com IA da OpenAI, ao NocoBase, e use linguagem natural para operar o seu sistema de negócio através de Skills e do CLI."
keywords: "Codex,OpenAI,NocoBase,AI Agent,Skills,CLI,linguagem natural"
sidebar: false
---

:::warning Conteúdo em elaboração

O conteúdo desta página ainda está sendo escrito; algumas seções podem estar incompletas ou sofrer alterações.

:::

# Use Codex para operar o NocoBase, conciliando construção e desenvolvimento

[Codex](https://github.com/openai/codex) é o assistente oficial de programação com IA da OpenAI — roda no terminal, lê e escreve código, executa comandos e ajuda em tarefas que vão desde a codificação até a construção de sistemas. Ao integrá-lo ao NocoBase, você pode usar linguagem natural para criar tabelas de dados, montar páginas e configurar workflows, contando com a capacidade dos modelos da família GPT para construir sistemas de negócio rapidamente.

<!-- Necessário um screenshot do Codex operando o NocoBase no terminal -->

## O que é o Codex

Codex é um AI Agent em formato CLI lançado pela OpenAI, baseado nos modelos da família GPT (incluindo o3, o4-mini, etc.). Ele roda em uma sandbox local, executando código e comandos com segurança. Características principais:

- **Apoio dos modelos GPT** — baseado nos modelos mais recentes da OpenAI, com excelente desempenho em geração de código e planejamento de tarefas
- **Execução em sandbox** — comandos executados em ambiente isolado, com segurança e controle
- **Compreensão multimodal** — suporta entrada de texto, imagens e mais, entendendo layouts de UI a partir de screenshots
- **Níveis de autonomia flexíveis** — do modo de sugestão ao modo totalmente automático, você decide o nível de autonomia da IA

## Por que escolher o Codex

Se você está decidindo qual AI Agent usar para operar o NocoBase, esses são os cenários em que o Codex se destaca:

- **Já está no ecossistema OpenAI** — se você tem uma assinatura ChatGPT Plus/Pro ou uma API Key da OpenAI, o Codex é a escolha mais natural
- **Prioriza segurança** — o mecanismo de execução em sandbox garante que as ações da IA não afetem inesperadamente o seu sistema
- **Precisa de controle flexível** — você pode alternar o nível de autonomia conforme a complexidade da tarefa: totalmente automático para tarefas simples, com confirmação para operações sensíveis
- **Gosta do estilo dos modelos da OpenAI** — a família GPT tem suas próprias vantagens em planejamento de tarefas e execução em etapas

## Como funciona a conexão

O Codex colabora com o NocoBase desta forma:

```
Você (terminal / ...)
  │
  └─→ Codex
        │
        ├── NocoBase Skills (deixa o Agent entender o sistema de configuração do NocoBase)
        │
        └── NocoBase CLI (executa criação, alteração, deploy, etc.)
              │
              └─→ Serviço NocoBase (seu sistema de negócio)
```

- **NocoBase Skills** — pacote de conhecimento de domínio que ensina o Codex a operar o NocoBase
- **NocoBase CLI** — ferramenta de linha de comando que efetivamente executa modelagem de dados, montagem de páginas, etc.
- **Serviço NocoBase** — sua instância do NocoBase em execução

## Pré-requisitos

Antes de começar, certifique-se de que o ambiente abaixo está pronto:

- Codex instalado (`npm install -g @openai/codex`)
- Node.js >= 22 (para rodar o NocoBase CLI e os Skills)
- Se você já tem uma instância NocoBase, **como as capacidades de IA evoluem rápido, atualmente apenas a versão beta mais recente oferece a experiência completa, com a versão mínima requerida >= 2.1.0-beta.20. Recomendamos fortemente atualizar para a versão mais recente.**

## Início rápido

### Instalação com um clique via IA

Copie o prompt abaixo para o Codex, e ele vai cuidar automaticamente da instalação do NocoBase CLI, da inicialização e da configuração do ambiente:

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

<!-- TODO: organizar de 5 a 8 perguntas frequentes. Por exemplo: como configurar a OpenAI API Key, quais modelos o Codex suporta, como escolher o nível de autonomia, o que fazer se a instalação dos Skills falhar, etc. -->

## Links relacionados

- [NocoBase CLI](../quick-start.md) — ferramenta de linha de comando para instalar e gerenciar o NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — pacotes de conhecimento de domínio instaláveis em AI Agents
- [Início rápido do Construtor de IA](../../ai-builder/index.md) — construa aplicativos NocoBase do zero com IA
- [Codex no GitHub](https://github.com/openai/codex) — código-fonte e documentação do Codex
- [Claude Code + NocoBase](../claude-code/index.md) — assistente oficial de programação com IA da Anthropic
- [OpenCode + NocoBase](../opencode/index.md) — AI Agent de terminal open source com mais de 75 modelos suportados
