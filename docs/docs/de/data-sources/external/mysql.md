---
pkg: "@nocobase/plugin-data-source-external-mysql"
title: "Externe Datenquelle – MySQL"
description: "Erfahren Sie, wie Sie MySQL als externe Datenbank in NocoBase integrieren, einschließlich unterstützter Versionen, Plugin-Installation, Verbindungskonfiguration, Tabellenumfang, Berechtigungen und Feldzuordnung."
keywords: "Externe Datenquelle,MySQL,externe Datenbank,Feldzuordnung,NocoBase"
---

# MySQL

## Einführung

MySQL kann als externe Datenbank in NocoBase integriert werden. Nach der Integration liest NocoBase die Tabellen, Felder und Ansichten aus MySQL ein und verwendet sie als Datentabellen in der externen Datenquelle.

Im Gegensatz zur [Hauptdatenbank](../main/index.md) wird die tatsächliche Tabellenstruktur der externen MySQL-Datenbank weiterhin vom ursprünglichen Geschäftssystem, Datenbank-Clients oder Migrationsskripten verwaltet. NocoBase ist für das Einlesen der Struktur, das Speichern von Feldmetadaten sowie die Konfiguration von Seitenblöcken, Berechtigungen, Workflows und APIs zuständig.

| Konfigurationselement | Beschreibung |
| --- | --- |
| Unterstützte Versionen | MySQL >= 5.7. |
| Kommerzielle Versionen | Unterstützt in der Standard-, Professional- und Enterprise Edition. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-external-mysql`. |
| Kompatibles Protokoll | Verbindung über das MySQL-Protokoll. |

Geeignete Einsatzszenarien für externes MySQL:

- Integration der MySQL-Datenbank bestehender Geschäftssysteme wie ERP, MES, WMS oder CRM
- Erstellung einer Verwaltungsoberfläche mit NocoBase, ohne historische Daten zu migrieren
- Steuerung von Berechtigungen, Verarbeitung von Workflows, Korrektur von Daten oder Darstellung von Berichten für bestehende Tabellen
- Weiterverwaltung der Datenbankstruktur durch DBAs, Migrationsskripte oder das ursprüngliche System

:::warning Hinweis

Externes MySQL ist keine Systemdatenbank von NocoBase. NocoBase übernimmt weder deren Sicherung, Wiederherstellung und Migration noch Änderungen an der Tabellenstruktur.

:::

## Plugin installieren

Dieses Plugin ist ein kommerzielles Plugin. Ausführliche Informationen zur Aktivierung finden Sie im [Leitfaden zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).

## Datenquelle hinzufügen

Klicken Sie in der „Datenquellenverwaltung“ auf „Add new“, wählen Sie MySQL aus und geben Sie anschließend die Verbindungsinformationen ein.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

Häufig verwendete Verbindungseinstellungen:

| Einstellung | Beschreibung |
| --- | --- |
| Data source name | Bezeichner der Datenquelle zur Verwendung in Seitenblöcken, Berechtigungen, Workflows und APIs. Nach der Erstellung kann der Name nicht mehr geändert werden. |
| Data source display name | Der in der Benutzeroberfläche angezeigte Name der Datenquelle. Es wird empfohlen, einen für die Fachanwender verständlichen Namen zu verwenden, z. B. „ERP MySQL“ oder „Bestelldatenbank“. |
| Host / Port | Hostadresse und Port von MySQL. Der Standardport ist normalerweise `3306`. |
| Database | Name der zu verbindenden MySQL-Datenbank. |
| Username / Password | Benutzername und Passwort für die Verbindung mit MySQL. NocoBase kann nur auf Objekte zugreifen, für die dieses Konto Berechtigungen besitzt. Es erteilt keine Berechtigungen und liest keine privaten Objekte anderer Konten. |
| Table prefix | Präfix der Tabellennamen. Nach der Konfiguration liest NocoBase nur Tabellen und Ansichten ein, die diesem Präfix entsprechen, und erzeugt in NocoBase Tabellennamen ohne Präfix. |
| Collections / Add all collections | Steuert den Integrationsumfang. Wenn „Add all collections“ aktiviert ist, integriert NocoBase alle Tabellen und Ansichten im aktuellen Bereich. Bei deaktivierter Option werden nur die unter „Collections“ ausgewählten Objekte integriert. |
| Enabled the data source | Legt fest, ob diese Datenquelle aktiviert ist. Bei Deaktivierung bleibt die Konfiguration erhalten, aber Seitenblöcke, Berechtigungen, Workflows und APIs können nicht mehr auf ihre Daten zugreifen. |

:::tip Tipp

Wenn MySQL viele Objekte enthält, grenzen Sie den Umfang vorzugsweise über `Database`, `Table prefix` und „Collections“ ein. Integrieren Sie nur die Tabellen und Ansichten, die die aktuelle Anwendung verwendet. Dadurch werden die spätere Berechtigungskonfiguration, der Seitenaufbau und die laufende Synchronisierung und Wartung erheblich vereinfacht.

:::

## Datenbanktabellen auswählen

Nach Eingabe der Verbindungsinformationen können Sie auf „Load Collections“ klicken, um die in MySQL verfügbaren Tabellen und Ansichten einzulesen. Das Ergebnis hängt vom Verbindungskonto, `Database`, `Table prefix` und der Konfiguration von „Collections“ ab.

Standardmäßig ist „Add all collections“ aktiviert. Das bedeutet, dass alle Tabellen und Ansichten im aktuellen Bereich integriert werden. Wenn Sie nur bestimmte Objekte integrieren möchten, deaktivieren Sie „Add all collections“ und wählen Sie anschließend die gewünschten Tabellen oder Ansichten in der Liste aus.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Hinweis

Eine einzelne externe Datenquelle kann höchstens 500 Tabellen oder Ansichten gleichzeitig integrieren. Wenn MySQL viele Objekte enthält, empfiehlt es sich, den Umfang zunächst über `Database`, `Table prefix` oder „Collections“ einzugrenzen.

:::

## Synchronisieren und Felder konfigurieren

Die Tabellenstruktur des externen MySQL wird auf Datenbankseite verwaltet. NocoBase erstellt keine Felder in der externen MySQL-Datenbank, ändert keine Feldtypen und löscht keine tatsächlichen Felder.

Wenn sich die Tabellenstruktur auf der MySQL-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um die Metadaten der Tabellen und Felder erneut einzulesen. Die Synchronisierung aktualisiert die in NocoBase gespeicherten Informationen zu Datentabellen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und der Zuordnung von Feldtypen, löscht jedoch weder tatsächliche Tabellen noch Daten in MySQL.

Nach der Feldsynchronisierung können Sie in NocoBase die Feldbezeichnung, den Feldtyp (Field type) und die Feldkomponente (Field interface) konfigurieren. Wenn Sie NocoBase-Beziehungsfelder erstellen müssen, werden auch deren Beziehungsmetadaten in NocoBase gespeichert. In der MySQL-Tabelle werden dabei nicht automatisch tatsächliche Fremdschlüsselfelder hinzugefügt.

## Feldtypzuordnung

NocoBase ordnet MySQL-Feldtypen automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Sie können die Darstellungsweise in der Feldkonfiguration anpassen.

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

Nicht unterstützte MySQL-Feldtypen werden in der Feldkonfiguration separat angezeigt. Solche Felder können erst nach Entwicklung einer entsprechenden Anpassung in NocoBase als reguläre Felder verwendet werden.

:::

## Primärschlüssel und eindeutiger Datensatzbezeichner

Für Datentabellen, die in Seitenblöcken angezeigt und bearbeitet werden, wird ein Primärschlüssel oder ein eindeutiges Feld empfohlen. NocoBase verwendet vorzugsweise den Primärschlüssel als eindeutigen Bezeichner eines Datensatzes.

Wenn Sie eine Ansicht, eine Tabelle ohne Primärschlüssel oder eine Tabelle mit zusammengesetztem Primärschlüssel integrieren, müssen Sie in der Konfiguration der Datentabelle manuell „Record unique key“ festlegen. Wenn kein eindeutiger Bezeichner verfügbar ist, können Seitenblöcke Datensätze möglicherweise nicht korrekt anzeigen, bearbeiten oder löschen.

![20260709205547](https://static-docs.nocobase.com/20260709205547.png)
![20260709205609](https://static-docs.nocobase.com/20260709205609.png)

- [Externe Datenbank](./index.md) — Allgemeine Konfigurations- und Verwaltungshinweise zu externen Datenbanken anzeigen
- [Datenquellenverwaltung](../data-source-manager/index.md) — Einstieg und Verwaltung von Datenquellen anzeigen
- [Felder von Datentabellen](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen anzeigen