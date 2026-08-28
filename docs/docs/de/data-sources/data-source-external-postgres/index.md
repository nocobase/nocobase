---
pkg: "@nocobase/plugin-data-source-external-postgres"
title: "Externe Datenquelle – PostgreSQL"
description: "Erfahren Sie, wie Sie PostgreSQL als externe Datenbank an NocoBase anbinden, einschließlich unterstützter Versionen, Plugin-Installation, Verbindungskonfiguration, Schemas, SSL, Berechtigungen und Feldzuordnung."
keywords: "Externe Datenquelle,PostgreSQL,externe Datenbank,Schema,SSL,Feldzuordnung,NocoBase"
---

# PostgreSQL

## Einführung

PostgreSQL kann als externe Datenbank an NocoBase angebunden werden. Nach der Anbindung liest NocoBase die Tabellen, Felder und Ansichten aus PostgreSQL und verwendet sie als Datentabellen in der externen Datenquelle.

Im Gegensatz zur [Hauptdatenbank](../data-source-main/index.md) wird die tatsächliche Tabellenstruktur der externen PostgreSQL-Datenbank weiterhin vom ursprünglichen Geschäftssystem, Datenbank-Clients oder Migrationsskripten verwaltet. NocoBase ist für das Lesen der Struktur, das Speichern von Feldmetadaten sowie die Konfiguration von Seitenblöcken, Berechtigungen, Workflows und APIs zuständig.

| Konfigurationselement | Beschreibung |
| --- | --- |
| Unterstützte Versionen | PostgreSQL >= 9.5. |
| Kommerzielle Versionen | Unterstützt in der Standard-, Professional- und Enterprise-Version. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-external-postgres`. |

Geeignete Einsatzszenarien für eine externe PostgreSQL-Datenbank:

- Anbindung der PostgreSQL-Datenbank bestehender ERP-, MES-, WMS-, CRM- und anderer Geschäftssysteme
- Aufbau einer Verwaltungsoberfläche mit NocoBase, ohne historische Daten zu migrieren
- Steuerung von Berechtigungen, Verarbeitung von Abläufen, Korrektur von Daten oder Anzeige von Berichten für bestehende Tabellen
- Fortlaufende Verwaltung der Datenbankstruktur durch DBAs, Migrationsskripte oder das ursprüngliche System

:::warning Hinweis

Eine externe PostgreSQL-Datenbank ist keine Systemdatenbank von NocoBase. NocoBase übernimmt weder deren Sicherung, Wiederherstellung und Migration noch Änderungen an der Tabellenstruktur.

:::

## Plugin installieren

Dieses Plugin ist ein kommerzielles Plugin. Eine ausführliche Beschreibung der Aktivierung finden Sie im [Leitfaden zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).

## Datenquelle hinzufügen

Klicken Sie in der „Datenquellenverwaltung“ auf „Add new“, wählen Sie PostgreSQL aus und geben Sie anschließend die Verbindungsinformationen ein.
![20260709204045](https://static-docs.nocobase.com/20260709204045.png)

Übliche Verbindungseinstellungen:

| Einstellung | Beschreibung |
| --- | --- |
| Data source name | Bezeichner der Datenquelle zur Referenzierung in Seitenblöcken, Berechtigungen, Workflows und APIs. Nach der Erstellung kann er nicht mehr geändert werden. |
| Data source display name | Name, der für die Datenquelle in der Benutzeroberfläche angezeigt wird. Es empfiehlt sich, einen für die Fachanwender verständlichen Namen zu verwenden, z. B. „ERP PostgreSQL“ oder „Berichtsdatenbank“. |
| Host / Port | Hostadresse und Port von PostgreSQL. Der Standardport ist normalerweise `5432`. |
| Database | Name der PostgreSQL-Datenbank, mit der eine Verbindung hergestellt werden soll. |
| Username / Password | Benutzername und Passwort für die Verbindung zu PostgreSQL. NocoBase kann nur auf Objekte zugreifen, für die dieses Konto Berechtigungen besitzt. Es erteilt keine Berechtigungen und liest keine privaten Objekte anderer Konten. |
| Schema | Das zu lesende PostgreSQL-Schema, z. B. `public`. Wenn die Datenbank mehrere Schemas enthält, empfiehlt es sich, nur das für das aktuelle Geschäft benötigte Schema anzugeben. |
| Table prefix | Präfix für Tabellennamen. Nach der Konfiguration liest NocoBase nur Tabellen und Ansichten, die diesem Präfix entsprechen, und erzeugt in NocoBase Tabellennamen ohne Präfix. |
| Collections / Add all collections | Steuert den Umfang der Anbindung. Wenn „Add all collections“ aktiviert ist, bindet NocoBase alle Tabellen und Ansichten innerhalb des aktuellen Bereichs an. Wenn die Option deaktiviert ist, werden nur die unter „Collections“ ausgewählten Objekte angebunden. |
| Enabled the data source | Legt fest, ob diese Datenquelle aktiviert ist. Wenn sie deaktiviert wird, bleibt die Konfiguration erhalten, aber Seitenblöcke, Berechtigungen, Workflows und APIs können nicht mehr auf ihre Daten zugreifen. |
| SSL options | SSL-Verbindungseinstellungen für PostgreSQL. Sie können den SSL-Modus, die Ablehnung nicht autorisierter Zertifikate sowie die Pfade zu CA-Zertifikat, Clientzertifikat und Clientschlüssel festlegen. |

:::tip Tipp

Wenn PostgreSQL viele Objekte enthält, sollten Sie den Umfang zunächst über `Schema`, `Table prefix` und „Collections“ einschränken. Binden Sie nur die Tabellen und Ansichten an, die von der aktuellen Anwendung verwendet werden. Dadurch werden die spätere Berechtigungskonfiguration, der Seitenaufbau und die Synchronisierung leichter.

:::

## Datenbanktabellen auswählen

Nachdem Sie die Verbindungsinformationen eingegeben haben, können Sie auf „Load Collections“ klicken, um die verfügbaren Tabellen und Ansichten aus PostgreSQL zu laden. Die geladenen Ergebnisse werden durch das Verbindungskonto, `Schema`, `Table prefix` und die Konfiguration von „Collections“ beeinflusst.

Standardmäßig ist „Add all collections“ aktiviert. Dadurch werden alle Tabellen und Ansichten innerhalb des aktuellen Bereichs angebunden. Wenn Sie nur bestimmte Objekte anbinden möchten, deaktivieren Sie „Add all collections“ und wählen Sie anschließend die gewünschten Tabellen oder Ansichten in der Liste aus.

![20260709204309](https://static-docs.nocobase.com/20260709204309.png)

:::warning Hinweis

Eine einzelne externe Datenquelle kann höchstens 500 Tabellen oder Ansichten gleichzeitig anbinden. Wenn PostgreSQL viele Objekte enthält, empfiehlt es sich, den Umfang zunächst über `Schema`, `Table prefix` oder „Collections“ einzuschränken.

:::

## Synchronisierung und Feldkonfiguration

Die Tabellenstruktur der externen PostgreSQL-Datenbank wird auf Datenbankseite verwaltet. NocoBase erstellt in der externen PostgreSQL-Datenbank keine Felder, ändert keine Feldtypen und löscht keine tatsächlichen Felder.

Wenn sich die Tabellenstruktur auf PostgreSQL-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um die Metadaten der Tabellen und Felder erneut einzulesen. Die Synchronisierung aktualisiert die in NocoBase gespeicherten Informationen zu Datentabellen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und Feldtypzuordnungen, löscht jedoch weder tatsächliche Tabellen noch Daten in PostgreSQL.

Nach der Feldsynchronisierung können Sie in NocoBase die Feldbezeichnung, den Feldtyp (Field type) und die Feldkomponente (Field interface) konfigurieren. Wenn Sie NocoBase-Beziehungsfelder anlegen müssen, werden die Beziehungsmetadaten ebenfalls in NocoBase gespeichert; in den PostgreSQL-Tabellen werden dabei keine tatsächlichen Fremdschlüsselfelder automatisch hinzugefügt.

## Feldtypzuordnung

NocoBase ordnet PostgreSQL-Feldtypen automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Die Darstellungsweise in der Benutzeroberfläche können Sie in der Feldkonfiguration anpassen.

Häufige Zuordnungen:

| PostgreSQL-Feldtyp | NocoBase Field type | Verfügbare Field interface |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`, `INTEGER`, `SERIAL`, `SMALLSERIAL` | `integer`, `boolean`, `sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `BIGINT`, `BIGSERIAL` | `bigInt`, `sort` | Integer, Sort, Checkbox, Switch, Select, Radio group, Unix timestamp, Created at, Updated at. |
| `REAL` | `float` | Number, Percent. |
| `DOUBLE PRECISION` | `double` | Number, Percent. |
| `DECIMAL`, `NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`, `CHAR` | `string`, `password`, `uuid`, `nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text`, `json` | Textarea, Markdown, Vditor, Rich text, URL, JSON. |
| `UUID` | `uuid` | UUID. |
| `JSON`, `JSONB` | `json` | JSON. |
| `TIMESTAMP` | `date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `POINT`, `LINESTRING`, `POLYGON`, `CIRCLE` | `point`, `lineString`, `polygon`, `circle` | Point, Line string, Polygon, Circle, JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group. |

:::warning Hinweis

Nicht unterstützte PostgreSQL-Feldtypen werden in der Feldkonfiguration separat angezeigt. Diese Felder können erst nach entsprechender Entwicklungsanpassung als normale Felder in NocoBase verwendet werden.

:::

## Primärschlüssel und eindeutige Datensatzkennung

Für Datentabellen, die in Seitenblöcken angezeigt und bearbeitet werden, wird ein Primärschlüssel oder ein eindeutiges Feld empfohlen. NocoBase verwendet vorrangig den Primärschlüssel als eindeutige Datensatzkennung.

Wenn Sie eine Ansicht, eine Tabelle ohne Primärschlüssel oder eine Tabelle mit zusammengesetztem Primärschlüssel anbinden, müssen Sie in der Konfiguration der Datentabelle „Record unique key“ manuell festlegen. Wenn keine geeignete eindeutige Kennung vorhanden ist, können Seitenblöcke Datensätze möglicherweise nicht korrekt anzeigen, bearbeiten oder löschen.

![20260709204742](https://static-docs.nocobase.com/20260709204742.png)
![20260709204827](https://static-docs.nocobase.com/20260709204827.png)

## Verwandte Links

- [Externe Datenbank](./index.md) — Allgemeine Konfigurations- und Verwaltungshinweise zu externen Datenbanken anzeigen
- [Datenquellenverwaltung](../data-source-manager/index.md) — Einstieg und Verwaltung von Datenquellen anzeigen
- [Datentabellenfelder](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen anzeigen