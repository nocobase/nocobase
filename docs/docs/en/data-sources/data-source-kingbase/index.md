---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Main data source - KingbaseES"
description: "Learn KingbaseES version support, installation, environment variables, Docker deployment, usage, and field mapping for the NocoBase main database."
keywords: "main data source,KingbaseES,main database,PostgreSQL compatibility mode,field mapping,NocoBase"
---

# KingbaseES

## Introduction

KingbaseES can be used as the NocoBase main database. It stores NocoBase system-table data and business data in the main data source. Configure it when deploying NocoBase; it cannot be deleted after the application is running.

To connect an existing KingbaseES database as an external database, see [External KingbaseES](../external/kingbase.md).

| Setting | Description |
| --- | --- |
| Supported version | >= V9. |
| Commercial editions | Professional and Enterprise. |
| Database type | PostgreSQL compatibility mode. |

:::warning Note

Only KingbaseES databases running in PostgreSQL compatibility mode are supported.

:::

## Installation

### Use as the main database

Follow [Install a NocoBase application](/ai/install-nocobase-app). The main difference is the database environment variables.

#### Environment variables

Add or update these database variables in `.env`:

```bash
# Adjust DB parameters for your environment.
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Docker installation

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks: [nocobase]
    depends_on: [kingbase]
    environment:
      - APP_KEY=your-secret-key
      - DB_DIALECT=kingbase
      - DB_HOST=kingbase
      - DB_PORT=54321
      - DB_DATABASE=kingbase
      - DB_USER=nocobase
      - DB_PASSWORD=nocobase
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks: [nocobase]
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

`APP_KEY` is used for user tokens and similar application secrets. Changing it invalidates existing tokens; use a random value and store it safely. The `kingbase` service is intended only for local evaluation. `DB_MODE` must be `pg`.

#### Install with create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
  -e DB_HOST=localhost \
  -e DB_PORT=54321 \
  -e DB_DATABASE=kingbase \
  -e DB_USER=nocobase \
  -e DB_PASSWORD=nocobase \
  -e TZ=Asia/Shanghai
```

### Use as an external database

For configuration entry points, connection parameters, and synchronization rules when using KingbaseES as an external database, see [External KingbaseES](../external/kingbase.md).

## Usage

KingbaseES main data sources use PostgreSQL compatibility mode. For everyday management, see [PostgreSQL main data source](../main/postgresql.md).

1. Select or enter KingbaseES connection settings when deploying NocoBase.
2. After NocoBase starts, open **Data source management**, select **Main**, and manage collections and fields.
3. Use **Sync from database** to connect tables that already exist in the main database.
4. Use [Collections](../data-modeling/collection.md) and [Collection fields](../data-modeling/collection-fields/index.md) to choose Field types and Field interfaces.

## Field type mapping

When you create a field in NocoBase, NocoBase creates the corresponding KingbaseES field. When you synchronize an existing table, NocoBase applies PostgreSQL-compatible mapping to select a Field type and Field interface.

| KingbaseES type | NocoBase Field type | Available Field interfaces |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`, `INTEGER` | `integer`, `sort` | Integer, Sort, Select, Radio group. |
| `BIGINT` | `bigInt`, `snowflakeId`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `REAL`, `DOUBLE PRECISION` | `float` | Number, Percent. |
| `DECIMAL`, `NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`, `CHAR` | `string`, `uuid`, `nanoid`, `encryption`, `datetimeNoTz` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `UUID` | `uuid` | UUID. |
| `JSON`, `JSONB` | `json`, `array` | JSON. |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`, `date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME WITHOUT TIME ZONE` | `time` | Time. |
| `POINT`, `PATH`, `POLYGON`, `CIRCLE` | `json` | JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group, JSON. |

:::warning Note

Unsupported KingbaseES types are shown separately in field configuration. They require development support before they can be used as normal NocoBase fields.

:::

For common configuration, see [Main database](./index.md).
