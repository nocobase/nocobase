---
pkg: "@nocobase/plugin-data-source-manager"
title: "Primäre Datenquelle – MySQL"
description: "Erfahren Sie mehr über unterstützte Versionen, Plugin-Installation, Verwendung und Feldzuordnung bei der Verwendung von MySQL als primäre NocoBase-Datenbank."
keywords: "Primäre Datenquelle,MySQL,Primärdatenbank,Feldzuordnung,NocoBase"
---

# MySQL

## Einführung

MySQL kann als primäre Datenbank von NocoBase verwendet werden, um die Systemtabellen von NocoBase und die Geschäftsdaten der primären Datenquelle zu speichern. Die primäre Datenbank wird bei der Bereitstellung von NocoBase konfiguriert und kann nach dem Start der Anwendung nicht gelöscht werden.

| Konfigurationselement | Beschreibung |
| --- | --- |
| Unterstützte Version | >= 8.0.17. |
| Kommerzielle Versionen | Unterstützt von Community-, Standard-, Professional- und Enterprise-Version. |
| Datenbanktyp | MySQL. |

MySQL eignet sich als primäre Datenbank für allgemeine Geschäftssysteme.

## Plugin-Installation

MySQL ist eine integrierte Funktion und erfordert keine separate Plugin-Installation.

## Verwendung

1. Bei der Bereitstellung von NocoBase wählen Sie in der Konfiguration der Datenbankverbindung die entsprechenden Verbindungsparameter für MySQL aus oder geben diese ein.
2. Starten Sie NocoBase und öffnen Sie anschließend unter „Datenquellenverwaltung“ die Datenquelle „Main“, um die Tabellen und Felder der primären Datenbank zu verwalten.
3. Wenn Sie bereits in der Datenbank vorhandene Tabellen anbinden möchten, können Sie auf der Verwaltungsseite der primären Datenbank die Option „Aus Datenbank synchronisieren“ verwenden.
4. Bei der Konfiguration von Tabellenfeldern können Sie sich am Verzeichnis [Datentabellen](../data-modeling/collection.md) und [Felder](../data-modeling/collection-fields/index.md) orientieren, um Feldtypen und Feldkomponenten auszuwählen.

## Feldtypzuordnung

Beim Erstellen von Feldern über die NocoBase-Oberfläche in der primären Datenbank erstellt NocoBase anhand der Feldkonfiguration die entsprechenden MySQL-Felder. Beim Anbinden vorhandener Tabellen über „Aus Datenbank synchronisieren“ ordnet NocoBase die MySQL-Feldtypen automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Die Darstellungsweise in der Benutzeroberfläche kann in der Feldkonfiguration angepasst werden.

Häufige Zuordnungen:

| MySQL-Feldtyp | NocoBase Field type | Verfügbare Field interface |
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

:::warning Hinweis

Nicht unterstützte MySQL-Feldtypen werden in der Feldkonfiguration separat angezeigt. Diese Felder können erst nach einer entsprechenden Anpassung durch die Entwicklung in NocoBase als gewöhnliche Felder verwendet werden.

:::

Weitere allgemeine Konfigurationen finden Sie unter [Einführung in die primäre Datenquelle](./index.md).
