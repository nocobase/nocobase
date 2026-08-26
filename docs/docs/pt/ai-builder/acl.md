---
title: "Configuração de Permissões"
description: "O Skill de Configuração de Permissões serve para gerenciar papéis, políticas de permissão, vínculo de usuários e avaliação de risco da ACL do NocoBase em linguagem natural."
keywords: "Construtor de IA,configuração de permissões,ACL,papéis,permissões,vínculo de usuário,avaliação de risco"
---

# Configuração de Permissões

:::tip Pré-requisitos

Antes de ler esta página, certifique-se de que você seguiu o [Início Rápido do Construtor de IA](./index.md), instalou o NocoBase CLI e concluiu a inicialização.

:::

## Introdução

O Skill de Configuração de Permissões serve para gerenciar papéis, políticas de permissão, vínculo de usuários e avaliação de risco da ACL do NocoBase em linguagem natural — você descreve o objetivo de negócio e ele escolhe os comandos e parâmetros.


## Capacidades

- Criar novos papéis.
- Alternar o modo global de papel (independente / combinado).
- Configurar em lote permissões de ações e escopo de dados em tabelas.
- Desvincular usuários de papéis.
- Gerar relatórios de avaliação de risco em nível de papel, usuário e sistema.

## Exemplos de prompt

### Cenário A: Vincular usuários em lote
:::tip Pré-requisitos
O ambiente atual deve ter um papel Member e vários usuários.
:::

```
Vincule esses novos usuários ao papel Member: James, Emma, Michael.
```

![Vincular usuários em lote](https://static-docs.nocobase.com/20260422202343.png)

### Cenário B: Configurar permissões de página em lote
:::tip Pré-requisitos
O ambiente atual deve ter um papel Member e várias páginas.
:::
```
Configure para o papel Member as permissões dessas páginas: Product, Order, Stock.
```

![Configurar permissões de página em lote](https://static-docs.nocobase.com/20260422202949.png)

### Cenário C: Configurar permissões em várias tabelas em lote
:::tip Pré-requisitos
O ambiente atual deve ter um papel Member e várias tabelas.
:::

```
Adicione ao papel Member permissão de leitura independente nessas tabelas: order, product, stock.
```

![Configurar permissões independentes em tabelas em lote](https://static-docs.nocobase.com/20260422205341.png)

![Configurar permissões independentes em tabelas em lote 2](https://static-docs.nocobase.com/20260422205430.png)

### Cenário D: Permissões para múltiplos papéis e tabelas
:::tip Pré-requisitos
O ambiente atual deve ter vários papéis e várias tabelas.
:::

```
Adicione aos papéis Member e Sales permissão independente de leitura e escrita nessas tabelas: order, product, stock.
```

![Permissões para múltiplos papéis e tabelas](https://static-docs.nocobase.com/20260422213524.png)

### Cenário E: Avaliação de risco

```
Avalie o risco de permissões do papel Member.
```

A saída inclui pontuação de risco, descrição do impacto e sugestões de melhoria.

## Perguntas frequentes

**O que fazer quando configurei a permissão e ela não tem efeito?**

Confirme primeiro se o modo global de papel está correto — se um usuário possui vários papéis, há diferenças importantes de comportamento entre o modo combinado e o modo independente. Você pode verificar o modo atual para identificar o problema.

## Links relacionados

- [Visão Geral do Construtor de IA](./index.md) — Visão geral de todos os Skills do Construtor de IA e como instalar
- [NocoBase CLI](../ai/quick-start.md) — Ferramenta de linha de comando para instalar e gerenciar o NocoBase
