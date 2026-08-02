---
pkg: "@nocobase/plugin-data-source-external-mysql"
title: "Externe Datenquelle – MySQL"
description: "Erfahren Sie, wie Sie MySQL als externe Datenbank in NocoBase anbinden, einschließlich unterstützter Versionen, Plugin-Installation, Verbindungskonfiguration, Tabellenumfang, Berechtigungen und Feldzuordnung."
keywords: "Externe Datenquelle,MySQL,externe Datenbank,Feldzuordnung,NocoBase"
---

# MySQL

## Einführung

MySQL kann als externe Datenbank an NocoBase angebunden werden. Nach der Anbindung liest NocoBase die Tabellen, Felder und Ansichten aus MySQL ein und verwendet sie als Datentabellen in der externen Datenquelle.

Im Gegensatz zur [Hauptdatenbank](../data-source-main/index.md) wird die tatsächliche Tabellenstruktur der externen MySQL-Datenbank weiterhin vom ursprünglichen Geschäftssystem, Datenbank-Clients oder Migrationsskripten verwaltet. NocoBase liest die Struktur ein, speichert Feldmetadaten und konfiguriert Seitenblöcke, Berechtigungen, Workflows und APIs.

| Konfiguration | Beschreibung |
| --- | --- |
| Unterstützte Versionen | MySQL >= 5.7. |
| Kommerzielle Versionen | Unterstützt in der Standard-, Professional- und Enterprise-Edition. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-external-mysql`. |
| Kompatibles Protokoll | Verbindung über das MySQL-Protokoll. |

Externe MySQL-Datenbanken eignen sich insbesondere für folgende Szenarien:

- Anbindung der MySQL-Datenbank bestehender Geschäftssysteme wie ERP, MES, WMS oder CRM
- Aufbau einer Verwaltungsoberfläche mit NocoBase, ohne historische Daten zu migrieren
- Steuerung von Berechtigungen, Verarbeitung von Workflows, Korrektur von Daten oder Anzeige von Berichten für bestehende Tabellen
- Fortlaufende Verwaltung der Datenbankstruktur durch DBAs, Migrationsskripte oder das ursprüngliche System

:::warning Hinweis

Externe MySQL-Datenbanken sind keine Systemdatenbanken von NocoBase. NocoBase übernimmt weder deren Sicherung und Wiederherstellung noch Migrationen oder Änderungen an der Tabellenstruktur.

:::

## Plugin-Installation

Dieses Plugin ist ein kommerzielles Plugin. Eine ausführliche Anleitung zur Aktivierung finden Sie unter: [Leitfaden zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Datenquelle hinzufügen

Klicken Sie in der „Datenquellenverwaltung“ auf „Add new“, wählen Sie MySQL aus und geben Sie die Verbindungsinformationen ein.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

Häufig verwendete Verbindungskonfigurationen:

| Konfiguration | Beschreibung |
| --- | --- |
| Data source name | Der Bezeichner der Datenquelle, der für Verweise in Seitenblöcken, Berechtigungen, Workflows und APIs verwendet wird. Nach der Erstellung kann er nicht mehr geändert werden. |
| Data source display name | Der in der Benutzeroberfläche angezeigte Name der Datenquelle. Es wird empfohlen, einen für die Fachanwender verständlichen Namen zu verwenden, z. B. „ERP MySQL“ oder „Bestelldatenbank“. |
| Host / Port | Hostadresse und Port von MySQL. Der Standardport ist in der Regel `3306`. |
| Database | Name der MySQL-Datenbank, mit der eine Verbindung hergestellt werden soll. |
| Username / Password | Benutzername und Passwort für die Verbindung zu MySQL. NocoBase kann nur auf Objekte zugreifen, für die dieses Konto Berechtigungen besitzt. Es erteilt keine Berechtigungen und liest keine privaten Objekte anderer Konten. |
| Table prefix | Präfix der Tabellennamen. Nach der Konfiguration liest NocoBase nur Tabellen und Ansichten ein, die diesem Präfix entsprechen, und erzeugt in NocoBase Tabellennamen ohne Präfix. |
| Collections / Add all collections | Steuert den Umfang der Anbindung. Wenn „Add all collections“ aktiviert ist, bindet NocoBase alle Tabellen und Ansichten im aktuellen Bereich an. Wenn die Option deaktiviert ist, werden nur die unter „Collections“ ausgewählten Objekte angebunden. |
| Enabled the data source | Legt fest, ob diese Datenquelle aktiviert ist. Nach der Deaktivierung bleibt die Konfiguration der Datenquelle erhalten, aber Seitenblöcke, Berechtigungen, Workflows und APIs können ihre Daten nicht mehr abrufen. |

:::tip Tipp

Wenn MySQL viele Objekte enthält, sollten Sie den Umfang zunächst über `Database`, `Table prefix` und „Collections“ einschränken. Binden Sie nur die Tabellen und Ansichten an, die von der aktuellen Anwendung verwendet werden. Dadurch werden die spätere Berechtigungskonfiguration, der Seitenaufbau und die Synchronisierung deutlich überschaubarer.

:::

## Daten-Tabellen auswählen

Nachdem Sie die Verbindungsinformationen eingegeben haben, können Sie auf „Load Collections“ klicken, um die verfügbaren Tabellen und Ansichten aus MySQL zu laden. Die geladenen Ergebnisse werden durch das Verbindungskonto, `Database`, `Table prefix` und die Konfiguration von „Collections“ beeinflusst.

Standardmäßig ist „Add all collections“ aktiviert. Das bedeutet, dass alle Tabellen und Ansichten im aktuellen Bereich angebunden werden. Wenn Sie nur bestimmte Objekte anbinden möchten, deaktivieren Sie „Add all collections“ und wählen Sie anschließend die gewünschten Tabellen oder Ansichten in der Liste aus.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Hinweis

Eine einzelne externe Datenquelle kann höchstens 500 Tabellen oder Ansichten gleichzeitig anbinden. Wenn MySQL viele Objekte enthält, sollten Sie den Umfang zunächst über `Database`, `Table prefix` oder „Collections“ einschränken.

:::

## Synchronisieren und Konfigurieren von Feldern

Die Tabellenstruktur der externen MySQL-Datenbank wird auf Datenbankseite verwaltet. NocoBase erstellt keine Felder in der externen MySQL-Datenbank, ändert keine Feldtypen und löscht keine tatsächlichen Felder.

Wenn sich die Tabellenstruktur auf der MySQL-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um die Tabellen- und Feldmetadaten erneut einzulesen. Durch die Synchronisierung werden die in NocoBase gespeicherten Informationen zu Datentabellen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und Zuordnungen von Feldtypen aktualisiert. Tatsächliche Tabellen oder Daten in MySQL werden jedoch nicht gelöscht.

Nach der Feldsynchronisierung können Sie in NocoBase die Feldtitel, den Feldtyp (Field type) und die Feldkomponente (Field interface) konfigurieren. Wenn Sie NocoBase-Beziehungsfelder erstellen müssen, werden auch deren Beziehungsmetadaten in NocoBase gespeichert. In der MySQL-Tabelle wird dadurch nicht automatisch ein tatsächliches Fremdschlüsselfeld hinzugefügt.

## Zuordnung von Feldtypen

NocoBase ordnet MySQL-Feldtypen automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Die Darstellungsweise in der Benutzeroberfläche kann in der Feldkonfiguration angepasst werden.

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

Nicht unterstützte MySQL-Feldtypen werden in der Feldkonfiguration separat angezeigt. Diese Felder müssen zunächst durch eine entsprechende Anpassung unterstützt werden, bevor sie in NocoBase als normale Felder verwendet werden können.

:::

## Primärschlüssel und eindeutige Datensatzkennung

Für Datentabellen, die in Seitenblöcken angezeigt und bearbeitet werden sollen, wird ein Primärschlüssel oder ein eindeutiges Feld empfohlen. NocoBase verwendet den Primärschlüssel bevorzugt als eindeutige Kennung eines Datensatzes.

Wenn Sie eine Ansicht, eine Tabelle ohne Primärschlüssel oder eine Tabelle mit zusammengesetztem Primärschlüssel anbinden, müssen Sie in der Konfiguration der Datentabelle „Record unique key“ manuell festlegen. Wenn keine geeignete eindeutige Kennung vorhanden ist, können Seitenblöcke Datensätze möglicherweise nicht korrekt anzeigen, bearbeiten oder löschen.

![20260709205547](https://static-docs.nocobase.com/20260709205547.png)
![20260709205609](https://static-docs.nocobase.com/20260709205609.png)

- [Externe Datenbank](./index.md) — Allgemeine Konfigurations- und Verwaltungsanweisungen für externe Datenbanken anzeigen
- [Datenquellenverwaltung](../data-source-manager/index.md) — Einstieg und Verwaltung von Datenquellen anzeigen
- [Felder von Datentabellen](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen anzeigen
