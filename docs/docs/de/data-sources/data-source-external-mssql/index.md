---
pkg: "@nocobase/plugin-data-source-external-mssql"
title: "Externe Datenquelle – MSSQL"
description: "Erfahren Sie, wie Sie MSSQL/SQL Server als externe Datenbank in NocoBase integrieren, einschließlich unterstützter Versionen, Plugin-Installation, Verbindungskonfiguration, verschlüsselter Verbindungen, Berechtigungen und Feldzuordnung."
keywords: "Externe Datenquelle,MSSQL,SQL Server,externe Datenbank,Feldzuordnung,NocoBase"
---

# MSSQL

## Einführung

MSSQL (SQL Server) kann als externe Datenbank in NocoBase integriert werden. Nach der Integration liest NocoBase die Tabellen, Felder und Ansichten aus SQL Server ein und verwendet sie als Datentabellen in der externen Datenquelle.

Im Gegensatz zur [Hauptdatenbank](../data-source-main/index.md) wird die tatsächliche Tabellenstruktur der externen MSSQL-Datenbank weiterhin vom ursprünglichen Geschäftssystem, Datenbankclient oder Migrationsskript verwaltet. NocoBase liest die Struktur ein, speichert Feldmetadaten und konfiguriert Seitenblöcke, Berechtigungen, Workflows und APIs.

| Konfiguration | Beschreibung |
| --- | --- |
| Unterstützte Versionen | SQL Server 2014–2019. |
| Kommerzielle Editionen | Unterstützt werden die Standard-, Professional- und Enterprise-Edition. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-external-mssql`. |
| Verbindungseigenschaften | Unterstützt die Konfiguration von „Encrypt connection“ und „Trust server certificate“. |

Geeignete Einsatzszenarien für eine externe MSSQL-Datenquelle:

- Integration vorhandener SQL-Server-Datenbanken von Geschäftssystemen wie ERP, MES, WMS oder CRM
- Aufbau einer Verwaltungsoberfläche mit NocoBase, ohne historische Daten migrieren zu müssen
- Steuerung von Berechtigungen, Prozessverarbeitung, Datenkorrekturen oder Berichtsanzeige für vorhandene Tabellen
- Weitere Verwaltung der Datenbankstruktur durch DBAs, Migrationsskripte oder das ursprüngliche System

:::warning Hinweis

Eine externe MSSQL-Datenbank ist keine Systemdatenbank von NocoBase. NocoBase übernimmt weder deren Sicherung und Wiederherstellung noch Migrationen oder Änderungen an der Tabellenstruktur.

:::

## Plugin installieren

Dieses Plugin ist ein kommerzielles Plugin. Eine ausführliche Anleitung zur Aktivierung finden Sie unter: [Anleitung zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Datenquelle hinzufügen

Klicken Sie in der „Datenquellenverwaltung“ auf „Add new“, wählen Sie MSSQL aus und geben Sie anschließend die Verbindungsinformationen ein.

![20260709210022](https://static-docs.nocobase.com/20260709210022.png)

Typische Verbindungseinstellungen:

| Einstellung | Beschreibung |
| --- | --- |
| Data source name | Eindeutiger Name der Datenquelle zur Verwendung in Seitenblöcken, Berechtigungen, Workflows und APIs. Nach der Erstellung kann er nicht mehr geändert werden. |
| Data source display name | Name, unter dem die Datenquelle in der Benutzeroberfläche angezeigt wird. Es empfiehlt sich, einen für die Fachabteilung verständlichen Namen zu verwenden, z. B. „ERP SQL Server“ oder „Finanzdatenbank“. |
| Host / Port | Hostadresse und Port des SQL Servers. Der Standardport ist normalerweise `1433`. |
| Database | Name der SQL-Server-Datenbank, mit der eine Verbindung hergestellt werden soll. |
| Username / Password | Benutzername und Passwort für die Verbindung mit SQL Server. NocoBase kann nur auf Objekte zugreifen, für die dieses Konto Berechtigungen besitzt, und erteilt keine Berechtigungen bzw. liest keine privaten Objekte anderer Konten. |
| Table prefix | Tabellenpräfix. Nach der Konfiguration liest NocoBase nur Tabellen und Ansichten ein, die diesem Präfix entsprechen, und erzeugt in NocoBase Tabellennamen ohne Präfix. |
| Encrypt connection | Gibt an, ob die verschlüsselte Verbindung aktiviert werden soll. Aktivieren Sie diese Option, wenn die Datenbank eine Verschlüsselung erzwingt oder die Netzwerkverbindung verschlüsselt werden muss. |
| Trust server certificate | Gibt an, ob das Serverzertifikat als vertrauenswürdig eingestuft werden soll. In Testumgebungen oder bei selbstsignierten Zertifikaten kann die Aktivierung erforderlich sein. Für Produktionsumgebungen werden vertrauenswürdige Zertifikate empfohlen. |
| Collections / Add all collections | Steuert den Integrationsumfang. Wenn „Add all collections“ aktiviert ist, bindet NocoBase alle Tabellen und Ansichten im aktuellen Bereich ein. Wenn die Option deaktiviert ist, werden nur die unter „Collections“ ausgewählten Objekte eingebunden. |
| Enabled the data source | Gibt an, ob diese Datenquelle aktiviert ist. Nach der Deaktivierung bleibt die Konfiguration erhalten, aber Seitenblöcke, Berechtigungen, Workflows und APIs können nicht mehr auf ihre Daten zugreifen. |

:::tip Tipp

Wenn SQL Server viele Objekte enthält, schränken Sie den Umfang zunächst mit `Database`, `Table prefix` und „Collections“ ein. Binden Sie nur die Tabellen und Ansichten ein, die von der aktuellen Anwendung verwendet werden. Dadurch werden die spätere Berechnung von Berechtigungen, der Seitenaufbau und die laufende Synchronisierung vereinfacht.

:::

## Datenbanktabellen auswählen

Nachdem Sie die Verbindungsinformationen eingegeben haben, können Sie auf „Load Collections“ klicken, um die verfügbaren Tabellen und Ansichten aus SQL Server einzulesen. Das Ergebnis hängt vom Verbindungskonto, `Database`, `Table prefix` und der Konfiguration von „Collections“ ab.

Standardmäßig ist „Add all collections“ aktiviert. Dadurch werden alle Tabellen und Ansichten im aktuellen Bereich eingebunden. Wenn Sie nur bestimmte Objekte einbinden möchten, deaktivieren Sie „Add all collections“ und wählen Sie anschließend die gewünschten Tabellen oder Ansichten in der Liste aus.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Hinweis

Eine einzelne externe Datenquelle kann höchstens 500 Tabellen oder Ansichten gleichzeitig einbinden. Wenn SQL Server viele Objekte enthält, sollten Sie den Umfang zunächst mit `Database`, `Table prefix` oder „Collections“ einschränken.

:::

## Synchronisierung und Feldkonfiguration

Die Tabellenstruktur der externen MSSQL-Datenbank wird auf Datenbankseite verwaltet. NocoBase erstellt keine Felder in SQL Server, ändert keine Feldtypen und löscht keine tatsächlich vorhandenen Felder.

Wenn sich die Tabellenstruktur auf der SQL-Server-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um die Tabellen- und Feldmetadaten erneut einzulesen. Bei der Synchronisierung werden die in NocoBase gespeicherten Informationen zu Datentabellen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und Feldtypzuordnungen aktualisiert. Tatsächlich vorhandene Tabellen oder Daten in SQL Server werden jedoch nicht gelöscht.

Nach der Feldsynchronisierung können Sie in NocoBase die Feldbezeichnung, den Feldtyp (Field type) und die Feldkomponente (Field interface) konfigurieren. Wenn Sie NocoBase-Beziehungsfelder erstellen müssen, werden auch die Beziehungsmetadaten in NocoBase gespeichert. In der SQL-Server-Tabelle wird dadurch nicht automatisch ein tatsächliches Fremdschlüsselfeld hinzugefügt.

## Feldtypzuordnung

NocoBase ordnet SQL-Server-Feldtypen automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Die Darstellungsweise in der Benutzeroberfläche kann in der Feldkonfiguration angepasst werden.

Häufige Zuordnungen:

| SQL-Server-Feldtyp | NocoBase Field type | Verfügbare Field interface |
| --- | --- | --- |
| `BIT` | `bit` | Checkbox, Switch. |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `INT` | `integer`、`unixTimestamp`、`sort` | Integer, Sort, Unix timestamp, Select, Radio group. |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `DECIMAL`、`MONEY`、`SMALLMONEY` | `decimal` | Number, Percent, Currency. |
| `NUMERIC`、`FLOAT`、`REAL` | `float` | Number, Percent. |
| `CHAR`、`VARCHAR`、`NCHAR`、`NVARCHAR` | `string`、`uuid`、`nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT`、`NTEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `DATETIME`、`DATETIME2` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `DATETIMEOFFSET` | `datetimeTz` | Date, Time, Created at, Updated at. |
| `UNIQUEIDENTIFIER` | `uuid`、`string` | UUID, Input. |
| `JSON` | `json`、`array` | JSON. |

:::warning Hinweis

Nicht unterstützte SQL-Server-Feldtypen werden in der Feldkonfiguration separat angezeigt. Diese Felder können erst nach entsprechender Entwicklungsanpassung in NocoBase als normale Felder verwendet werden.

:::

## Primärschlüssel und eindeutige Datensatzkennung

Für Datentabellen, die in Seitenblöcken angezeigt und bearbeitet werden, wird ein Primärschlüssel oder ein eindeutiges Feld empfohlen. NocoBase verwendet bevorzugt den Primärschlüssel als eindeutige Datensatzkennung.

Wenn es sich um eine Ansicht, eine Tabelle ohne Primärschlüssel oder eine Tabelle mit zusammengesetztem Primärschlüssel handelt, müssen Sie in der Konfiguration der Datentabelle manuell „Record unique key“ festlegen. Ohne eine verfügbare eindeutige Kennung können Seitenblöcke Datensätze möglicherweise nicht korrekt anzeigen, bearbeiten oder löschen.

![20260709210154](https://static-docs.nocobase.com/20260709210154.png)
![20260709210214](https://static-docs.nocobase.com/20260709210214.png)

## Verwandte Links

- [Externe Datenbanken](./index.md) — Allgemeine Konfiguration und Verwaltung externer Datenbanken
- [Datenquellenverwaltung](../data-source-manager/index.md) — Einstieg und Verwaltungs方法 für Datenquellen
- [Datentabellenfelder](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen