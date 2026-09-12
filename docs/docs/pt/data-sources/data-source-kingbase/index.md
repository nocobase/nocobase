---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Fonte de dados principal - KingbaseES"
description: "Conheça as versões compatíveis, a instalação do plugin, as variáveis de ambiente, a implantação com Docker, as instruções de uso e o mapeamento de campos ao usar o KingbaseES como banco de dados principal do NocoBase."
keywords: "fonte de dados principal,KingbaseES,KingbaseES,banco de dados principal,modo compatível com PostgreSQL,mapeamento de campos,NocoBase"
---

# KingbaseES

## Introdução

O KingbaseES pode ser usado como banco de dados principal do NocoBase para armazenar os dados das tabelas do sistema NocoBase e os dados de negócio da fonte de dados principal. O banco de dados principal é configurado durante a implantação do NocoBase e não pode ser excluído depois que a aplicação estiver em execução.

Para conectar um banco de dados KingbaseES existente como banco de dados externo, consulte [KingbaseES externo](../external/kingbase.md).

| Item de configuração | Descrição |
| --- | --- |
| Versões compatíveis | >= V9. |
| Versões comerciais | Compatível com as edições Professional e Enterprise. |
| Tipo de banco de dados | Modo compatível com PostgreSQL. |

:::warning Observação

Atualmente, só são compatíveis os bancos de dados KingbaseES executados no modo compatível com PostgreSQL.

:::

## Instalação

### Usar como banco de dados principal

Consulte o processo de [instalação da aplicação NocoBase](/ai/install-nocobase-app). A principal diferença está nas variáveis de ambiente do banco de dados.

#### Variáveis de ambiente

Modifique o arquivo `.env` e adicione ou altere as seguintes variáveis de ambiente relacionadas ao banco de dados:

```bash
# 根据实际情况调整 DB 相关参数
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Instalação com Docker

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - kingbase
    environment:
      # 用于生成用户 token 等内容的应用密钥。
      # 修改 APP_KEY 会导致旧 token 失效，请使用随机字符串并妥善保存。
      - APP_KEY=your-secret-key
      # 数据库类型
      - DB_DIALECT=kingbase
      # 数据库地址，如果使用已有数据库服务，可以替换为对应 IP。
      - DB_HOST=kingbase
      - DB_PORT=54321
      # 数据库名称
      - DB_DATABASE=kingbase
      # 数据库用户
      - DB_USER=nocobase
      # 数据库密码
      - DB_PASSWORD=nocobase
      # 时区
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase 测试服务，仅用于本地体验。
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # Must be set to no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # 仅支持 pg 模式
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### Instalação usando create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Usar como banco de dados externo

Para conectar o KingbaseES como banco de dados externo, consulte [KingbaseES externo](../external/kingbase.md) para obter informações sobre a entrada de configuração, os parâmetros de conexão e as regras de sincronização.

## Instruções de uso

A fonte de dados principal KingbaseES é compatível com o modo PostgreSQL. Para a gestão diária, consulte [Fonte de dados principal PostgreSQL](../main/postgresql.md).

1. Ao implantar o NocoBase, selecione ou preencha os parâmetros de conexão correspondentes ao KingbaseES na configuração da conexão do banco de dados.
2. Depois de iniciar o NocoBase, acesse a fonte de dados «Main» em «Gerenciamento de fontes de dados» para gerenciar as tabelas e os campos do banco de dados principal.
3. Para conectar tabelas que já existem no banco de dados, use «Sincronizar do banco de dados» na página de gerenciamento do banco de dados principal.
4. Ao configurar os campos das tabelas, consulte os catálogos [Tabela de dados](../data-modeling/collection.md) e [Campo](../data-modeling/collection-fields/index.md) para selecionar os tipos de campo e os componentes de campo.

## Mapeamento de tipos de campo

No banco de dados principal, ao criar campos por meio de uma página do NocoBase, o NocoBase criará os campos correspondentes do KingbaseES com base na configuração do campo. Ao conectar tabelas existentes usando «Sincronizar do banco de dados», o NocoBase identificará os tipos de campo do KingbaseES de acordo com a lógica de compatibilidade com PostgreSQL e os mapeará automaticamente para o Field type e o Field interface adequados. Você pode ajustar a forma de exibição na configuração do campo.

Os mapeamentos comuns são os seguintes:

| Tipo de campo do KingbaseES | Field type do NocoBase | Field interface disponível |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox、Switch. |
| `SMALLINT`、`INTEGER` | `integer`、`sort` | Integer、Sort、Select、Radio group. |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at. |
| `REAL`、`DOUBLE PRECISION` | `float` | Number、Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number、Percent、Currency. |
| `VARCHAR`、`CHAR` | `string`、`uuid`、`nanoid`、`encryption`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID. |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json`、`array` | JSON. |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date、Time、Created at、Updated at. |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`、`date` | Date、Time、Created at、Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME WITHOUT TIME ZONE` | `time` | Time. |
| `POINT`、`PATH`、`POLYGON`、`CIRCLE` | `json` | JSON. |
| `ARRAY` | `array` | Multiple select、Checkbox group、JSON. |

:::warning Observação

Os tipos de campo do KingbaseES não compatíveis serão exibidos separadamente na configuração dos campos. Esses campos só poderão ser usados como campos comuns no NocoBase após o desenvolvimento de uma adaptação.

:::

Para obter mais configurações gerais, consulte [Introdução às fontes de dados principais](./index.md).
