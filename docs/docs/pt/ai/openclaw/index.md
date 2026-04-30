---
title: "OpenClaw + NocoBase: o AI Agent mais popular da internet trabalhando para você"
description: "Integre o OpenClaw, AI Agent open source mais popular do mundo, ao NocoBase, e use linguagem natural para operar o seu sistema de negócio através de Skills e do CLI."
keywords: "OpenClaw,NocoBase,AI Agent,Skills,CLI,Lark,linguagem natural"
sidebar: false
---

:::warning Conteúdo em elaboração

O conteúdo desta página ainda está sendo escrito; algumas seções podem estar incompletas ou sofrer alterações.

:::

# OpenClaw + NocoBase: o AI Agent mais popular da internet trabalhando para você

[OpenClaw](https://github.com/openclaw/openclaw) é o framework de AI Agent open source mais popular do mundo — não apenas conversa, mas executa tarefas de verdade. Ao integrá-lo ao NocoBase, você pode usar linguagem natural para criar tabelas de dados, montar páginas e configurar workflows, e até deixá-lo rodando 24 horas por dia, 7 dias por semana, mantendo o seu sistema de negócio de forma autônoma.

<!-- Necessário um screenshot do OpenClaw operando o NocoBase no Lark -->

## O que é o OpenClaw

OpenClaw é um framework de AI Agent open source criado pelo desenvolvedor Peter Steinberger, atualmente um dos projetos de AI Agent mais populares do mundo (300k+ Stars no GitHub). Posiciona-se como "um assistente de IA capaz de colocar a mão na massa". Diferente de ferramentas de conversa como ChatGPT e Claude, o OpenClaw possui quatro características principais:

- **Capacidade de execução** — após receber instruções em linguagem natural, executa tarefas automaticamente, em vez de apenas dar sugestões
- **Memória entre sessões** — lembra suas preferências e hábitos de uso, ficando cada vez mais alinhado a você
- **Ecossistema de Skills** — amplia capacidades através da instalação de Skills, como "ensinar novas habilidades" ao assistente
- **Operação 24x7** — suporta tarefas agendadas e relatórios proativos, sem precisar que você fique monitorando

OpenClaw suporta mais de 26 plataformas como Lark, Telegram e Discord — você pode conversar com ele diretamente nas ferramentas que usa no dia a dia. Usuários do Lark ainda podem fazer deploy com um clique, sem necessidade de qualquer base técnica.

## Por que escolher o OpenClaw

Se você está decidindo qual AI Agent usar para operar o NocoBase, esses são os cenários em que o OpenClaw se destaca:

- **Você precisa de zero barreira de entrada** — usuários do Lark podem fazer deploy com um clique, sem precisar montar servidor próprio
- **Equipe usa Lark no trabalho** — o OpenClaw tem integração profunda com o Lark, com geração de mensagens em streaming, @bot em grupos, etc., proporcionando uma experiência fluida
- **Necessita estar online 24x7** — o OpenClaw fica implantado na nuvem, sem depender do estado do seu computador local
- **Valoriza o ecossistema da comunidade** — o OpenClaw possui a maior comunidade de Skills, com várias outras habilidades disponíveis além das do NocoBase

## Como funciona a conexão

O OpenClaw colabora com o NocoBase desta forma:

```
Você (Lark / Telegram / ...)
  │
  └─→ OpenClaw Agent
        │
        ├── NocoBase Skills (deixa o Agent entender o sistema de configuração do NocoBase)
        │
        └── NocoBase CLI (executa criação, alteração, deploy, etc.)
              │
              └─→ Serviço NocoBase (seu sistema de negócio)
```

- **NocoBase Skills** — pacote de conhecimento de domínio que ensina o OpenClaw a operar o NocoBase
- **NocoBase CLI** — ferramenta de linha de comando que efetivamente executa modelagem de dados, montagem de páginas, etc.
- **Serviço NocoBase** — sua instância do NocoBase em execução

## Pré-requisitos

Antes de começar, certifique-se de que o ambiente abaixo está pronto:

- OpenClaw Agent já implantado ([deploy de um clique no Lark](https://openclaw.feishu.cn) ou deploy local)
- Node.js >= 22 (para rodar o NocoBase CLI e os Skills)
- Se você já tem uma instância NocoBase, **como as capacidades de IA evoluem rápido, atualmente apenas a versão beta mais recente oferece a experiência completa, com a versão mínima requerida >= 2.1.0-beta.20. Recomendamos fortemente atualizar para a versão mais recente.**

:::warning Atenção

Ao instalar Skills de terceiros, atente-se à segurança — prefira Skills oficiais ou de fontes confiáveis e evite instalar habilidades da comunidade que não passaram por revisão.

:::

## Início rápido

### Instalação com um clique via IA

Copie o prompt abaixo para o OpenClaw, e ele vai cuidar automaticamente da instalação do NocoBase CLI, da inicialização e da configuração do ambiente:

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

<!-- TODO: organizar de 5 a 8 perguntas frequentes. Por exemplo: o que fazer se a instalação dos Skills falhar, como atualizar a versão dos Skills, quais modelos o OpenClaw suporta, como reverter quando uma operação falha, etc. -->

## Links relacionados

- [NocoBase CLI](../quick-start.md) — ferramenta de linha de comando para instalar e gerenciar o NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — pacotes de conhecimento de domínio instaláveis em AI Agents
- [Início rápido do Construtor de IA](../../ai-builder/index.md) — construa aplicativos NocoBase do zero com IA
- [Guia de deploy do OpenClaw no Lark](https://openclaw.feishu.cn) — deploy de um clique do OpenClaw no Lark
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — consolida habilidades automaticamente, entendendo cada vez mais o seu sistema de negócio
- [WorkBuddy + NocoBase](../workbuddy/index.md) — controle remoto do NocoBase via WeCom, Lark, DingTalk e outras plataformas
