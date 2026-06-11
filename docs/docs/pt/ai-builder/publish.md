---
title: "Gerenciamento de Publicação"
description: "O Skill de Gerenciamento de Publicação serve para executar operações de publicação auditáveis entre múltiplos ambientes, com suporte a restauração de backup e migração."
keywords: "Construtor de IA,gerenciamento de publicação,publicação entre ambientes,restauração de backup,migração"
---

# Gerenciamento de Publicação

:::tip Pré-requisitos

- Antes de ler esta página, instale o NocoBase CLI e conclua a inicialização seguindo o [Início rápido do Construtor de IA](./index.md)
- É necessária uma licença da edição Professional ou superior. Consulte a [Edição Comercial do NocoBase](https://www.nocobase.com/cn/commercial)
- Ative os plugins "Gerenciamento de Backup" e "Gerenciamento de Migração" e atualize-os para a versão mais recente

:::

## Introdução

O Skill de Gerenciamento de Publicação serve para executar operações de publicação entre vários ambientes NocoBase. Ele oferece suporte a duas formas: restauração de backup e migração.

Se você quer apenas sobrescrever completamente um ambiente com outro, normalmente a restauração de backup é suficiente. Se você precisa controlar por regras quais conteúdos serão sincronizados, por exemplo, sincronizar apenas a estrutura sem os dados de negócio, a migração é mais adequada.

## Capacidades

- Restauração de backup em ambiente único: restaura o ambiente atual usando um pacote de backup existente
- Restauração imediata em ambiente único: primeiro cria um backup do ambiente atual e depois restaura o ambiente atual com esse backup
- Restauração de backup entre ambientes: restaura o pacote de backup do ambiente de origem no ambiente de destino
- Migração entre ambientes: atualiza o ambiente de destino de forma diferencial com um pacote de migração

## Exemplos de prompt

### Cenário A: restauração de backup em ambiente único com arquivo especificado

:::tip Pré-requisitos

O ambiente atual precisa ter um arquivo de backup com o mesmo nome.

:::

```text
Restaurar usando o backup <file-name.nbdata>
```

O Skill usa o arquivo de backup com o mesmo nome que já existe no servidor do ambiente atual para fazer a restauração.

### Cenário B: restauração de backup em ambiente único sem especificar arquivo

```text
Fazer backup e restaurar o ambiente atual
```

O Skill primeiro cria um backup do ambiente atual e depois restaura o ambiente atual com esse backup.

### Cenário C: restauração de backup entre ambientes

:::tip Pré-requisitos

Prepare dois ambientes, por exemplo, um ambiente dev local e um ambiente test remoto, ou dois ambientes locais. Você pode especificar um arquivo de backup concreto ou não especificar nenhum arquivo.

:::

```text
Restaurar dev para test
```

O Skill cria um pacote de backup no ambiente dev e depois restaura esse pacote no ambiente test.

### Cenário D: migração entre ambientes

:::tip Pré-requisitos

Assim como no Cenário C, prepare dois ambientes. Você pode especificar um arquivo de migração concreto ou não especificar nenhum arquivo.

:::

```text
Migrar dev para test
```

O Skill cria um pacote de migração no ambiente dev e depois usa esse pacote para atualizar o ambiente test.

## Perguntas frequentes

**Devo escolher restauração de backup ou migração?**

A opção padrão é a restauração de backup, especialmente se você já tem um pacote de backup utilizável ou deseja que o ambiente de destino seja completamente sobrescrito pelo estado do ambiente de origem. Use migração apenas quando precisar controlar por regras o escopo da sincronização, por exemplo, sincronizar somente a estrutura sem os dados.

**O que significa não encontrar o plugin de migração?**

O plugin de Gerenciamento de Migração requer uma licença da edição Professional ou superior. Consulte a [Edição Comercial do NocoBase](https://www.nocobase.com/cn/commercial) para mais detalhes.

## Links relacionados

- [Visão geral do Construtor de IA](./index.md) — visão geral e forma de instalação de todos os Skills do Construtor de IA
- [Gerenciamento de Ambiente](./env-bootstrap) — verificação de ambiente, instalação, implantação e diagnóstico de falhas
