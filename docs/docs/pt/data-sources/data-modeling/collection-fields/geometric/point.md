---
title: "Ponto"
description: "O campo Ponto é usado para armazenar uma localização geográfica ou coordenadas espaciais."
keywords: "Ponto,Point,Geometria,Mapa,NocoBase"
---

# Ponto

## Introdução

No NocoBase, **Ponto (Point)** é usado para armazenar as coordenadas de uma única localização.

O campo Ponto é adequado para dados espaciais, como a localização de lojas, clientes e dispositivos. Com o bloco de mapa, é possível exibir os registros no mapa.

Para armazenar uma rota, escolha [linha](./line.md). Para armazenar uma área, escolha [polígono](./polygon.md) ou [círculo](./circle.md).

## Cenários aplicáveis

O Ponto é adequado para estes cenários de negócio:

- Localização de lojas e armazéns
- Coordenadas de endereços de clientes
- Localização de instalação de dispositivos
- Localização de registros de inspeção

## Configuração de criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Ponto» para criar um campo Ponto.

![20240512181420](https://static-docs.nocobase.com/20240512181420.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. O Ponto corresponde a `point` e determina como o valor será inserido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Localização da loja», «Coordenadas do dispositivo» ou «Localização do cliente». Recomenda-se usar um nome que os usuários de negócio possam compreender diretamente. |
| Field name | Nome identificador do campo, usado em referências internas como API, campos de relação, permissões e fluxos de trabalho. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo Ponto é do tipo `point`. |
| Default value | Valor padrão. Ao adicionar um registro, o valor padrão pode ser preenchido automaticamente se o usuário não inserir nenhum valor. |
| Validation rules | Regras de validação. Normalmente, basta configurar o campo como obrigatório. |
| Description | Descrição do campo. É adequado informar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo Ponto é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `point`. |
| Field type padrão | `point`. |
| Field type opcional | `point`. |
| Componente da página | No modo de edição, usa um mapa ou um componente de seleção de coordenadas. |
| Filtro | A capacidade de filtragem espacial depende do plug-in de mapas e dos recursos da fonte de dados. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Oferece suporte a validações básicas, como campo obrigatório. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo Ponto. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, como alterar o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para um Field type e uma Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar seu nome identificador. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão dos novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alterar o Field type ou a Field interface não equivale a simplesmente mudar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo Ponto. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo Ponto criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado de um banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo Ponto é adequado para cenários de mapas e gerenciamento de localizações.
![20260710144034](https://static-docs.nocobase.com/20260710144034.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Selecionar ou inserir uma localização. |
| Bloco de detalhes | Exibir coordenadas de localização ou um ponto no mapa. |
| Bloco de mapa | Exibir pontos no mapa. |
| Fluxo de trabalho | Servir como entrada para condições de negócio relacionadas à localização. |

## Links relacionados

- [Campo](../index.md) — Saiba mais sobre a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Bloco de mapa](../../../../interface-builder/blocks/data-blocks/map.md) — Exiba campos geométricos no mapa
- [Linha](./line.md) — Armazene uma rota
- [Polígono](./polygon.md) — Armazene uma área