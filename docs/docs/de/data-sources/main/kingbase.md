---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Hauptdatenquelle – KingbaseES"
description: "Erfahren Sie mehr über unterstützte Versionen, Plugin-Installation, Umgebungsvariablen, Docker-Bereitstellung, Verwendung und Feldzuordnung von KingbaseES als Hauptdatenbank von NocoBase."
keywords: "Hauptdatenquelle,人大金仓,KingbaseES,Hauptdatenbank,PostgreSQL-Kompatibilitätsmodus,Feldzuordnung,NocoBase"
---

# KingbaseES

## Einführung

KingbaseES kann als Hauptdatenbank von NocoBase verwendet werden, um die Systemtabellen von NocoBase sowie die Geschäftsdaten der Hauptdatenquelle zu speichern. Die Hauptdatenbank wird bei der Bereitstellung von NocoBase konfiguriert und kann nach dem Start der Anwendung nicht gelöscht werden.

Wenn Sie eine vorhandene KingbaseES-Datenbank als externe Datenbank anbinden möchten, lesen Sie bitte [Externe KingbaseES](../external/kingbase.md).

| Konfigurationselement | Beschreibung |
| --- | --- |
| Unterstützte Versionen | >= V9. |
| Kommerzielle Versionen | Unterstützt in der Professional Edition und Enterprise Edition. |
| Datenbanktyp | PostgreSQL-Kompatibilitätsmodus. |

:::warning Hinweis

Derzeit werden nur KingbaseES-Datenbanken unterstützt, die im PostgreSQL-Kompatibilitätsmodus ausgeführt werden.

:::

## Installation

### Als Hauptdatenbank verwenden

Weitere Informationen zum Installationsprozess finden Sie unter [NocoBase-Anwendung installieren](/ai/install-nocobase-app). Der wesentliche Unterschied betrifft die Umgebungsvariablen der Datenbank.

#### Umgebungsvariablen

Ändern Sie die Datei `.env` und fügen Sie die folgenden datenbankbezogenen Umgebungsvariablen hinzu oder ändern Sie sie:

```bash
# 根据实际情况调整 DB 相关参数
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Docker-Installation

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

#### Installation mit create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Als externe Datenbank verwenden

Wenn Sie KingbaseES als externe Datenbank anbinden möchten, finden Sie Informationen zu Konfigurationszugang, Verbindungsparametern und Synchronisierungsregeln unter [Externe KingbaseES](../external/kingbase.md).

## Verwendung

Die KingbaseES-Hauptdatenquelle ist mit dem PostgreSQL-Modus kompatibel. Informationen zur täglichen Verwaltung finden Sie unter [PostgreSQL als Hauptdatenquelle](./postgresql.md).

1. Wählen Sie bei der Bereitstellung von NocoBase in der Datenbankverbindungskonfiguration die entsprechenden Verbindungsparameter für KingbaseES aus oder tragen Sie sie ein.
2. Starten Sie NocoBase und öffnen Sie unter „Datenquellenverwaltung“ die Datenquelle „Main“, um die Datentabellen und Felder der Hauptdatenbank zu verwalten.
3. Wenn Sie bereits in der Datenbank vorhandene Tabellen anbinden möchten, können Sie auf der Verwaltungsseite der Hauptdatenbank die Option „Aus Datenbank synchronisieren“ verwenden.
4. Bei der Konfiguration von Feldern in Datentabellen können Sie im Verzeichnis [Datentabellen](../data-modeling/collection.md) und [Felder](../data-modeling/collection-fields/index.md) die entsprechenden Feldtypen und Feldkomponenten auswählen.

## Feldtypzuordnung

Wenn Sie in der Hauptdatenbank über die NocoBase-Oberfläche ein Feld erstellen, erstellt NocoBase anhand der Feldkonfiguration das entsprechende KingbaseES-Feld. Beim Anbinden vorhandener Tabellen über „Aus Datenbank synchronisieren“ erkennt NocoBase die Feldtypen von KingbaseES gemäß der PostgreSQL-Kompatibilitätslogik und ordnet sie automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Die Darstellungsweise in der Benutzeroberfläche kann in der Feldkonfiguration angepasst werden.

Häufige Zuordnungen:

| KingbaseES-Feldtyp | NocoBase Field type | Verfügbare Field interface |
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

:::warning Hinweis

Nicht unterstützte KingbaseES-Feldtypen werden in der Feldkonfiguration separat angezeigt. Diese Felder müssen zunächst durch eine entsprechende Implementierung angepasst werden, bevor sie in NocoBase als normale Felder verwendet werden können.

:::

Weitere allgemeine Konfigurationen finden Sie unter [Einführung in die Hauptdatenquelle](./index.md).
