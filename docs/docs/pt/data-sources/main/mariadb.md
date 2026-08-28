---
pkg: "@nocobase/plugin-data-source-manager"
title: "Fonte de dados principal - MariaDB"
description: "Saiba mais sobre as versões compatíveis, a instalação do plugin, as instruções de uso e o mapeamento de campos ao usar MariaDB como banco de dados principal do NocoBase."
keywords: "fonte de dados principal,MariaDB,banco de dados principal,mapeamento de campos,NocoBase"
---

# MariaDB

## Introdução

O MariaDB pode ser usado como banco de dados principal do NocoBase para armazenar os dados das tabelas do sistema do NocoBase e os dados de negócio da fonte de dados principal. O banco de dados principal é configurado durante a implantação do NocoBase e não pode ser excluído após a execução da aplicação.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | >= 10.9. |
| Versões comerciais | Compatível com as edições Community, Standard, Professional e Enterprise. |
| Tipo de banco de dados | MariaDB. |

Assim como o MySQL, o MariaDB é adequado para servir como banco de dados principal de sistemas empresariais convencionais.

## Instalação do plugin

O MariaDB é uma funcionalidade integrada e não requer a instalação de um plugin separado.

## Instruções de uso

1. Ao implantar o NocoBase, selecione ou preencha os parâmetros de conexão correspondentes ao MariaDB na configuração de conexão do banco de dados.
2. Após iniciar o NocoBase, acesse a fonte de dados «Main» em «Gerenciamento de fontes de dados» para gerenciar as tabelas e os campos do banco de dados principal.
3. Para conectar tabelas que já existem no banco de dados, use «Sincronizar do banco de dados» na página de gerenciamento do banco de dados principal.
4. Ao configurar os campos de uma tabela, consulte os diretórios [Tabela de dados](../data-modeling/collection.md) e [Campo](../data-modeling/collection-fields/index.md) para selecionar os tipos de campo e os componentes de campo.

## Mapeamento de tipos de campo

No banco de dados principal, ao criar campos por meio da página do NocoBase, o NocoBase cria os campos correspondentes do MariaDB de acordo com a configuração do campo. Ao conectar tabelas existentes usando «Sincronizar do banco de dados», o NocoBase mapeia automaticamente os tipos de campo do MariaDB para o Field type e o Field interface apropriados. O mapeamento dos campos comuns do MariaDB é basicamente igual ao do MySQL; você pode ajustar a forma de exibição na interface na configuração do campo.

Os mapeamentos comuns são os seguintes:

| Tipo de campo do MariaDB | NocoBase Field type | Field interface disponíveis |
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

Os tipos de campo do MariaDB não compatíveis serão exibidos separadamente na configuração dos campos. Esses campos só poderão ser usados no NocoBase como campos comuns após o desenvolvimento de uma adaptação compatível.

:::

Para obter mais configurações gerais, consulte [Introdução à fonte de dados principal](./index.md).
