---
pkg: "@nocobase/plugin-data-source-manager"
title: "Primäre Datenquelle – MariaDB"
description: "Erfahren Sie mehr über unterstützte Versionen, Plugin-Installation, Verwendung und Feldzuordnungen bei der Verwendung von MariaDB als primärer NocoBase-Datenbank."
keywords: "Primäre Datenquelle,MariaDB,Primärdatenbank,Feldzuordnung,NocoBase"
---

# MariaDB

## Einführung

MariaDB kann als primäre Datenbank von NocoBase verwendet werden, um die Systemtabellendaten von NocoBase sowie die Geschäftsdaten der primären Datenquelle zu speichern. Die primäre Datenbank wird bei der Bereitstellung von NocoBase konfiguriert und kann nach dem Start der Anwendung nicht gelöscht werden.

| Konfiguration | Beschreibung |
| --- | --- |
| Unterstützte Versionen | >= 10.9. |
| Kommerzielle Versionen | Community-, Standard-, Professional- und Enterprise-Version werden unterstützt. |
| Datenbanktyp | MariaDB. |

MariaDB ähnelt MySQL und eignet sich als primäre Datenbank für allgemeine Geschäftssysteme.

## Plugin-Installation

MariaDB ist bereits integriert und erfordert keine separate Plugin-Installation.

## Verwendung

1. Wählen Sie bei der Bereitstellung von NocoBase in der Datenbankverbindungskonfiguration MariaDB aus oder geben Sie die entsprechenden Verbindungsparameter ein.
2. Öffnen Sie nach dem Start von NocoBase unter „Datenquellenverwaltung“ die Datenquelle „Main“, um die Tabellen und Felder in der primären Datenbank zu verwalten.
3. Wenn Sie bereits in der Datenbank vorhandene Tabellen anbinden möchten, können Sie auf der Verwaltungsseite der primären Datenbank die Funktion „Aus Datenbank synchronisieren“ verwenden.
4. Bei der Konfiguration von Tabellenfeldern können Sie sich am Verzeichnis [Datentabellen](../data-modeling/collection.md) und [Felder](../data-modeling/collection-fields/index.md) orientieren, um Feldtypen und Feldkomponenten auszuwählen.

## Feldtypzuordnung

Beim Erstellen von Feldern über die NocoBase-Oberfläche in der primären Datenbank erstellt NocoBase auf Grundlage der Feldkonfiguration die entsprechenden MariaDB-Felder. Beim Anbinden vorhandener Tabellen über „Aus Datenbank synchronisieren“ ordnet NocoBase die MariaDB-Feldtypen automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Die gängigen Feldzuordnungen von MariaDB entsprechen im Wesentlichen denen von MySQL. Die Darstellungsweise in der Oberfläche kann in der Feldkonfiguration angepasst werden.

Die gängigen Zuordnungen sind:

| MariaDB-Feldtyp | NocoBase Field type | Verfügbare Field interface |
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

Nicht unterstützte MariaDB-Feldtypen werden in der Feldkonfiguration separat angezeigt. Diese Felder müssen zunächst durch eine entsprechende Entwicklung angepasst werden, bevor sie in NocoBase als normale Felder verwendet werden können.

:::

Weitere allgemeine Konfigurationen finden Sie unter [Einführung in primäre Datenquellen](./index.md).
