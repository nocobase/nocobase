---
pkg: "@nocobase/plugin-field-sort"
title: "Campo de ordenação"
description: "O campo de ordenação ordena os registros da tabela de dados, com suporte para agrupar antes de ordenar, permitindo personalizar a ordem de exibição dos registros."
keywords: "campo de ordenação,campo Sort,ordenação por grupo,sort,NocoBase"
---

# Campo de ordenação

## Introdução

No NocoBase, o **campo de ordenação (Sort)** é usado para registrar o valor de ordenação dos registros em uma tabela de dados. Ele é usado principalmente para ordenar registros por arrastar e soltar em blocos como tabelas e quadros kanban.

O campo de ordenação permite ordenar sem agrupamento ou agrupar antes de ordenar. A ordenação por grupo é adequada para cenários de “ordenação independente dentro do mesmo grupo”, como organizar alunos por turma ou tarefas por status no quadro kanban.

:::warning Observação

Como o campo de ordenação é um campo da mesma tabela, ao ordenar por grupo, não é possível que o mesmo registro apareça simultaneamente em vários grupos.

:::

## Instalação

O campo de ordenação é fornecido pelo plug-in integrado e não requer instalação separada.

## Criar um campo de ordenação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Ordenação» para criar um campo de ordenação.

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Ao criar um campo de ordenação, o NocoBase inicializa os valores de ordenação:

- Se a ordenação por grupo não for selecionada, a inicialização será feita com base nos campos de chave primária e data de criação
- Se a ordenação por grupo for selecionada, os dados serão agrupados primeiro e, em seguida, a inicialização será feita com base nos campos de chave primária e data de criação

:::warning Observação

Ao criar o campo, se a inicialização dos valores de ordenação falhar, o campo de ordenação não será criado. Dentro de um determinado intervalo, quando um registro é movido da posição A para a posição B, os valores de ordenação de todos os registros no intervalo AB serão alterados; se um deles falhar, a movimentação falhará e os valores de ordenação dos registros relacionados não serão alterados.

:::

### Criar um campo de ordenação sem agrupamento

Veja a seguir um exemplo de criação do campo `sort1`, que não usa ordenação por grupo.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Os campos de ordenação de cada registro serão inicializados com base nos campos de chave primária e data de criação.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

### Criar um campo de ordenação por grupo

Veja a seguir a criação de um campo `sort2` baseado no agrupamento por `Class ID`.

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

Nesse momento, todos os registros da tabela de dados serão primeiro agrupados por Class ID e, em seguida, os campos de ordenação serão inicializados.

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

## Ordenação por arrastar e soltar

O campo de ordenação é usado principalmente para ordenar por arrastar e soltar os registros de vários blocos. Atualmente, os blocos que oferecem suporte à ordenação por arrastar e soltar são tabelas e quadros kanban.

:::warning Observação

- Usar o mesmo campo de ordenação para arrastar e soltar em vários blocos pode corromper a ordenação existente
- O campo usado para ordenar linhas de uma tabela por arrastar e soltar não pode ser um campo de ordenação com regras de agrupamento
- Em um bloco de tabela de relacionamento um-para-muitos, a chave estrangeira pode ser usada como agrupamento
- Atualmente, apenas o bloco de quadro kanban oferece suporte à ordenação por grupo por arrastar e soltar

:::

### Ordenação por arrastar e soltar das linhas da tabela

O bloco de tabela pode usar um campo de ordenação para ajustar a ordem dos registros por arrastar e soltar.

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

O bloco de tabela de relacionamento também pode usar um campo de ordenação para ordenar por arrastar e soltar.

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Ordenação por arrastar e soltar no bloco de tabela de relacionamento"></video>

:::warning Observação

Em um bloco de relacionamento um-para-muitos, se for selecionado um campo de ordenação sem agrupamento, todos os registros poderão participar da ordenação; se os registros forem agrupados primeiro pela chave estrangeira e depois ordenados, a regra de ordenação afetará apenas os dados do grupo atual. O resultado final pode parecer igual, mas o intervalo de registros participantes da ordenação é diferente.

:::

### Ordenação por arrastar e soltar dos cartões do quadro kanban

O bloco de quadro kanban pode usar um campo de ordenação para ajustar a ordem dos cartões por arrastar e soltar.

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

## Descrição das regras de ordenação

### Movimentação entre registros sem agrupamento

Suponha que exista um conjunto de dados:

```text
[1,2,3,4,5,6,7,8,9]
```

Quando 5 é movido para a posição de 3, apenas os números de 3, 4 e 5 serão alterados. 5 ocupa a posição de 3, enquanto 3 e 4 avançam uma posição cada.

```text
[1,2,5,3,4,6,7,8,9]
```

Em seguida, quando 6 é movido para trás até a posição de 8, 6 ocupa a posição de 8, enquanto 7 e 8 recuam uma posição cada.

```text
[1,2,5,3,4,7,8,6,9]
```

### Movimentação entre grupos diferentes

Na ordenação por grupo, quando um registro é movido para outro grupo, o grupo ao qual ele pertence também muda. Suponha que existam dois grupos de dados:

```text
A: [1,2,3,4]
B: [5,6,7,8]
```

Quando 1 é movido para depois de 6, o grupo ao qual 1 pertence também muda de A para B.

```text
A: [2,3,4]
B: [5,6,1,7,8]
```

### As alterações de ordenação não estão relacionadas aos dados exibidos na interface

Suponha que exista um conjunto de dados:

```text
[1,2,3,4,5,6,7,8,9]
```

A interface exibe apenas:

```text
[1,5,9]
```

Quando 1 é movido para a posição de 9, as posições intermediárias de 2, 3, 4, 5, 6, 7 e 8 também serão alteradas.

```text
[2,3,4,5,6,7,8,9,1]
```

A interface finalmente exibirá:

```text
[5,9,1]
```

## Links relacionados

- [Campos da tabela de dados](../index.md) — Consulte os tipos de campo e as descrições do mapeamento de campos
- [Bloco de tabela](../../interface-builder/blocks/data-blocks/table.md) — Use a ordenação por arrastar e soltar em uma tabela
- [Bloco de quadro kanban](../../interface-builder/blocks/data-blocks/kanban.md) — Use a ordenação por arrastar e soltar em um quadro kanban
