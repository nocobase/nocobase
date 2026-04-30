---
title: "Mãos livres — controle o NocoBase com WorkBuddy"
description: "Controle o NocoBase remotamente através do WorkBuddy da Tencent, com suporte a múltiplas plataformas como WeCom, Lark e DingTalk."
keywords: "WorkBuddy,NocoBase,AI Agent,Tencent,WeCom,Lark,DingTalk,controle remoto"
sidebar: false
---

:::warning Conteúdo em elaboração

O conteúdo desta página ainda está sendo escrito; algumas seções podem estar incompletas ou sofrer alterações.

:::

# Mãos livres — controle o NocoBase com WorkBuddy

[WorkBuddy](https://www.codebuddy.cn) é o agente de IA corporativo de cenário completo lançado pela Tencent — descreva sua necessidade em uma frase e ele planeja os passos e executa de forma autônoma. Ao integrá-lo ao NocoBase, você pode controlar remotamente o seu sistema de negócio em plataformas como WeCom, Lark e DingTalk, sem precisar abrir o navegador para realizar as operações de gerenciamento do dia a dia.

<!-- Necessário um screenshot do WorkBuddy operando o NocoBase no WeCom -->

## O que é o WorkBuddy

WorkBuddy é a "mesa de trabalho de agente de IA corporativo de cenário completo" da Tencent. Diferente de ferramentas comuns de conversa de IA, ao receber uma tarefa, o WorkBuddy a decompõe, planeja e executa automaticamente, entregando um resultado verificável — sem que você precise orientar passo a passo.

Características principais:

- **Planejamento e execução autônomos** — após receber a tarefa, decompõe os passos automaticamente, executa um a um e entrega o resultado completo
- **Integração multi-plataforma** — suporta WeCom, Lark, DingTalk, QQ e outras plataformas líderes de trabalho na China
- **Mais de 20 habilidades integradas** — geração de documentos, análise de dados, criação de PPT, edição de e-mails, prontas para usar
- **Operação em arquivos locais** — pode ler e processar arquivos locais que você autorizar

Resumindo: ferramentas tradicionais de IA dão sugestões para você executar; o WorkBuddy faz tudo por você.

| IA conversacional tradicional   | WorkBuddy                                            |
| ------------------------------- | ---------------------------------------------------- |
| Apenas conversa, dá sugestões   | Executa tarefas de verdade                           |
| Operação manual de arquivos     | Opera automaticamente em arquivos locais             |
| Tarefas simples de um único passo | Decompõe automaticamente tarefas complexas multi-passo |
| Saída em forma de texto         | Entrega de resultado verificável                     |

## Por que escolher o WorkBuddy

Se você está decidindo qual AI Agent usar para operar o NocoBase, esses são os cenários em que o WorkBuddy se destaca:

- **Equipe usa WeCom / Lark / DingTalk** — o WorkBuddy tem o suporte mais amplo às plataformas de trabalho domésticas, com a maior cobertura
- **Necessidade de operar o NocoBase em mobile** — gerencie o sistema de qualquer lugar, sem ficar preso a um dispositivo
- **Quer algo pronto para uso** — produzido pela Tencent, com mais de 20 habilidades integradas e baixa barreira de configuração
- **Foco em automação de tarefas** — o WorkBuddy é bom em decompor e executar tarefas multi-passo automaticamente, ideal para operações e gestão diárias

## Como funciona a conexão

O WorkBuddy colabora com o NocoBase desta forma:

```
Você (WeCom / Lark / DingTalk / ...)
  │
  └─→ WorkBuddy
        │
        ├── NocoBase Skills (deixa o Agent entender o sistema de configuração do NocoBase)
        │
        └── NocoBase CLI (executa criação, alteração, deploy, etc.)
              │
              └─→ Serviço NocoBase (seu sistema de negócio)
```

Você envia instruções a partir de qualquer plataforma suportada, o WorkBuddy executa as operações no NocoBase no backend através dos Skills e do CLI, e os resultados são enviados de volta em tempo real para a sua janela de conversa.

## Pré-requisitos

Antes de começar, certifique-se de que o ambiente abaixo está pronto:

- Conta WorkBuddy ([cadastro](https://www.codebuddy.cn))
- Node.js >= 22 (para rodar o NocoBase CLI e os Skills)
- Se você já tem uma instância NocoBase, **como as capacidades de IA evoluem rápido, atualmente apenas a versão beta mais recente oferece a experiência completa, com a versão mínima requerida >= 2.1.0-beta.20. Recomendamos fortemente atualizar para a versão mais recente.**

:::warning Atenção

O WorkBuddy está em iteração rápida e algumas funcionalidades podem mudar. Recomendamos acompanhar a [documentação oficial do WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/Overview) para obter as informações mais recentes.

:::

## Início rápido

### Instalação com um clique via IA

Copie o prompt abaixo para o WorkBuddy, e ele vai cuidar automaticamente da instalação do NocoBase CLI, da inicialização e da configuração do ambiente:

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

<!-- TODO: organizar de 5 a 8 perguntas frequentes. Por exemplo: quais plataformas o WorkBuddy suporta, qual a cota gratuita, como lidar com falhas de operação, se múltiplas pessoas podem compartilhar o mesmo WorkBuddy controlando o mesmo NocoBase, etc. -->

## Links relacionados

- [NocoBase CLI](../quick-start.md) — ferramenta de linha de comando para instalar e gerenciar o NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — pacotes de conhecimento de domínio instaláveis em AI Agents
- [Início rápido do Construtor de IA](../../ai-builder/index.md) — construa aplicativos NocoBase do zero com IA
- [Documentação oficial do WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/Overview) — guia completo de uso do WorkBuddy
- [OpenClaw + NocoBase](../openclaw/index.md) — o AI Agent open source mais popular do mundo, com deploy de um clique no Lark
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — consolida habilidades automaticamente, entendendo cada vez mais o seu sistema de negócio
