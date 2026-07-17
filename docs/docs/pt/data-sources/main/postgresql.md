---
pkg: "@nocobase/plugin-data-source-manager"
title: "Fonte de dados principal - PostgreSQL"
description: "Conheça as versões compatíveis, a instalação do plugin, as instruções de uso e o mapeamento de campos do PostgreSQL como banco de dados principal do NocoBase."
keywords: "fonte de dados principal,PostgreSQL,banco de dados principal,mapeamento de campos,NocoBase"
---

# PostgreSQL

## Introdução

O PostgreSQL pode ser usado como banco de dados principal do NocoBase, para armazenar os dados das tabelas do sistema do NocoBase e os dados de negócio da fonte de dados principal. O banco de dados principal é configurado durante a implantação do NocoBase e não pode ser excluído após a execução da aplicação.

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | >= 10. |
| Versões comerciais | Compatível com as edições Community, Standard, Professional e Enterprise. |
| Tipo de banco de dados | PostgreSQL. |

O PostgreSQL oferece suporte à herança de tabelas, sendo adequado para cenários que exigem herança de modelos de dados.

## Instalação do plugin

O PostgreSQL é uma funcionalidade integrada e não requer a instalação de um plugin separado.

## Instruções de uso

1. Ao implantar o NocoBase, selecione ou preencha os parâmetros de conexão correspondentes ao PostgreSQL na configuração de conexão do banco de dados.
2. Após iniciar o NocoBase, acesse a fonte de dados «Main» em «Gerenciamento de fontes de dados» para gerenciar as tabelas e os campos do banco de dados principal.
3. Para conectar tabelas que já existem no banco de dados, use «Sincronizar do banco de dados» na página de gerenciamento do banco de dados principal.
4. Ao configurar os campos de uma tabela, consulte os diretórios [tabela de dados](../data-modeling/collection.md) e [campo](../data-modeling/collection-fields/index.md) para escolher os tipos de campo e os componentes de campo.

## Mapeamento de tipos de campo

No banco de dados principal, ao criar campos por meio da página do NocoBase, o NocoBase criará os campos correspondentes do PostgreSQL com base na configuração dos campos. Ao conectar tabelas existentes usando «Sincronizar do banco de dados», o NocoBase mapeará automaticamente os tipos de campo do PostgreSQL para o Field type e o Field interface adequados. Você pode ajustar a forma de exibição na interface na configuração do campo.

Os mapeamentos comuns são os seguintes:

| Tipo de campo do PostgreSQL | NocoBase Field type | Field interface disponíveis |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`、`INTEGER`、`SERIAL`、`SMALLSERIAL` | `integer`、`boolean`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `BIGINT`、`BIGSERIAL` | `bigInt`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group, Unix timestamp, Created at, Updated at. |
| `REAL` | `float` | Number, Percent. |
| `DOUBLE PRECISION` | `double` | Number, Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`、`CHAR` | `string`、`password`、`uuid`、`nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text`、`json` | Textarea, Markdown, Vditor, Rich text, URL, JSON. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json` | JSON. |
| `TIMESTAMP` | `date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `POINT`、`LINESTRING`、`POLYGON`、`CIRCLE` | `point`、`lineString`、`polygon`、`circle` | Point, Line string, Polygon, Circle, JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group. |

:::warning Atenção

Os tipos de campo do PostgreSQL não compatíveis serão exibidos separadamente na configuração dos campos. Esses campos só poderão ser usados no NocoBase como campos comuns após a adaptação por meio de desenvolvimento.

:::

Para obter mais configurações gerais, consulte [Introdução à fonte de dados principal](./index.md).
