---
title: "Linha"
description: "O campo Linha é usado para armazenar dados espaciais lineares, como rotas e trajetos."
keywords: "Linha,LineString,rota,figura geométrica,NocoBase"
---

# Linha

## Introdução

No NocoBase, **linha (LineString)** é usada para armazenar dados espaciais lineares.

O campo Linha é adequado para dados de negócio como rotas, trajetos, tubulações e caminhos de inspeção. Em conjunto com um bloco de mapa, é possível exibir o caminho.

Se você precisa apenas de uma localização, escolha [ponto](./point.md). Se precisa de uma área, escolha [polígono](./polygon.md).

## Cenários aplicáveis

A linha é adequada para estes cenários de negócio:

- Rotas de entrega e inspeção
- Trajetos de veículos e pessoas
- Tubulações, linhas e limites
- Resultados do planejamento de rotas no mapa

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Linha» para criar um campo Linha.

![20240512181454](https://static-docs.nocobase.com/20240512181454.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para Linha, corresponde a `lineString` e determina como o campo será preenchido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Rota de entrega», «Trajeto de inspeção» ou «Tubulação». Recomenda-se usar um nome que os usuários de negócio compreendam diretamente. |
| Field name | Nome identificador do campo, usado em referências internas como API, campos de relação, permissões e fluxos de trabalho. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo Linha é `lineString`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. Normalmente, basta configurar o campo como obrigatório. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo Linha é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `lineString`. |
| Field type padrão | `lineString`. |
| Field type opcional | `lineString`. |
| Componente da página | No modo de edição, usa um componente de desenho de mapas. |
| Filtragem | A capacidade de filtragem espacial depende do plug-in de mapas e dos recursos da fonte de dados. |
| Ordenação | Normalmente, não é usado para ordenação. |
| Validação | Oferece validações básicas, como a obrigatoriedade do preenchimento. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo Linha. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, por exemplo, alterando o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | O nome identificador do campo normalmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Condicionalmente | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Condicionalmente | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, confirme se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo Linha. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo Linha criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados existentes nessa coluna também são excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo Linha é adequado para cenários de rotas em mapas e análises espaciais.
![20260710144453](https://static-docs.nocobase.com/20260710144453.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Desenhar ou inserir uma rota. |
| Bloco de detalhes | Exibir uma rota. |
| Bloco de mapa | Exibir um caminho linear no mapa. |
| Fluxo de trabalho | Participar do processo como dado relacionado a uma rota. |

## Links relacionados

- [Campo](../index.md) — entender a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — criar e gerenciar campos em uma tabela comum
- [Ponto](./point.md) — armazenar uma única localização
- [Polígono](./polygon.md) — armazenar uma área
