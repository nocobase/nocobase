---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Основной источник данных — KingbaseES"
description: "Информация о поддерживаемых версиях KingbaseES в качестве основной базы данных NocoBase, установке плагина, переменных окружения, развёртывании в Docker, использовании и сопоставлении типов полей."
keywords: "основной источник данных,人大金仓,KingbaseES,основная база данных,режим совместимости с PostgreSQL,сопоставление полей,NocoBase"
---

# KingbaseES

## Введение

KingbaseES можно использовать в качестве основной базы данных NocoBase для хранения данных системных таблиц NocoBase и бизнес-данных основного источника данных. Основная база данных настраивается при развёртывании NocoBase и не может быть удалена после запуска приложения.

Если необходимо подключить существующую базу данных KingbaseES в качестве внешней базы данных, см. [Внешний KingbaseES](../external/kingbase.md).

| Параметр конфигурации | Описание |
| --- | --- |
| Поддерживаемые версии | >= V9. |
| Коммерческие версии | Поддерживаются профессиональная и корпоративная версии. |
| Тип базы данных | Режим совместимости с PostgreSQL. |

:::warning Внимание

В настоящее время поддерживаются только базы данных KingbaseES, работающие в режиме совместимости с PostgreSQL.

:::

## Установка

### Использование в качестве основной базы данных

Процесс установки описан в разделе [Установка приложения NocoBase](/ai/install-nocobase-app); основное отличие заключается в переменных окружения базы данных.

#### Переменные окружения

Измените файл `.env` и добавьте или измените следующие переменные окружения, связанные с базой данных:

```bash
# 根据实际情况调整 DB 相关参数
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Установка Docker

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

#### Установка с помощью create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Использование в качестве внешней базы данных

Если необходимо подключить KingbaseES в качестве внешней базы данных, сведения о точке входа для настройки, параметрах подключения и правилах синхронизации приведены в разделе [Внешний KingbaseES](../external/kingbase.md).

## Инструкции по использованию

Основной источник данных KingbaseES совместим с режимом PostgreSQL. Для повседневного управления можно обратиться к разделу [Основной источник данных PostgreSQL](./postgresql.md).

1. При развёртывании NocoBase выберите или укажите параметры подключения KingbaseES в настройках подключения к базе данных.
2. После запуска NocoBase откройте источник данных «Main» в разделе «Управление источниками данных», где можно управлять таблицами и полями основной базы данных.
3. Если необходимо подключить уже существующие в базе данных таблицы, на странице управления основной базой данных можно использовать функцию «Синхронизация из базы данных».
4. При настройке полей таблицы можно обратиться к каталогам [Таблицы данных](../data-modeling/collection.md) и [Поля](../data-modeling/collection-fields/index.md), чтобы выбрать типы полей и компоненты полей.

## Сопоставление типов полей

При создании полей на странице NocoBase в основной базе данных NocoBase создаёт соответствующие поля KingbaseES на основе конфигурации поля. При подключении существующих таблиц с помощью функции «Синхронизация из базы данных» NocoBase распознаёт типы полей KingbaseES по логике совместимости с PostgreSQL и автоматически сопоставляет их с подходящими типами полей и интерфейсами полей. Способ отображения в интерфейсе можно изменить в настройках поля.

Распространённые варианты сопоставления:

| Тип поля KingbaseES | Тип поля NocoBase | Доступные интерфейсы поля |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`、`INTEGER` | `integer`、`sort` | Integer, Sort, Select, Radio group. |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `REAL`、`DOUBLE PRECISION` | `float` | Number, Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`、`CHAR` | `string`、`uuid`、`nanoid`、`encryption`、`datetimeNoTz` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json`、`array` | JSON. |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`、`date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME WITHOUT TIME ZONE` | `time` | Time. |
| `POINT`、`PATH`、`POLYGON`、`CIRCLE` | `json` | JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group, JSON. |

:::warning Внимание

Неподдерживаемые типы полей KingbaseES будут отдельно отображаться в настройках полей. Для использования таких полей в NocoBase в качестве обычных необходимо предварительно разработать адаптацию.

:::

Дополнительные общие настройки см. в разделе [Обзор основного источника данных](./index.md).
