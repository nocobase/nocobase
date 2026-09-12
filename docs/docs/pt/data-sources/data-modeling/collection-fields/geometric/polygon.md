---
title: "Polígono"
description: "O campo de polígono é usado para armazenar dados espaciais de áreas, limites, áreas de serviço e outras regiões de superfície."
keywords: "Polígono,Polygon,região,figura geométrica,NocoBase"
---

# Polígono

## Introdução

No NocoBase, **polígono (Polygon)** é usado para armazenar regiões espaciais de superfície.

O campo de polígono é adequado para dados de áreas administrativas, áreas de entrega, áreas de vendas, áreas proibidas e outros cenários de negócio. Em conjunto com um bloco de mapa, é possível exibir a extensão da região.

Se a região for um círculo simples, escolha [círculo](./circle.md). Se for necessário armazenar apenas uma localização, escolha [ponto](./point.md).

## Cenários de uso

O polígono é adequado para estes cenários de negócio:

- Áreas de vendas e áreas de entrega
- Áreas de serviço e áreas de gestão
- Áreas proibidas e áreas de risco
- Limites de áreas de negócio no mapa

## Configuração de criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Polígono» para criar um campo de polígono.

![20240512181547](https://static-docs.nocobase.com/20240512181547.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para polígonos, corresponde a `polygon` e determina como os dados são inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Área de vendas», «Área de entrega» ou «Área de risco». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado em referências internas como API, campos de relacionamento, permissões e fluxos de trabalho. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo de polígono é `polygon`. |
| Default value | Valor padrão. Ao adicionar um registro, o valor padrão pode ser preenchido automaticamente se o usuário não informar nenhum valor. |
| Validation rules | Regras de validação. Normalmente, basta configurar o campo como obrigatório. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Depois de criado, o nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajuste de configurações posteriormente.

:::

## Características do campo

O comportamento padrão do campo de polígono é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `polygon`. |
| Field type padrão | `polygon`. |
| Field type disponível | `polygon`. |
| Componente da página | No modo de edição, é usado um componente de desenho de mapas. |
| Filtros | A capacidade de filtragem espacial depende do plug-in de mapas e dos recursos da fonte de dados. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Oferece validações básicas, como campo obrigatório. |

## Edição da configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de polígono. A edição do campo serve principalmente para ajustar a forma como ele é exibido e usado no NocoBase, como alterar o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer o mapeamento do campo — mapeando o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar seu nome identificador. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão dos novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma como as variáveis são usadas nos fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Exclusão do campo

Clique em «Delete» à direita do campo para excluir o campo de polígono. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de polígono criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nessa coluna também são excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de polígono é adequado para cenários de gerenciamento de áreas e exibição em mapas.
![20260710145218](https://static-docs.nocobase.com/20260710145218.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Desenhar os limites da área. |
| Bloco de detalhes | Exibir a extensão da área. |
| Bloco de mapa | Exibir a área de superfície no mapa. |
| Gráficos e estatísticas | Usar como dimensão regional para analisar dados de negócio. |

## Links relacionados

- [Campo](../index.md) — conhecer a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — criar e gerenciar campos em uma tabela comum
- [Ponto](./point.md) — armazenar uma única localização
- [Círculo](./circle.md) — armazenar uma área circular
