---
pkg: "@nocobase/plugin-kanban"
title: "Block de kanban"
description: "Block de kanban: exibe registros agrupados em colunas, com troca de estilo, criação rápida, configuração de modal, ordenação por arrastar e abertura de cartões com clique."
keywords: "Block de kanban,Kanban,agrupamento de dados,arrastar e soltar,criação rápida,configuração de modal,layout de cartão,interface,NocoBase"
---

# Kanban

## Introdução

O Block de kanban exibe registros agrupados em colunas, ideal para cenários em que os dados precisam ser visualizados e movimentados por estágios — como o fluxo de status de tarefas, o acompanhamento das fases de uma venda ou o tratamento de tickets.

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_51_PM.png)

## Configurações do Block

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM.png)

### Configuração de agrupamento

O Block de kanban exige primeiro um campo de agrupamento; o sistema distribuirá os registros em colunas com base no valor do campo.

- O campo de agrupamento aceita campos do tipo single select ou many-to-one.
- Para campos single select, o título e a cor da coluna reaproveitam diretamente a label e a cor configuradas nas opções do campo.
- As opções de agrupamento de campos many-to-one são carregadas dos registros da tabela relacionada.
- Quando o campo de agrupamento é many-to-one, é possível configurar adicionalmente:
	- Campo de título: define qual valor da relação aparece no cabeçalho da coluna.
	- Campo de cor: define a cor de fundo do cabeçalho e da coluna.
- A opção "Selecionar valores de agrupamento" controla quais colunas aparecem e a ordem em que são exibidas.
- Registros com valor de agrupamento vazio aparecem na coluna "Desconhecido".

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM%20(1).png)
![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM.png)

### Estilo

O kanban suporta dois estilos de coluna:

- `Classic`: mantém um fundo de coluna padrão mais leve.
- `Filled`: usa a cor da coluna para renderizar o fundo do cabeçalho e do contêiner da coluna; ideal quando as cores de status são bem definidas.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM%20(1).png)

### Configuração de arrastar e soltar

Com o arrastar e soltar habilitado, é possível mover os cartões para reordená-los diretamente.

- Após habilitar "Ativar ordenação por arrastar", é possível escolher também o "Campo de ordenação por arrastar".
- A ordenação por arrastar depende do campo de ordenação, que precisa corresponder ao campo de agrupamento atual.
- Ao arrastar um cartão para outra coluna, o valor do campo de agrupamento e a posição de ordenação do registro são atualizados em conjunto.

Para mais informações, consulte [Campo de ordenação](/data-sources/field-sort)

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_55_PM.png)

### Criação rápida

Após habilitar "Criação rápida", aparece um botão de adição (+) à direita do título de cada coluna.

- Clicar no botão "+" do cabeçalho da coluna abre o modal de criação usando aquela coluna como contexto.
- O formulário de criação preenche automaticamente o valor de agrupamento daquela coluna.
- Se a coluna atual for "Desconhecido", o campo de agrupamento é preenchido com vazio.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_57_PM.png)

### Configuração do modal

A "configuração do modal" no nível do Block controla o comportamento do modal aberto pelo botão de criação rápida no cabeçalho da coluna.

- É possível configurar o modo de abertura, por exemplo drawer, dialog ou página.
- É possível configurar o tamanho do modal.
- É possível vincular um template de modal ou continuar adicionando Blocks dentro do modal.

### Itens por coluna

Controla quantos registros são carregados inicialmente em cada coluna. Quando há muitos registros na coluna, é possível continuar carregando ao rolar.

### Largura da coluna

Define a largura de cada coluna, útil para ajustar a apresentação conforme a densidade de conteúdo dos cartões.

### Definir escopo de dados

Define o escopo dos dados exibidos no Block de kanban.

Por exemplo: mostrar apenas as tarefas criadas pelo responsável atual, ou apenas registros pertencentes a um projeto específico.

Para mais informações, consulte [Definir escopo de dados](/interface-builder/blocks/block-settings/data-scope)


## Configurar campos

O cartão do kanban usa um layout no estilo de detalhe para exibir o resumo do registro.

### Adicionar campos

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM.png)

Para configurações por campo, consulte [Campos de detalhe](/interface-builder/fields/generic/detail-form-item)

### Configurações do cartão

O cartão em si suporta as seguintes configurações:

- Ativar abertura por clique: ao habilitar, clicar no cartão abre o registro atual.
- Configuração do modal: configura, individualmente para o cartão, o modo de abertura, o tamanho e o template do modal acionado pelo clique.
- Layout: ajusta o layout dos campos dentro do cartão.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_56_PM.png)

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM%20(2).png)

## Configurar Actions

O Block de kanban permite configurar Actions globais no topo. As Actions disponíveis variam conforme as Action Capabilities habilitadas no ambiente atual.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_10_02_PM.png)

### Actions globais

- [Adicionar](/interface-builder/actions/types/add-new)
- [Modal](/interface-builder/actions/types/pop-up)
- [Link](/interface-builder/actions/types/link)
- [Atualizar](/interface-builder/actions/types/refresh)
- [Custom Request](/interface-builder/actions/types/custom-request)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)
