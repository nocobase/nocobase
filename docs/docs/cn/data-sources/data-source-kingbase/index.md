---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "主数据源 - KingbaseES"
description: "了解 KingbaseES 作为 NocoBase 主数据库时的支持版本、插件安装、环境变量、Docker 部署、使用说明和字段映射。"
keywords: "主数据源,人大金仓,KingbaseES,主数据库,PostgreSQL 兼容模式,字段映射,NocoBase"
---

# KingbaseES

## 介绍

KingbaseES 可以作为 NocoBase 的主数据库使用，用于存储 NocoBase 系统表数据和主数据源中的业务数据。主数据库在部署 NocoBase 时配置，应用运行后不可删除。

如果要把已有 KingbaseES 数据库作为外部数据库接入，请参考[外部 KingbaseES](../external/kingbase.md)。

| 配置项 | 说明 |
| --- | --- |
| 支持版本 | >= V9。 |
| 商业版本 | 专业版、企业版支持。 |
| 数据库类型 | PostgreSQL 兼容模式。 |

:::warning 注意

目前只支持 PostgreSQL 兼容模式运行的 KingbaseES 数据库。

:::

## 安装

### 作为主数据库使用

安装流程参考[安装 NocoBase 应用](/ai/install-nocobase-app)，区别主要在于数据库环境变量。

#### 环境变量

修改 `.env` 文件，添加或修改以下数据库相关环境变量：

```bash
# 根据实际情况调整 DB 相关参数
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Docker 安装

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

#### 使用 create-nocobase-app 安装

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### 作为外部数据库使用

如果要把 KingbaseES 作为外部数据库接入，配置入口、连接参数和同步规则请参考[外部 KingbaseES](../external/kingbase.md)。

## 使用说明

KingbaseES 主数据源兼容 PostgreSQL 模式，日常管理方式可以参考[主数据源 PostgreSQL](../main/postgresql.md)。

1. 部署 NocoBase 时，在数据库连接配置中选择或填写 KingbaseES 对应的连接参数。
2. 启动 NocoBase 后，在「数据源管理」中进入「Main」数据源，可以管理主数据库中的数据表和字段。
3. 如需接入数据库中已经存在的表，可以在主数据库管理页使用「从数据库同步」。
4. 配置数据表字段时，可以参考[数据表](../data-modeling/collection.md)、[字段](../data-modeling/collection-fields/index.md)目录选择字段类型和字段组件。

## 字段类型映射

在主数据库中，通过 NocoBase 页面创建字段时，NocoBase 会根据字段配置创建对应的 KingbaseES 字段。通过「从数据库同步」接入已有表时，NocoBase 会按 PostgreSQL 兼容逻辑识别 KingbaseES 字段类型，自动映射到合适的 Field type 和 Field interface。你可以在字段配置中调整界面展示方式。

常见映射如下：

| KingbaseES 字段类型 | NocoBase Field type | 可选 Field interface |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `SMALLINT`、`INTEGER` | `integer`、`sort` | Integer、Sort、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `REAL`、`DOUBLE PRECISION` | `float` | Number、Percent。 |
| `DECIMAL`、`NUMERIC` | `decimal` | Number、Percent、Currency。 |
| `VARCHAR`、`CHAR` | `string`、`uuid`、`nanoid`、`encryption`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `UUID` | `uuid` | UUID。 |
| `JSON`、`JSONB` | `json`、`array` | JSON。 |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME WITHOUT TIME ZONE` | `time` | Time。 |
| `POINT`、`PATH`、`POLYGON`、`CIRCLE` | `json` | JSON。 |
| `ARRAY` | `array` | Multiple select、Checkbox group、JSON。 |

:::warning 注意

不支持的 KingbaseES 字段类型会在字段配置中单独展示。这类字段需要开发适配后才能在 NocoBase 中作为普通字段使用。

:::

更多通用配置见[主数据源介绍](./index.md)。
