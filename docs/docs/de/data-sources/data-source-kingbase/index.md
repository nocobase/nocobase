---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Primärdatenquelle – KingbaseES"
description: "Erfahren Sie mehr über unterstützte Versionen, Plugin-Installation, Umgebungsvariablen, Docker-Bereitstellung, Nutzungshinweise und Feldzuordnungen bei der Verwendung von KingbaseES als NocoBase-Primärdatenbank."
keywords: "Primärdatenquelle,人大金仓,KingbaseES,Primärdatenbank,PostgreSQL-Kompatibilitätsmodus,Feldzuordnung,NocoBase"
---

# KingbaseES

## Einführung

KingbaseES kann als Primärdatenbank von NocoBase verwendet werden, um die Systemtabellendaten von NocoBase sowie die Geschäftsdaten der Primärdatenquelle zu speichern. Die Primärdatenbank wird bei der Bereitstellung von NocoBase konfiguriert und kann nach dem Start der Anwendung nicht gelöscht werden.

Wenn Sie eine vorhandene KingbaseES-Datenbank als externe Datenbank anbinden möchten, lesen Sie bitte [Externe KingbaseES](../external/kingbase.md).

| Konfigurationselement | Beschreibung |
| --- | --- |
| Unterstützte Versionen | >= V9. |
| Kommerzielle Versionen | Unterstützt in der Professional- und Enterprise-Edition. |
| Datenbanktyp | PostgreSQL-Kompatibilitätsmodus. |

:::warning Hinweis

Derzeit werden nur KingbaseES-Datenbanken unterstützt, die im PostgreSQL-Kompatibilitätsmodus betrieben werden.

:::

## Installation

### Als Primärdatenbank verwenden

Weitere Informationen zum Installationsablauf finden Sie unter [NocoBase-Anwendung installieren](/ai/install-nocobase-app). Der wesentliche Unterschied betrifft die Datenbank-Umgebungsvariablen.

#### Umgebungsvariablen

Bearbeiten Sie die Datei `.env` und fügen Sie die folgenden datenbankbezogenen Umgebungsvariablen hinzu bzw. ändern Sie sie:

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

Wenn Sie KingbaseES als externe Datenbank anbinden möchten, finden Sie Informationen zum Konfigurationseinstieg, zu den Verbindungsparametern und zu den Synchronisierungsregeln unter [Externe KingbaseES](../external/kingbase.md).

## Nutzungshinweise

Die KingbaseES-Primärdatenquelle ist mit dem PostgreSQL-Modus kompatibel. Informationen zur täglichen Verwaltung finden Sie unter [PostgreSQL als Primärdatenquelle](../main/postgresql.md).

1. Wählen Sie bei der Bereitstellung von NocoBase in der Datenbankverbindungskonfiguration die entsprechenden Verbindungsparameter für KingbaseES aus bzw. tragen Sie sie ein.
2. Öffnen Sie nach dem Start von NocoBase unter „Datenquellenverwaltung“ die Datenquelle „Main“, um die Datentabellen und Felder der Primärdatenbank zu verwalten.
3. Wenn Sie bereits in der Datenbank vorhandene Tabellen anbinden möchten, können Sie auf der Verwaltungsseite der Primärdatenbank die Funktion „Aus Datenbank synchronisieren“ verwenden.
4. Bei der Konfiguration von Datentabellenfeldern können Sie im Verzeichnis [Datentabellen](../data-modeling/collection.md) und [Felder](../data-modeling/collection-fields/index.md) passende Feldtypen und Feldkomponenten auswählen.

## Feldtypzuordnung

Wenn Sie in der Primärdatenbank über die NocoBase-Oberfläche ein Feld erstellen, legt NocoBase anhand der Feldkonfiguration das entsprechende KingbaseES-Feld an. Wenn Sie eine vorhandene Tabelle über „Aus Datenbank synchronisieren“ anbinden, erkennt NocoBase die KingbaseES-Feldtypen gemäß der PostgreSQL-Kompatibilitätslogik und ordnet sie automatisch dem passenden Field type und der passenden Field interface zu. Die Darstellungsweise in der Benutzeroberfläche können Sie in der Feldkonfiguration anpassen.

Häufige Zuordnungen:

| KingbaseES-Feldtyp | NocoBase Field type | Verfügbare Field interface |
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

:::warning Hinweis

Nicht unterstützte KingbaseES-Feldtypen werden in der Feldkonfiguration separat angezeigt. Diese Felder können erst nach entsprechender Entwicklungsanpassung in NocoBase als normale Felder verwendet werden.

:::

Weitere allgemeine Konfigurationen finden Sie unter [Einführung in Primärdatenquellen](./index.md).
