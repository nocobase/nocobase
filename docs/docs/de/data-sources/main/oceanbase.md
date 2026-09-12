---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Primärdatenquelle – OceanBase"
description: "Erfahren Sie mehr über die unterstützten Versionen, die Plugin-Installation, die Verwendung und die Feldzuordnung bei der Verwendung von OceanBase als Primärdatenbank von NocoBase."
keywords: "Primärdatenquelle,OceanBase,Primärdatenbank,Feldzuordnung,NocoBase"
---

# OceanBase

## Einführung

OceanBase kann als Primärdatenbank von NocoBase verwendet werden, um die Systemtabellendaten von NocoBase und die Geschäftsdaten der Primärdatenquelle zu speichern. Die Primärdatenbank wird bei der Bereitstellung von NocoBase konfiguriert und kann nach dem Start der Anwendung nicht gelöscht werden.

| Konfigurationselement | Beschreibung |
| --- | --- |
| Unterstützte Version | >= 4.3. |
| Kommerzielle Version | Wird von der Enterprise Edition unterstützt. |
| Datenbanktyp | MySQL-Kompatibilitätsmodus. |

:::warning Hinweis

Bei der Verwendung von OceanBase als Primärdatenbank wird nur der MySQL-Kompatibilitätsmodus unterstützt.

:::

## Plugin-Installation

OceanBase wird von `@nocobase/plugin-data-source-oceanbase` bereitgestellt und erfordert eine kommerzielle Lizenz.

## Verwendung

1. Wählen Sie bei der Bereitstellung von NocoBase in der Datenbankverbindungskonfiguration die entsprechenden Verbindungsparameter für OceanBase aus oder geben Sie sie ein.
2. Öffnen Sie nach dem Start von NocoBase unter „Datenquellenverwaltung“ die Datenquelle „Main“, um die Datentabellen und Felder in der Primärdatenbank zu verwalten.
3. Wenn Sie bereits in der Datenbank vorhandene Tabellen anbinden möchten, können Sie auf der Verwaltungsseite der Primärdatenbank die Option „Aus Datenbank synchronisieren“ verwenden.
4. Bei der Konfiguration von Datentabellenfeldern können Sie im Verzeichnis [Datentabellen](../data-modeling/collection.md) und [Felder](../data-modeling/collection-fields/index.md) die Feldtypen und Feldkomponenten auswählen.

## Feldtypzuordnung

Beim Erstellen von Feldern über die NocoBase-Oberfläche in der Primärdatenbank erstellt NocoBase anhand der Feldkonfiguration die entsprechenden OceanBase-Felder. Beim Anbinden vorhandener Tabellen über „Aus Datenbank synchronisieren“ erkennt NocoBase die OceanBase-Feldtypen gemäß der MySQL-Kompatibilitätslogik und ordnet sie automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Die Darstellungsweise in der Oberfläche kann in der Feldkonfiguration angepasst werden.

Häufige Zuordnungen:

| OceanBase-Feldtyp | NocoBase Field type | Verfügbare Field interface |
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

:::warning Hinweis

Nicht unterstützte OceanBase-Feldtypen werden in der Feldkonfiguration separat angezeigt. Diese Felder können erst nach einer entsprechenden Anpassung durch die Entwicklung als gewöhnliche Felder in NocoBase verwendet werden.

:::

Weitere allgemeine Konfigurationen finden Sie unter [Einführung in die Primärdatenquelle](./index.md).
