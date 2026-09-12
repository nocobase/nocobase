---
pkg: "@nocobase/plugin-data-source-external-postgres"
title: "Externe Datenquelle – PostgreSQL"
description: "Erfahren Sie, wie Sie PostgreSQL als externe Datenbank in NocoBase integrieren – einschließlich unterstützter Versionen, Plugin-Installation, Verbindungskonfiguration, Schemas, SSL, Berechtigungen und Feldzuordnung."
keywords: "Externe Datenquelle,PostgreSQL,externe Datenbank,Schema,SSL,Feldzuordnung,NocoBase"
---

# PostgreSQL

## Einführung

PostgreSQL kann als externe Datenbank in NocoBase integriert werden. Nach der Integration liest NocoBase die Tabellen, Felder und Ansichten aus PostgreSQL und verwendet sie als Datensammlungen in der externen Datenquelle.

Im Gegensatz zur [Hauptdatenbank](../main/index.md) wird die tatsächliche Tabellenstruktur von PostgreSQL weiterhin vom ursprünglichen Geschäftssystem, Datenbank-Clients oder Migrationsskripten verwaltet. NocoBase liest die Struktur, speichert Feldmetadaten und konfiguriert Seitenblöcke, Berechtigungen, Workflows und APIs.

| Konfiguration | Beschreibung |
| --- | --- |
| Unterstützte Versionen | PostgreSQL >= 9.5. |
| Kommerzielle Versionen | Unterstützt in der Standard-, Professional- und Enterprise-Version. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-external-postgres`. |

Geeignete Einsatzszenarien für externes PostgreSQL:

- Integration der PostgreSQL-Datenbank vorhandener ERP-, MES-, WMS-, CRM- und anderer Geschäftssysteme
- Aufbau einer Verwaltungsoberfläche mit NocoBase, ohne historische Daten migrieren zu müssen
- Steuerung von Berechtigungen, Verarbeitung von Workflows, Korrektur von Daten oder Darstellung von Berichten für vorhandene Tabellen
- Die Datenbankstruktur wird weiterhin von DBAs, Migrationsskripten oder dem ursprünglichen System verwaltet

:::warning Hinweis

Externes PostgreSQL ist nicht die Systemdatenbank von NocoBase. NocoBase übernimmt weder deren Sicherung, Wiederherstellung und Migration noch Änderungen an der Tabellenstruktur.

:::

## Plugin installieren

Dieses Plugin ist ein kommerzielles Plugin. Ausführliche Informationen zur Aktivierung finden Sie im [Leitfaden zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).

## Datenquelle hinzufügen

Klicken Sie in der „Datenquellenverwaltung“ auf „Add new“, wählen Sie PostgreSQL aus und geben Sie anschließend die Verbindungsinformationen ein.
![20260709204045](https://static-docs.nocobase.com/20260709204045.png)

Häufig verwendete Verbindungskonfigurationen:

| Konfiguration | Beschreibung |
| --- | --- |
| Data source name | Bezeichner der Datenquelle zur Verwendung in Seitenblöcken, Berechtigungen, Workflows und APIs. Nach der Erstellung kann er nicht mehr geändert werden. |
| Data source display name | Der in der Benutzeroberfläche angezeigte Name der Datenquelle. Es wird empfohlen, einen für die Fachanwender verständlichen Namen zu verwenden, z. B. „ERP PostgreSQL“ oder „Berichtsdatenbank“. |
| Host / Port | Hostadresse und Port von PostgreSQL. Der Standardport ist normalerweise `5432`. |
| Database | Name der PostgreSQL-Datenbank, mit der eine Verbindung hergestellt werden soll. |
| Username / Password | Benutzername und Passwort für die Verbindung zu PostgreSQL. NocoBase kann nur auf Objekte zugreifen, für die dieses Konto Berechtigungen besitzt, und erteilt keine Berechtigungen bzw. liest keine privaten Objekte anderer Konten. |
| Schema | Das zu lesende PostgreSQL-Schema, z. B. `public`. Wenn die Datenbank mehrere Schemas enthält, wird empfohlen, nur das für das aktuelle Geschäft benötigte Schema anzugeben. |
| Table prefix | Präfix für Tabellennamen. Nach der Konfiguration liest NocoBase nur Tabellen und Ansichten, die diesem Präfix entsprechen, und erstellt in NocoBase Datensammlungsnamen ohne Präfix. |
| Collections / Add all collections | Steuert den Integrationsumfang. Wenn „Add all collections“ aktiviert ist, integriert NocoBase alle Tabellen und Ansichten im aktuellen Bereich. Wenn die Option deaktiviert ist, werden nur die unter „Collections“ ausgewählten Objekte integriert. |
| Enabled the data source | Legt fest, ob diese Datenquelle aktiviert ist. Nach der Deaktivierung bleibt die Konfiguration der Datenquelle erhalten, aber Seitenblöcke, Berechtigungen, Workflows und APIs können ihre Daten nicht mehr daraus lesen. |
| SSL options | SSL-Verbindungskonfiguration für PostgreSQL. Sie können den SSL-Modus, die Ablehnung nicht autorisierter Zertifikate sowie die Pfade zu CA-Zertifikat, Clientzertifikat und Clientschlüssel festlegen. |

:::tip Tipp

Wenn PostgreSQL viele Objekte enthält, schränken Sie den Bereich zunächst über `Schema`, `Table prefix` und „Collections“ ein. Integrieren Sie nur die Tabellen und Ansichten, die von der aktuellen Anwendung verwendet werden. Dadurch werden die spätere Berechtigungskonfiguration, der Seitenaufbau und die Synchronisierung und Pflege übersichtlicher.

:::

## Daten表 auswählen

Nach Eingabe der Verbindungsinformationen können Sie auf „Load Collections“ klicken, um die verfügbaren Tabellen und Ansichten aus PostgreSQL zu laden. Die geladenen Ergebnisse werden durch das Verbindungskonto, `Schema`, `Table prefix` und die Konfiguration von „Collections“ beeinflusst.

Standardmäßig ist „Add all collections“ aktiviert. Dies bedeutet, dass alle Tabellen und Ansichten im aktuellen Bereich integriert werden. Wenn Sie nur bestimmte Objekte integrieren möchten, deaktivieren Sie „Add all collections“ und wählen Sie anschließend die benötigten Tabellen oder Ansichten in der Liste aus.

![20260709204309](https://static-docs.nocobase.com/20260709204309.png)

:::warning Hinweis

Eine einzelne externe Datenquelle kann höchstens 500 Tabellen oder Ansichten gleichzeitig integrieren. Wenn PostgreSQL viele Objekte enthält, wird empfohlen, den Bereich zunächst über `Schema`, `Table prefix` oder „Collections“ einzuschränken.

:::

## Synchronisieren und Felder konfigurieren

Die Tabellenstruktur von externem PostgreSQL wird auf Datenbankseite verwaltet. NocoBase erstellt in der externen PostgreSQL-Datenbank keine Felder, ändert keine Feldtypen und löscht keine tatsächlichen Felder.

Wenn sich die Tabellenstruktur auf PostgreSQL-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um Tabellen- und Feldmetadaten erneut zu lesen. Die Synchronisierung aktualisiert die in NocoBase gespeicherten Informationen zu Datensammlungen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und Feldtypzuordnungen, löscht jedoch weder tatsächliche Tabellen noch Daten in PostgreSQL.

Nach der Feldsynchronisierung können Sie in NocoBase die Feldbezeichnung, den Feldtyp (Field type) und die Feldkomponente (Field interface) konfigurieren. Wenn Sie NocoBase-Beziehungsfelder erstellen müssen, werden auch die Beziehungsmetadaten in NocoBase gespeichert. In der PostgreSQL-Tabelle wird dadurch nicht automatisch ein tatsächliches Fremdschlüsselfeld hinzugefügt.

## Feldtypzuordnung

NocoBase ordnet PostgreSQL-Feldtypen automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Sie können die Darstellungsweise in der Feldkonfiguration anpassen.

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

Nicht unterstützte PostgreSQL-Feldtypen werden in der Feldkonfiguration separat angezeigt. Diese Felder müssen zunächst durch eine entsprechende Entwicklung angepasst werden, bevor sie in NocoBase als normale Felder verwendet werden können.

:::

## Primärschlüssel und eindeutige Datensatzkennung

Für Datensammlungen, die in Seitenblöcken angezeigt und bearbeitet werden, wird ein Primärschlüssel oder ein eindeutiges Feld empfohlen. NocoBase verwendet vorrangig den Primärschlüssel als eindeutige Datensatzkennung.

Wenn Sie eine Ansicht, eine Tabelle ohne Primärschlüssel oder eine Tabelle mit zusammengesetztem Primärschlüssel integrieren, müssen Sie „Record unique key“ in der Konfiguration der Datensammlung manuell festlegen. Ohne eine verfügbare eindeutige Kennung können Seitenblöcke Datensätze möglicherweise nicht korrekt anzeigen, bearbeiten oder löschen.

![20260709204742](https://static-docs.nocobase.com/20260709204742.png)
![20260709204827](https://static-docs.nocobase.com/20260709204827.png)

## Verwandte Links

- [Externe Datenbanken](./index.md) — Informationen zu allgemeinen Konfigurations- und Verwaltungsoptionen externer Datenbanken
- [Datenquellenverwaltung](../data-source-manager/index.md) — Informationen zum Zugriff auf Datenquellen und zur Verwaltung von Datenquellen
- [Datensammlungsfelder](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen