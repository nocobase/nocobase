---
pkg: "@nocobase/plugin-data-source-external-mssql"
title: "Externe Datenquelle – MSSQL"
description: "Erfahren Sie, wie Sie MSSQL/SQL Server als externe Datenbank in NocoBase anbinden, einschließlich unterstützter Versionen, Plugin-Installation, Verbindungskonfiguration, verschlüsselter Verbindungen, Berechtigungen und Feldzuordnungen."
keywords: "Externe Datenquelle,MSSQL,SQL Server,externe Datenbank,Feldzuordnung,NocoBase"
---

# MSSQL

## Einführung

MSSQL (SQL Server) kann als externe Datenbank an NocoBase angebunden werden. Nach der Anbindung liest NocoBase die Tabellen, Felder und Ansichten aus SQL Server ein und verwendet sie als Datentabellen in der externen Datenquelle.

Im Gegensatz zur [Hauptdatenbank](../main/index.md) wird die tatsächliche Tabellenstruktur des externen MSSQL weiterhin vom ursprünglichen Geschäftssystem, Datenbank-Client oder Migrationsskript verwaltet. NocoBase liest die Struktur ein, speichert die Feldmetadaten und verwaltet die Konfiguration von Seitenblöcken, Berechtigungen, Workflows und APIs.

| Konfiguration | Beschreibung |
| --- | --- |
| Unterstützte Versionen | SQL Server 2014–2019. |
| Kommerzielle Versionen | Unterstützt in der Standard-, Professional- und Enterprise-Version. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-external-mssql`. |
| Verbindungseigenschaften | Unterstützt die Konfiguration von „Encrypt connection“ und „Trust server certificate“. |

Die Verwendung eines externen MSSQL eignet sich für folgende Szenarien:

- Anbindung von SQL-Server-Datenbanken bestehender ERP-, MES-, WMS-, CRM- und anderer Geschäftssysteme
- Aufbau einer Verwaltungsoberfläche mit NocoBase, ohne historische Daten migrieren zu müssen
- Steuerung von Berechtigungen, Verarbeitung in Workflows, Datenkorrekturen oder Berichterstellung für bestehende Tabellen
- Weitere Pflege der Datenbankstruktur durch DBAs, Migrationsskripte oder das ursprüngliche System

:::warning Hinweis

Externes MSSQL ist keine Systemdatenbank von NocoBase. NocoBase übernimmt weder deren Sicherung, Wiederherstellung und Migration noch Änderungen an der Tabellenstruktur.

:::

## Plugin installieren

Dieses Plugin ist ein kommerzielles Plugin. Ausführliche Informationen zur Aktivierung finden Sie unter: [Anleitung zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Datenquelle hinzufügen

Klicken Sie unter „Datenquellenverwaltung“ auf „Add new“, wählen Sie MSSQL aus und geben Sie anschließend die Verbindungsinformationen ein.

![20260709210022](https://static-docs.nocobase.com/20260709210022.png)

Häufig verwendete Verbindungskonfigurationen:

| Konfiguration | Beschreibung |
| --- | --- |
| Data source name | Der Bezeichner der Datenquelle, der in Seitenblöcken, Berechtigungen, Workflows und APIs verwendet wird. Nach der Erstellung kann er nicht mehr geändert werden. |
| Data source display name | Der in der Benutzeroberfläche angezeigte Name der Datenquelle. Es wird empfohlen, einen für die Fachabteilungen verständlichen Namen zu verwenden, z. B. „ERP SQL Server“ oder „Finanzdatenbank“. |
| Host / Port | Hostadresse und Port des SQL Servers. Der Standardport ist in der Regel `1433`. |
| Database | Name der SQL-Server-Datenbank, mit der eine Verbindung hergestellt werden soll. |
| Username / Password | Benutzername und Passwort für die Verbindung mit SQL Server. NocoBase kann nur auf Objekte zugreifen, für die dieses Konto berechtigt ist, und erteilt keine Berechtigungen bzw. liest keine privaten Objekte anderer Konten. |
| Table prefix | Tabellenpräfix. Nach der Konfiguration liest NocoBase nur Tabellen und Ansichten, die diesem Präfix entsprechen, und erzeugt in NocoBase Tabellennamen ohne Präfix. |
| Encrypt connection | Legt fest, ob die Verbindung verschlüsselt werden soll. Aktivieren Sie diese Option, wenn die Datenbank eine Verschlüsselung erzwingt oder die Netzwerkverbindung verschlüsselt werden muss. |
| Trust server certificate | Legt fest, ob dem Serverzertifikat vertraut werden soll. In Testumgebungen oder Umgebungen mit selbst signierten Zertifikaten muss diese Option möglicherweise aktiviert werden; in Produktionsumgebungen werden vertrauenswürdige Zertifikate empfohlen. |
| Collections / Add all collections | Steuert den Umfang der Anbindung. Wenn „Add all collections“ aktiviert ist, bindet NocoBase alle Tabellen und Ansichten im aktuellen Bereich an. Wenn die Option deaktiviert ist, werden nur die unter „Collections“ ausgewählten Objekte angebunden. |
| Enabled the data source | Legt fest, ob diese Datenquelle aktiviert ist. Nach der Deaktivierung bleibt die Konfiguration erhalten, aber Seitenblöcke, Berechtigungen, Workflows und APIs können weiterhin nicht auf ihre Daten zugreifen. |

:::tip Tipp

Wenn SQL Server viele Objekte enthält, schränken Sie den Umfang vorzugsweise über `Database`, `Table prefix` und „Collections“ ein. Binden Sie nur die Tabellen und Ansichten an, die von der aktuellen Anwendung verwendet werden. Dadurch werden die anschließende Berechnung von Berechtigungen, der Aufbau von Seiten und die Synchronisierung und Pflege deutlich einfacher.

:::

## Daten­tabelle auswählen

Nachdem Sie die Verbindungsinformationen eingegeben haben, können Sie auf „Load Collections“ klicken, um die verfügbaren Tabellen und Ansichten aus SQL Server einzulesen. Das Ergebnis hängt vom Verbindungskonto, `Database`, `Table prefix` und der Konfiguration von „Collections“ ab.

Standardmäßig ist „Add all collections“ aktiviert. Dadurch werden alle Tabellen und Ansichten im aktuellen Bereich angebunden. Wenn Sie nur bestimmte Objekte anbinden möchten, deaktivieren Sie „Add all collections“ und wählen Sie anschließend die gewünschten Tabellen oder Ansichten in der Liste aus.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Hinweis

Eine einzelne externe Datenquelle kann jeweils höchstens 500 Tabellen oder Ansichten anbinden. Wenn SQL Server viele Objekte enthält, empfiehlt es sich, den Umfang zunächst über `Database`, `Table prefix` oder „Collections“ einzuschränken.

:::

## Synchronisierung und Feldkonfiguration

Die Tabellenstruktur des externen MSSQL wird auf Datenbankseite verwaltet. NocoBase erstellt keine Felder in SQL Server, ändert keine Feldtypen und löscht keine realen Felder.

Wenn sich die Tabellenstruktur auf der SQL-Server-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um die Tabellen- und Feldmetadaten erneut einzulesen. Die Synchronisierung aktualisiert die in NocoBase gespeicherten Informationen zu Datentabellen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und der Zuordnung von Feldtypen, löscht jedoch weder reale Tabellen noch Daten in SQL Server.

Nach der Synchronisierung können Sie in NocoBase die Feldbezeichnung, den Feldtyp (Field type) und die Feldkomponente (Field interface) konfigurieren. Wenn Sie NocoBase-Beziehungsfelder erstellen müssen, werden auch deren Beziehungsmetadaten in NocoBase gespeichert; in den SQL-Server-Tabellen werden dadurch keine tatsächlichen Fremdschlüsselfelder automatisch hinzugefügt.

## Feldtypzuordnung

NocoBase ordnet SQL-Server-Feldtypen automatisch einem geeigneten Field type und Field interface zu. Sie können die Darstellungsweise in der Feldkonfiguration anpassen.

Häufige Zuordnungen:

| SQL-Server-Feldtyp | NocoBase Field type | Verfügbare Field interfaces |
| --- | --- | --- |
| `BIT` | `bit` | Checkbox, Switch. |
| `TINYINT`, `SMALLINT` | `integer`, `boolean`, `sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `INT` | `integer`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Select, Radio group. |
| `BIGINT` | `bigInt`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `DECIMAL`, `MONEY`, `SMALLMONEY` | `decimal` | Number, Percent, Currency. |
| `NUMERIC`, `FLOAT`, `REAL` | `float` | Number, Percent. |
| `CHAR`, `VARCHAR`, `NCHAR`, `NVARCHAR` | `string`, `uuid`, `nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT`, `NTEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `DATETIME`, `DATETIME2` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `DATETIMEOFFSET` | `datetimeTz` | Date, Time, Created at, Updated at. |
| `UNIQUEIDENTIFIER` | `uuid`, `string` | UUID, Input. |
| `JSON` | `json`, `array` | JSON. |

:::warning Hinweis

Nicht unterstützte SQL-Server-Feldtypen werden in der Feldkonfiguration separat angezeigt. Diese Felder können erst nach einer entsprechenden Implementierung in NocoBase als gewöhnliche Felder verwendet werden.

:::

## Primärschlüssel und eindeutiger Datensatzbezeichner

Für Datentabellen, die in Seitenblöcken angezeigt und bearbeitet werden, wird ein Primärschlüssel oder ein eindeutiges Feld empfohlen. NocoBase verwendet vorzugsweise den Primärschlüssel als eindeutigen Bezeichner eines Datensatzes.

Wenn Sie eine Ansicht, eine Tabelle ohne Primärschlüssel oder eine Tabelle mit zusammengesetztem Primärschlüssel anbinden, müssen Sie „Record unique key“ in der Konfiguration der Datentabelle manuell festlegen. Ohne einen verfügbaren eindeutigen Bezeichner können Seitenblöcke Datensätze möglicherweise nicht korrekt anzeigen, bearbeiten oder löschen.

![20260709210154](https://static-docs.nocobase.com/20260709210154.png)
![20260709210214](https://static-docs.nocobase.com/20260709210214.png)

## Verwandte Links

- [Externe Datenbank](./index.md) — Allgemeine Konfiguration und Verwaltung externer Datenbanken anzeigen
- [Datenquellenverwaltung](../data-source-manager/index.md) — Einstieg und Verwaltung von Datenquellen anzeigen
- [Datentabellenfelder](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen anzeigen