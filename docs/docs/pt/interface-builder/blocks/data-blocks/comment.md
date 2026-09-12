---
pkg: "@nocobase/plugin-block-comment"
title: "Bloco de comentários"
description: "Bloco de comentários: permite visualizar e criar comentários em detalhes de registros, pop-ups e cenários semelhantes, com mapeamento de campos, paginação, escopo de dados, ordenação padrão e salto automático para a última página."
keywords: "Bloco de comentários,CommentBlock,tabela de comentários,mapeamento de campos,escopo de dados,ordenação padrão,construtor de interface,NocoBase"
---

# Bloco de comentários

## Introdução

O bloco de comentários adiciona recursos de comentário a registros de negócio. Você pode adicioná-lo a páginas de detalhes ou pop-ups de tarefas, artigos, chamados, clientes e outros registros, para que os usuários possam visualizar, responder e criar comentários em torno do registro atual.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_02_PM.png)

:::tip Dica

O bloco de comentários não cria uma coleção por si só. Antes de usá-lo, prepare uma coleção para armazenar comentários e configure campos como conteúdo do comentário, autor do comentário, proprietário do comentário e horário do comentário.

:::

## Adicionar um bloco

O bloco de comentários geralmente é adicionado à página de detalhes ou ao pop-up de um registro de negócio.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_03_PM.png)

1. Abra a página de detalhes ou o pop-up do registro de destino
2. Clique em "Adicionar bloco"
3. Selecione "Comentário"
4. Selecione a coleção usada para armazenar comentários
5. Conclua o mapeamento de campos conforme solicitado

Se o bloco de comentários for criado a partir de uma associação, o NocoBase tentará identificar automaticamente o campo proprietário do comentário e o valor do registro atual com base na associação atual. Nesse caso, "Campo proprietário do comentário" e "Valor do campo proprietário do comentário" são preenchidos automaticamente e geralmente não precisam de configuração manual.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_04_PM.png)

Se o bloco for criado diretamente a partir da coleção de comentários, você precisará configurar manualmente o campo proprietário do comentário e seu valor.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_03_PM%20(1).png)

## Mapeamento de campos

O bloco de comentários usa "Mapeamento de campos" para saber como cada comentário deve ser exibido e salvo.

| Configuração | Descrição |
| --- | --- |
| Campo de conteúdo do comentário | Selecione o campo usado para armazenar o corpo do comentário. |
| Campo do autor do comentário | Selecione um campo muitos-para-um associado à coleção de usuários. |
| Campo proprietário do comentário | Selecione o campo usado para armazenar o identificador do registro de negócio atual. |
| Valor do campo proprietário do comentário | Especifique o valor do registro de negócio atual, como `{{ ctx.popup.record.id }}`. |
| Campo de data do comentário | Selecione o campo de horário do comentário, usado para exibição e ordenação padrão. |

### Campo proprietário do comentário

"Campo proprietário do comentário" é usado para filtrar os comentários do registro atual e também é gravado quando um novo comentário é criado.

Ao selecionar manualmente, o menu suspenso mostra apenas campos escalares comuns e não mostra campos de associação. Configurações comuns:

| Coleção de negócio | Campo proprietário na coleção de comentários | Valor do campo proprietário do comentário |
| --- | --- | --- |
| Tarefas | `taskId` | `{{ ctx.popup.record.id }}` |
| Artigos | `postId` | `{{ ctx.popup.record.id }}` |
| Chamados | `ticketId` | `{{ ctx.popup.record.id }}` |

Se o registro atual usar um identificador único diferente de `id`, altere "Valor do campo proprietário do comentário" para o campo correspondente, como `{{ ctx.popup.record.uuid }}`.

### Mapeamento automático a partir de associações

Se o bloco for criado a partir de uma associação do registro de negócio, o bloco de comentários usa prioritariamente o campo de chave estrangeira dessa associação como campo proprietário do comentário, e usa o valor do registro atual como valor do campo proprietário do comentário.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_04_PM.png)

Por exemplo, se houver uma associação um-para-muitos entre a coleção de tarefas e a coleção de comentários de tarefas, e o campo de chave estrangeira na coleção de comentários de tarefas for `taskId`, ao adicionar um bloco de comentários a partir da associação na página de detalhes da tarefa, o bloco usará automaticamente:

- Campo proprietário do comentário: `taskId`
- Valor do campo proprietário do comentário: o identificador do registro de tarefa atual

Essa abordagem é adequada para a maioria dos cenários e reduz erros de configuração manual.

## Configuração do bloco

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_07_PM.png)

### Tamanho da página

Define quantos comentários são exibidos por página. Os valores disponíveis incluem `5`, `10`, `20`, `50`, `100` e `200`.

### Escopo de dados

Define o escopo de filtragem de dados para a lista de comentários. Você pode adicionar mais condições aqui, como exibir apenas comentários que atendam a determinados status ou condições de permissão.

Para mais detalhes, consulte [Definir escopo de dados](../block-settings/data-scope.md).

### Regra de ordenação padrão

Define a ordenação padrão da lista de comentários. Normalmente, você pode ordenar pelo campo de data do comentário em ordem crescente ou decrescente.

Se nenhuma regra de ordenação padrão for configurada separadamente, o bloco de comentários prioriza o "Campo de data do comentário" como campo de ordenação padrão.

Para mais detalhes, consulte [Definir regra de ordenação](../block-settings/sorting-rule.md).

### Saltar automaticamente para a última página

Desativado por padrão. Quando desativado, o bloco de comentários permanece na primeira página depois de aberto.

Quando ativado, o bloco de comentários salta para a última página no primeiro carregamento. Isso é adequado quando você deseja que os usuários vejam primeiro os comentários mais recentes.
