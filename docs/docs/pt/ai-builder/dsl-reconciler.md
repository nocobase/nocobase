---
title: "Soluções"
description: "O Skill de Soluções serve para construir aplicações NocoBase em lote a partir de arquivos de configuração YAML."
keywords: "Construtor de IA,soluções,construção de aplicações,YAML,criação de tabelas em lote,dashboard"
---

# Soluções

:::tip Pré-requisitos

Antes de ler esta página, certifique-se de que você seguiu o [Início Rápido do Construtor de IA](./index.md), instalou o NocoBase CLI e concluiu a inicialização.

:::

:::warning Atenção

A funcionalidade de Soluções ainda está em fase de testes, com estabilidade limitada e destinada apenas a uma experiência inicial.

:::

## Introdução

O Skill de Soluções serve para construir aplicações NocoBase em lote a partir de arquivos de configuração YAML — criando tabelas, configurando páginas, gerando dashboards e gráficos de uma só vez.

É indicado para cenários em que você precisa montar rapidamente um sistema de negócio completo, como CRM, gerenciamento de chamados, vendas e estoque etc.


## Capacidades

Pode fazer:

- Projetar uma solução completa de aplicação a partir da descrição da necessidade, incluindo tabelas, páginas e dashboards.
- Criar tabelas e páginas em lote através do `structure.yaml`.
- Configurar popups e formulários através do `enhance.yaml`.
- Gerar dashboards automaticamente, incluindo cards de KPI e gráficos.
- Atualização incremental — sempre usa o modo `--force`, sem destruir dados existentes.

Não pode fazer:

- Não é adequado para ajustes finos campo a campo (use o [Skill de Modelagem de Dados](./data-modeling), que é mais apropriado).
- Não faz migração de dados nem importação de dados.
- Não configura permissões nem workflows (precisa combinar com outros Skills).

## Exemplos de prompt

### Cenário A: Construir um sistema completo

```
Use o skill nocobase-dsl-reconciler para construir um sistema de gerenciamento de chamados, incluindo dashboard, lista de chamados, gerenciamento de usuários e configuração de SLA.
```

O Skill primeiro apresenta a proposta de design — listando todas as tabelas e estrutura de páginas — e, após confirmação, executa a construção em rodadas.

![Proposta de design](https://static-docs.nocobase.com/20260420100420.png)

![Resultado da construção](https://static-docs.nocobase.com/20260420100450.png)

### Cenário B: Modificar um módulo existente

```
Use o skill nocobase-dsl-reconciler para adicionar à tabela de chamados um campo de "nível de urgência" do tipo lista suspensa, com as opções de P0 a P3.
```

Após editar o `structure.yaml`, basta atualizar com `--force`.

### Cenário C: Customizar gráficos

```
Use o skill nocobase-dsl-reconciler para alterar no dashboard "Novos chamados desta semana" para "Novos chamados deste mês".
```

![Customizar gráfico](https://static-docs.nocobase.com/20260420100517.png)

Edite o arquivo SQL correspondente, troque o intervalo de tempo de `'7 days'` para `'1 month'` e execute `--verify-sql` para validar.

## Perguntas frequentes

**O que fazer quando a validação do SQL falha?**

O NocoBase usa PostgreSQL — os nomes de coluna devem estar em camelCase com aspas duplas (por exemplo, `"createdAt"`) e funções de data devem usar `NOW() - '7 days'::interval`, em vez da sintaxe do SQLite. Executar `--verify-sql` ajuda a detectar esse tipo de problema antes do deploy.

**Como ajustar um campo após a construção?**

Para a construção do conjunto, use o Skill de Soluções. Para ajustes posteriores, é mais flexível usar o [Skill de Modelagem de Dados](./data-modeling) ou o [Skill de Configuração de Interface](./ui-builder).

## Links relacionados

- [Visão Geral do Construtor de IA](./index.md) — Visão geral de todos os Skills do Construtor de IA e como instalar
- [Modelagem de Dados](./data-modeling) — Use o Skill de Modelagem de Dados para ajustes finos campo a campo
- [Configuração de Interface](./ui-builder) — Ajuste páginas e layout de blocos após a construção
