---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Externe Datenquelle – OceanBase"
description: "Erfahren Sie, wie Sie OceanBase als externe Datenbank in NocoBase integrieren, einschließlich unterstützter Versionen, des MySQL-Kompatibilitätsmodus, der Verbindungskonfiguration, des Tabellenumfangs, der Berechtigungen und der Feldzuordnung."
keywords: "Externe Datenquelle,OceanBase,externe Datenbank,MySQL-Kompatibilitätsmodus,Feldzuordnung,NocoBase"
---

# OceanBase

## Einführung

OceanBase kann als externe Datenbank in NocoBase integriert werden. Nach der Integration liest NocoBase die Tabellen, Felder und Ansichten aus OceanBase aus und verwendet sie als Datentabellen in der externen Datenquelle.

Im Gegensatz zur [Hauptdatenbank](../main/index.md) wird die tatsächliche Tabellenstruktur der externen OceanBase-Datenbank weiterhin vom ursprünglichen Geschäftssystem, Datenbankclient oder Migrationsskript verwaltet. NocoBase liest die Struktur aus, speichert Feldmetadaten und konfiguriert Seitenblöcke, Berechtigungen, Workflows und APIs.

| Konfiguration | Beschreibung |
| --- | --- |
| Unterstützte Version | OceanBase >= 4.3. |
| Kommerzielle Version | Die Enterprise Edition wird unterstützt. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-oceanbase`. |
| Datenbankmodus | Nur der MySQL-Kompatibilitätsmodus wird unterstützt. |

Die Verwendung einer externen OceanBase-Datenbank eignet sich insbesondere für folgende Szenarien:

- Integration einer Geschäftsdatenbank in einem vorhandenen OceanBase-MySQL-Tenant
- Aufbau einer Verwaltungsoberfläche mit NocoBase, ohne historische Daten zu migrieren
- Steuerung von Berechtigungen, Verarbeitung von Abläufen, Korrektur von Daten oder Darstellung von Berichten für vorhandene Tabellen
- Die Datenbankstruktur wird weiterhin von DBAs, Migrationsskripten oder dem ursprünglichen System verwaltet

:::warning Hinweis

OceanBase wird als externe Datenbank nur im MySQL-Kompatibilitätsmodus unterstützt. Wenn der Oracle-Kompatibilitätsmodus verwendet wird, kann NocoBase die Tabellenstruktur und Feldtypen mit dem aktuellen Plugin nicht auslesen.

:::

## Plugin installieren

Dieses Plugin ist ein kommerzielles Plugin. Ausführliche Informationen zur Aktivierung finden Sie im [Leitfaden zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).

## Datenquelle hinzufügen

Klicken Sie in der „Datenquellenverwaltung“ auf „Add new“, wählen Sie OceanBase aus und geben Sie anschließend die Verbindungsinformationen ein.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

Häufig verwendete Verbindungseinstellungen:

| Konfiguration | Beschreibung |
| --- | --- |
| Data source name | Bezeichner der Datenquelle zur Verwendung in Seitenblöcken, Berechtigungen, Workflows und APIs. Nach der Erstellung kann er nicht mehr geändert werden. |
| Data source display name | Der in der Benutzeroberfläche angezeigte Name der Datenquelle. Es wird empfohlen, einen für Geschäftsanwender verständlichen Namen zu verwenden, zum Beispiel „OceanBase-Geschäftsdatenbank“ oder „Berichtsdatenbank“. |
| Host / Port | Adresse und Port der OceanBase-Verbindung im MySQL-Kompatibilitätsmodus. Maßgeblich sind die tatsächlichen Einstellungen des Tenants oder Proxys. |
| Database | Name der zu verbindenden OceanBase-Datenbank. |
| Username / Password | Benutzername und Passwort für die Verbindung mit OceanBase. NocoBase kann nur auf Objekte zugreifen, für die dieses Konto Berechtigungen besitzt. Es erteilt keine Berechtigungen und liest keine privaten Objekte anderer Konten aus. |
| Table prefix | Präfix der Tabellennamen. Nach der Konfiguration liest NocoBase nur Tabellen und Ansichten, die diesem Präfix entsprechen, und erzeugt in NocoBase Tabellennamen ohne Präfix. |
| Collections / Add all collections | Steuert den Umfang der Integration. Wenn „Add all collections“ aktiviert ist, integriert NocoBase alle Tabellen und Ansichten im aktuellen Umfang. Ist die Option deaktiviert, werden nur die unter „Collections“ ausgewählten Objekte integriert. |
| Enabled the data source | Legt fest, ob diese Datenquelle aktiviert ist. Nach der Deaktivierung bleibt die Konfiguration erhalten, aber Seitenblöcke, Berechtigungen, Workflows und APIs können nicht mehr auf ihre Daten zugreifen. |

:::tip Tipp

Wenn es in OceanBase viele Objekte gibt, schränken Sie den Umfang vorzugsweise über `Database`, `Table prefix` und „Collections“ ein. Integrieren Sie nur die Tabellen und Ansichten, die die aktuelle Anwendung verwendet. Dadurch werden die anschließende Berechtigungskonfiguration, der Seitenaufbau und die Synchronisierung deutlich übersichtlicher.

:::

## Datenbanktabellen auswählen

Nach Eingabe der Verbindungsinformationen können Sie auf „Load Collections“ klicken, um die verfügbaren Tabellen und Ansichten aus OceanBase auszulesen. Das Ergebnis wird durch das Verbindungskonto, `Database`, `Table prefix` und die Konfiguration von „Collections“ beeinflusst.

Standardmäßig ist „Add all collections“ aktiviert. Das bedeutet, dass alle Tabellen und Ansichten im aktuellen Umfang integriert werden. Wenn Sie nur bestimmte Objekte integrieren möchten, deaktivieren Sie „Add all collections“ und wählen Sie anschließend die benötigten Tabellen oder Ansichten in der Liste aus.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Hinweis

Eine einzelne externe Datenquelle kann höchstens 500 Tabellen oder Ansichten auf einmal integrieren. Wenn es in OceanBase viele Objekte gibt, empfiehlt es sich, den Umfang zunächst über `Database`, `Table prefix` oder „Collections“ einzuschränken.

:::

## Synchronisieren und Felder konfigurieren

Die Tabellenstruktur der externen OceanBase-Datenbank wird auf Datenbankseite verwaltet. NocoBase erstellt in der externen OceanBase-Datenbank keine Felder, ändert keine Feldtypen und löscht keine tatsächlich vorhandenen Felder.

Wenn sich die Tabellenstruktur auf der OceanBase-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um die Metadaten von Tabellen und Feldern erneut auszulesen. Die Synchronisierung aktualisiert die in NocoBase gespeicherten Informationen zu Datentabellen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und Feldtypzuordnungen. Tatsächliche Tabellen oder Daten in OceanBase werden dabei nicht gelöscht.

Nach der Feldsynchronisierung können Sie in NocoBase die Feldtitel, den Feldtyp (Field type) und die Feldschnittstelle (Field interface) konfigurieren. Wenn Sie NocoBase-Beziehungsfelder erstellen müssen, werden die Beziehungsmetadaten ebenfalls in NocoBase gespeichert; in der OceanBase-Tabelle wird nicht automatisch ein tatsächlich vorhandenes Fremdschlüsselfeld hinzugefügt.

## Feldtypzuordnung

NocoBase erkennt die OceanBase-Feldtypen anhand der MySQL-Kompatibilitätslogik und ordnet sie automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Die Darstellungsweise in der Benutzeroberfläche kann in der Feldkonfiguration angepasst werden.

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

Nicht unterstützte OceanBase-Feldtypen werden in der Feldkonfiguration separat angezeigt. Solche Felder können erst nach einer entsprechenden Anpassung in NocoBase als normale Felder verwendet werden.

:::

## Primärschlüssel und eindeutiger Datensatzbezeichner

Für Datentabellen, die in Seitenblöcken angezeigt und bearbeitet werden sollen, wird ein Primärschlüssel oder ein eindeutiges Feld empfohlen. NocoBase verwendet vorzugsweise den Primärschlüssel als eindeutigen Datensatzbezeichner.

Wenn Sie eine Ansicht, eine Tabelle ohne Primärschlüssel oder eine Tabelle mit zusammengesetztem Primärschlüssel integrieren, müssen Sie „Record unique key“ in der Konfiguration der Datentabelle manuell festlegen. Wenn kein geeigneter eindeutiger Bezeichner verfügbar ist, können Seitenblöcke Datensätze möglicherweise nicht korrekt anzeigen, bearbeiten oder löschen.

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

## Verwandte Links

- [Externe Datenbank](./index.md) — Allgemeine Konfigurations- und Verwaltungshinweise zu externen Datenbanken
- [Datenquellenverwaltung](../data-source-manager/index.md) — Einstieg und Verwaltung von Datenquellen
- [Datentabellenfelder](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen