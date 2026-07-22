---
pkg: "@nocobase/plugin-data-source-manager"
title: "Fonte de dados principal - MySQL"
description: "Saiba mais sobre as versões compatíveis, a instalação de plugins, as instruções de uso e o mapeamento de campos ao usar o MySQL como banco de dados principal do NocoBase."
keywords: "fonte de dados principal,MySQL,banco de dados principal,mapeamento de campos,NocoBase"
---

# MySQL

## Introdução

O MySQL pode ser usado como banco de dados principal do NocoBase, para armazenar os dados das tabelas do sistema NocoBase e os dados de negócios da fonte de dados principal. O banco de dados principal é configurado durante a implantação do NocoBase e não pode ser excluído após a execução da aplicação.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | >= 8.0.17. |
| Edições comerciais | Compatível com as edições Community, Standard, Professional e Enterprise. |
| Tipo de banco de dados | MySQL. |

O MySQL é adequado como banco de dados principal para sistemas empresariais comuns.

## Instalação do plugin

O MySQL é uma funcionalidade integrada e não requer a instalação de um plugin separado.

## Instruções de uso

1. Ao implantar o NocoBase, selecione ou preencha os parâmetros de conexão correspondentes ao MySQL na configuração de conexão do banco de dados.
2. Após iniciar o NocoBase, acesse a fonte de dados «Main» em «Gerenciamento de fontes de dados» para gerenciar as tabelas e os campos do banco de dados principal.
3. Para conectar tabelas que já existem no banco de dados, use «Sincronizar do banco de dados» na página de gerenciamento do banco de dados principal.
4. Ao configurar os campos de uma tabela, consulte os diretórios [tabela de dados](../data-modeling/collection.md) e [campo](../data-modeling/collection-fields/index.md) para selecionar o tipo de campo e o componente de campo.

## Mapeamento de tipos de campo

No banco de dados principal, ao criar campos por meio da página do NocoBase, o NocoBase criará os campos correspondentes no MySQL com base na configuração dos campos. Ao conectar tabelas existentes usando «Sincronizar do banco de dados», o NocoBase fará o mapeamento automático dos tipos de campo do MySQL para o Field type e o Field interface apropriados. Você pode ajustar a forma de exibição na interface nas configurações do campo.

Os mapeamentos comuns são os seguintes:

| Tipo de campo do MySQL | NocoBase Field type | Field interface disponíveis |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TINYTEXT`、`TEXT`、`MEDIUMTEXT`、`LONGTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `YEAR` | `string`、`integer` | Input、Integer、Date。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Atenção

Os tipos de campo do MySQL não compatíveis serão exibidos separadamente na configuração dos campos. Esses campos só poderão ser usados como campos comuns no NocoBase após o desenvolvimento de um adaptador.

:::

Para obter mais configurações gerais, consulte [Introdução à fonte de dados principal](./index.md).
