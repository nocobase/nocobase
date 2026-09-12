---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Fonte de dados principal - OceanBase"
description: "Saiba mais sobre as versões compatíveis, a instalação do plugin, as instruções de uso e o mapeamento de campos ao usar o OceanBase como banco de dados principal do NocoBase."
keywords: "Fonte de dados principal,OceanBase,banco de dados principal,mapeamento de campos,NocoBase"
---

# OceanBase

## Introdução

O OceanBase pode ser usado como banco de dados principal do NocoBase para armazenar os dados das tabelas do sistema NocoBase e os dados de negócios da fonte de dados principal. O banco de dados principal é configurado durante a implantação do NocoBase e não pode ser excluído após a execução da aplicação.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | >= 4.3. |
| Versão comercial | Compatível com a edição Enterprise. |
| Tipo de banco de dados | Modo compatível com MySQL. |

:::warning Atenção

Ao ser usado como banco de dados principal, o OceanBase é compatível apenas com o modo compatível com MySQL.

:::

## Instalação do plugin

O OceanBase é fornecido por `@nocobase/plugin-data-source-oceanbase` e requer uma licença comercial.

## Instruções de uso

1. Ao implantar o NocoBase, selecione ou preencha os parâmetros de conexão correspondentes ao OceanBase na configuração de conexão do banco de dados.
2. Após iniciar o NocoBase, acesse a fonte de dados «Main» em «Gerenciamento de fontes de dados» para gerenciar as tabelas e os campos do banco de dados principal.
3. Para conectar tabelas que já existem no banco de dados, use «Sincronizar do banco de dados» na página de gerenciamento do banco de dados principal.
4. Ao configurar os campos de uma tabela, consulte os diretórios [Tabela de dados](../data-modeling/collection.md) e [Campo](../data-modeling/collection-fields/index.md) para selecionar os tipos de campo e os componentes de campo.

## Mapeamento de tipos de campo

No banco de dados principal, ao criar campos por meio da página do NocoBase, o NocoBase criará os campos correspondentes do OceanBase com base na configuração dos campos. Ao conectar tabelas existentes usando «Sincronizar do banco de dados», o NocoBase identifica os tipos de campo do OceanBase de acordo com a lógica de compatibilidade com MySQL e os mapeia automaticamente para um Field type e uma Field interface apropriados. Você pode ajustar a forma de exibição na interface na configuração do campo.

Os mapeamentos comuns são os seguintes:

| Tipo de campo do OceanBase | NocoBase Field type | Field interface opcionais |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Atenção

Os tipos de campo do OceanBase não compatíveis serão exibidos separadamente na configuração dos campos. Esses campos só poderão ser usados como campos comuns no NocoBase após a implementação de uma adaptação.

:::

Para mais configurações gerais, consulte [Introdução à fonte de dados principal](./index.md).