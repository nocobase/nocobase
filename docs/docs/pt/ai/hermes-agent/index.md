---
title: "Hermes Agent: o assistente NocoBase que entende você cada vez mais"
description: "Integre o Hermes Agent ao NocoBase e, com memória entre sessões e consolidação automática de habilidades, faça a IA entender cada vez melhor o seu sistema de negócio."
keywords: "Hermes Agent,NocoBase,AI Agent,Nous Research,Skills,aprendizado automático,self-hosted"
sidebar: false
---

:::warning Conteúdo em elaboração

O conteúdo desta página ainda está sendo escrito; algumas seções podem estar incompletas ou sofrer alterações.

:::

# Hermes Agent: o assistente NocoBase que entende você cada vez mais

[Hermes Agent](https://github.com/nousresearch/hermes-agent) é um AI Agent open source self-hosted — ele converte automaticamente cada operação bem-sucedida em documentos de habilidades reutilizáveis, entendendo cada vez melhor o seu sistema. Ao integrá-lo ao NocoBase, você não apenas pode usar linguagem natural para construir e gerenciar o sistema, como também faz com que ele aprenda gradualmente as suas convenções e preferências de negócio.

<!-- Necessário um screenshot do Hermes Agent operando o NocoBase no terminal ou em uma conversa do Lark -->

## O que é o Hermes Agent

Hermes Agent é desenvolvido pela Nous Research (35.7k Stars no GitHub) e tem como filosofia central "quanto mais você usa, mais inteligente fica". Diferente de outros AI Agents, o Hermes possui um mecanismo completo de aprendizado em ciclo fechado:

- **Memória entre sessões** — com base em busca de texto completo e resumos de LLM, é capaz de recuperar contextos de conversas de semanas atrás
- **Consolidação automática de habilidades** — após concluir tarefas complexas com sucesso, cria automaticamente documentos de habilidades reutilizáveis
- **Auto-melhoria contínua** — as habilidades são otimizadas continuamente com o uso repetido, ficando cada vez mais precisas
- **Mais de 400 modelos suportados** — compatível com os principais provedores de LLM, sem amarras a um modelo específico

O Hermes suporta 8 plataformas como Lark, Telegram, Discord, Slack, e também pode ser usado diretamente no terminal.

:::tip Dica

O Hermes Agent roda no seu próprio servidor, com todos os dados e memórias armazenados localmente, adequado para cenários com requisitos de segurança de dados.

:::

## Por que escolher o Hermes Agent

Se você está decidindo qual AI Agent usar para operar o NocoBase, esses são os cenários em que o Hermes se destaca:

- **Manutenção de longo prazo do mesmo sistema** — o mecanismo de memória do Hermes faz com que ele entenda cada vez melhor o seu negócio, sem precisar reexplicar o contexto a cada vez
- **Equipe com necessidade de self-hosting** — dados completamente locais, sem passar por serviços de terceiros
- **Necessidade de processos de operação padronizados** — os documentos de habilidades consolidados automaticamente pelo Hermes podem servir como manual de operação da equipe
- **Preferência por operações no terminal** — o Hermes tem suporte nativo a interação via CLI, ideal para o uso diário de equipes técnicas

## Como funciona a conexão

O Hermes Agent colabora com o NocoBase desta forma:

```
Você (Lark / Telegram / terminal / ...)
  │
  └─→ Hermes Agent
        │
        ├── NocoBase Skills (deixa o Agent entender o sistema de configuração do NocoBase)
        │
        ├── NocoBase CLI (executa criação, alteração, deploy, etc.)
        │
        └── Memória & documentos de habilidades (consolidados automaticamente, reutilizáveis)
              │
              └─→ Serviço NocoBase (seu sistema de negócio)
```

Ao contrário de outros Agents, o Hermes atualiza sua própria memória e documentos de habilidades após cada operação. Essas informações são armazenadas localmente e reutilizadas automaticamente em operações subsequentes.

## Pré-requisitos

Antes de começar, certifique-se de que o ambiente abaixo está pronto:

- Um servidor para rodar o Hermes Agent (Linux / macOS, Python 3.10+)
- Node.js >= 22 (para rodar o NocoBase CLI e os Skills)
- Se você já tem uma instância NocoBase, **como as capacidades de IA evoluem rápido, atualmente apenas a versão beta mais recente oferece a experiência completa, com a versão mínima requerida >= 2.1.0-beta.20. Recomendamos fortemente atualizar para a versão mais recente.**

A instalação do Hermes precisa de apenas uma linha de comando:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

:::warning Atenção

O Hermes Agent precisa ser implantado e mantido por você. Se você prefere algo zero-config, pronto para uso, considere o [OpenClaw](../openclaw/index.md) (deploy de um clique no Lark) ou o [WorkBuddy](../workbuddy/index.md) (gerenciado pela Tencent).

:::

## Início rápido

### Instalação com um clique via IA

Copie o prompt abaixo para o Hermes Agent, e ele vai cuidar automaticamente da instalação do NocoBase CLI, da inicialização e da configuração do ambiente:

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

<!-- TODO: organizar de 5 a 8 perguntas frequentes. Por exemplo: onde ficam os arquivos de memória, como migrar para um novo servidor, quais modelos são suportados, como limpar memórias incorretas, qual a diferença entre Hermes e OpenClaw, etc. -->

## Links relacionados

- [NocoBase CLI](../quick-start.md) — ferramenta de linha de comando para instalar e gerenciar o NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — pacotes de conhecimento de domínio instaláveis em AI Agents
- [Início rápido do Construtor de IA](../../ai-builder/index.md) — construa aplicativos NocoBase do zero com IA
- [Hermes Agent no GitHub](https://github.com/nousresearch/hermes-agent) — código-fonte e documentação do Hermes Agent
- [OpenClaw + NocoBase](../openclaw/index.md) — o AI Agent open source mais popular do mundo, com deploy de um clique no Lark
- [WorkBuddy + NocoBase](../workbuddy/index.md) — controle remoto do NocoBase via WeCom, Lark, DingTalk e outras plataformas
