---
pkg: "@nocobase/plugin-data-source-manager"
title: "Primäre Datenquelle – PostgreSQL"
description: "Erfahren Sie mehr über unterstützte Versionen, Plugin-Installation, Verwendung und Feldzuordnung bei der Verwendung von PostgreSQL als NocoBase-Hauptdatenbank."
keywords: "Primäre Datenquelle,PostgreSQL,Hauptdatenbank,Feldzuordnung,NocoBase"
---

# PostgreSQL

## Einführung

PostgreSQL kann als Hauptdatenbank von NocoBase verwendet werden, um die Systemtabellendaten von NocoBase und die Geschäftsdaten der primären Datenquelle zu speichern. Die Hauptdatenbank wird bei der Bereitstellung von NocoBase konfiguriert und kann nach dem Start der Anwendung nicht gelöscht werden.

| Konfigurationselement | Beschreibung |
| --- | --- |
| Unterstützte Versionen | >= 10. |
| Kommerzielle Versionen | Community-, Standard-, Professional- und Enterprise-Edition werden unterstützt. |
| Datenbanktyp | PostgreSQL. |

PostgreSQL unterstützt die Vererbung von Tabellen und eignet sich für Szenarien, in denen eine Vererbung von Datenmodellen erforderlich ist.

## Plugin-Installation

PostgreSQL ist eine integrierte Funktion und muss nicht separat als Plugin installiert werden.

## Verwendung

1. Wählen Sie bei der Bereitstellung von NocoBase in der Datenbankverbindungskonfiguration die entsprechenden Verbindungsparameter für PostgreSQL aus oder geben Sie sie ein.
2. Öffnen Sie nach dem Start von NocoBase unter „Datenquellenverwaltung“ die Datenquelle „Main“, um die Tabellen und Felder der Hauptdatenbank zu verwalten.
3. Wenn Sie bereits in der Datenbank vorhandene Tabellen einbinden möchten, können Sie auf der Verwaltungsseite der Hauptdatenbank die Option „Aus Datenbank synchronisieren“ verwenden.
4. Bei der Konfiguration von Tabellenfeldern können Sie das Verzeichnis [Datentabellen](../data-modeling/collection.md) und [Felder](../data-modeling/collection-fields/index.md) als Referenz für die Auswahl von Feldtypen und Feldkomponenten verwenden.

## Feldtypzuordnung

Beim Erstellen von Feldern über die NocoBase-Oberfläche in der Hauptdatenbank erstellt NocoBase anhand der Feldkonfiguration die entsprechenden PostgreSQL-Felder. Beim Einbinden vorhandener Tabellen über „Aus Datenbank synchronisieren“ ordnet NocoBase die PostgreSQL-Feldtypen automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Die Darstellungsweise in der Benutzeroberfläche kann in der Feldkonfiguration angepasst werden.

Häufige Zuordnungen:

| PostgreSQL-Feldtyp | NocoBase Field type | Verfügbare Field interface |
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

:::warning Hinweis

Nicht unterstützte PostgreSQL-Feldtypen werden in der Feldkonfiguration separat angezeigt. Diese Felder können erst nach der Entwicklung eines entsprechenden Adapters als reguläre Felder in NocoBase verwendet werden.

:::

Weitere allgemeine Konfigurationen finden Sie unter [Einführung in die primäre Datenquelle](./index.md).