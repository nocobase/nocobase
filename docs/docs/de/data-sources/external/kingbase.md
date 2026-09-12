---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Externe Datenquelle – KingbaseES"
description: "Erfahren Sie, wie Sie KingbaseES als externe Datenbank in NocoBase integrieren, einschließlich unterstützter Versionen, PostgreSQL-Kompatibilitätsmodus, Verbindungskonfiguration, Schemas, Berechtigungen und Feldzuordnung."
keywords: "Externe Datenquelle,KingbaseES,Renmin Jincang,externe Datenbank,PostgreSQL-Kompatibilitätsmodus,Feldzuordnung,NocoBase"
---

# KingbaseES

## Einführung

KingbaseES kann als externe Datenbank in NocoBase integriert werden. Nach der Integration liest NocoBase die Tabellen, Felder und Ansichten aus KingbaseES aus und verwendet sie als Datentabellen in der externen Datenquelle.

Im Gegensatz zur [Hauptdatenbank](../main/index.md) wird die tatsächliche Tabellenstruktur der externen KingbaseES-Datenbank weiterhin vom ursprünglichen Geschäftssystem, Datenbank-Clients oder Migrationsskripten verwaltet. NocoBase liest die Struktur aus, speichert Feldmetadaten und konfiguriert Seitenblöcke, Berechtigungen, Workflows und APIs.

| Konfiguration | Beschreibung |
| --- | --- |
| Unterstützte Versionen | KingbaseES >= V9. |
| Kommerzielle Versionen | Unterstützt werden Professional Edition und Enterprise Edition. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-kingbase`. |
| Datenbankmodus | Es wird nur der PostgreSQL-Kompatibilitätsmodus unterstützt. |

Geeignete Einsatzszenarien für eine externe KingbaseES-Datenbank:

- Integration einer bestehenden KingbaseES-Geschäftsdatenbank in Behörden-, Unternehmens-, Intranet- oder Umgebungen mit einheimischer Software
- Aufbau einer Verwaltungsoberfläche mit NocoBase, ohne historische Daten migrieren zu müssen
- Steuerung von Berechtigungen, Verarbeitung von Workflows, Korrektur von Daten oder Darstellung von Berichten für bestehende Tabellen
- Die Datenbankstruktur wird weiterhin von DBAs, Migrationsskripten oder dem ursprünglichen System verwaltet

:::warning Hinweis

KingbaseES unterstützt als externe Datenbank nur den PostgreSQL-Kompatibilitätsmodus. Wenn sich die Datenbank nicht im PostgreSQL-Kompatibilitätsmodus befindet, kann NocoBase Tabellenstrukturen und Feldtypen mit dem aktuellen Plugin nicht auslesen.

:::

## Plugin installieren

Dieses Plugin ist ein kommerzielles Plugin. Ausführliche Informationen zur Aktivierung finden Sie unter: [Leitfaden zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Datenquelle hinzufügen

Klicken Sie in der „Datenquellenverwaltung“ auf „Add new“, wählen Sie KingbaseES aus und geben Sie anschließend die Verbindungsinformationen ein.

![20260709210325](https://static-docs.nocobase.com/20260709210325.png)

Die häufigsten Verbindungseinstellungen sind:

| Einstellung | Beschreibung |
| --- | --- |
| Data source name | Bezeichner der Datenquelle, der für Verweise in Seitenblöcken, Berechtigungen, Workflows und APIs verwendet wird. Nach der Erstellung kann er nicht mehr geändert werden. |
| Data source display name | Der in der Benutzeroberfläche angezeigte Name der Datenquelle. Es wird empfohlen, einen für Fachanwender verständlichen Namen zu verwenden, z. B. „Behörden-KingbaseES“ oder „Berichtsdatenbank“. |
| Host / Port | Hostadresse und Port des KingbaseES-Servers. Maßgeblich ist die tatsächliche Datenbankkonfiguration. |
| Database | Name der zu verbindenden KingbaseES-Datenbank. |
| Username / Password | Benutzername und Passwort für die Verbindung zu KingbaseES. NocoBase kann nur auf Objekte zugreifen, für die dieses Konto über Berechtigungen verfügt, und erteilt oder liest keine Berechtigungen für private Objekte anderer Konten. |
| Schema | Das zu lesende Schema. Wenn die Datenbank mehrere Schemas enthält, wird empfohlen, nur das für die aktuelle Anwendung erforderliche Schema anzugeben. |
| Table prefix | Präfix der Tabellennamen. Nach der Konfiguration liest NocoBase nur Tabellen und Ansichten, die diesem Präfix entsprechen, und erstellt in NocoBase Datentabellennamen ohne dieses Präfix. |
| Collections / Add all collections | Steuert den Integrationsumfang. Wenn „Add all collections“ aktiviert ist, integriert NocoBase alle Tabellen und Ansichten innerhalb des aktuellen Bereichs. Ist die Option deaktiviert, werden nur die unter „Collections“ ausgewählten Objekte integriert. |
| Enabled the data source | Legt fest, ob diese Datenquelle aktiviert ist. Nach der Deaktivierung bleibt die Datenquellenkonfiguration erhalten, aber Seitenblöcke, Berechtigungen, Workflows und APIs können ihre Daten nicht mehr daraus lesen. |

:::tip Tipp

Wenn KingbaseES sehr viele Objekte enthält, schränken Sie den Umfang vorzugsweise mithilfe von `Schema`, `Table prefix` und „Collections“ ein. Integrieren Sie nur die Tabellen und Ansichten, die die aktuelle Anwendung benötigt. Dadurch werden die spätere Berechtigungskonfiguration, der Seitenaufbau und die laufende Synchronisierung erheblich vereinfacht.

:::

## Datentabellen auswählen

Nach Eingabe der Verbindungsinformationen können Sie auf „Load Collections“ klicken, um die verfügbaren Tabellen und Ansichten in KingbaseES auszulesen. Das Ergebnis wird durch das Verbindungskonto, `Schema`, `Table prefix` und die Konfiguration von „Collections“ beeinflusst.

Standardmäßig ist „Add all collections“ aktiviert. Das bedeutet, dass alle Tabellen und Ansichten innerhalb des aktuellen Bereichs integriert werden. Wenn Sie nur einen Teil der Objekte integrieren möchten, deaktivieren Sie „Add all collections“ und wählen Sie anschließend die gewünschten Tabellen oder Ansichten in der Liste aus.

![20260709210603](https://static-docs.nocobase.com/20260709210603.png)

:::warning Hinweis

Eine einzelne externe Datenquelle kann höchstens 500 Tabellen oder Ansichten gleichzeitig integrieren. Wenn KingbaseES sehr viele Objekte enthält, wird empfohlen, den Umfang zunächst mithilfe von `Schema`, `Table prefix` oder „Collections“ einzuschränken.

:::

## Felder synchronisieren und konfigurieren

Die Tabellenstruktur der externen KingbaseES-Datenbank wird auf Datenbankseite verwaltet. NocoBase erstellt in der externen KingbaseES-Datenbank keine Felder, ändert keine Feldtypen und löscht keine tatsächlichen Felder.

Wenn sich die Tabellenstruktur auf der KingbaseES-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um die Tabellen- und Feldmetadaten erneut auszulesen. Die Synchronisierung aktualisiert die in NocoBase gespeicherten Informationen zu Datentabellen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und Feldtypzuordnungen, löscht jedoch weder tatsächliche Tabellen noch Daten in KingbaseES.

Nach der Feldsynchronisierung können Sie in NocoBase die Feldbezeichnung, den Feldtyp (Field type) und die Feldkomponente (Field interface) konfigurieren. Wenn Sie in NocoBase ein Beziehungsfeld erstellen möchten, werden auch die Beziehungsmetadaten in NocoBase gespeichert. In der KingbaseES-Tabelle wird dadurch nicht automatisch ein tatsächliches Fremdschlüsselfeld angelegt.

## Feldtypzuordnung

NocoBase erkennt die Feldtypen von KingbaseES entsprechend der PostgreSQL-Kompatibilitätslogik und ordnet sie automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Die Darstellungsweise in der Benutzeroberfläche kann in der Feldkonfiguration angepasst werden.

Häufige Zuordnungen:

| KingbaseES-Feldtyp | NocoBase Field type | Verfügbare Field interface |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`, `INTEGER` | `integer`, `sort` | Integer, Sort, Select, Radio group. |
| `BIGINT` | `bigInt`, `snowflakeId`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `REAL`, `DOUBLE PRECISION` | `float` | Number, Percent. |
| `DECIMAL`, `NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`, `CHAR` | `string`, `uuid`, `nanoid`, `encryption`, `datetimeNoTz` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `UUID` | `uuid` | UUID. |
| `JSON`, `JSONB` | `json`, `array` | JSON. |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`, `date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME WITHOUT TIME ZONE` | `time` | Time. |
| `POINT`, `PATH`, `POLYGON`, `CIRCLE` | `json` | JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group, JSON. |

:::warning Hinweis

Nicht unterstützte KingbaseES-Feldtypen werden in der Feldkonfiguration separat angezeigt. Diese Felder müssen zunächst durch eine entsprechende Anpassung unterstützt werden, bevor sie in NocoBase als normale Felder verwendet werden können.

:::

## Primärschlüssel und eindeutiger Datensatzbezeichner

Für Datentabellen, die zur Darstellung und Bearbeitung in Seitenblöcken verwendet werden, wird ein Primärschlüssel oder ein eindeutiges Feld empfohlen. NocoBase verwendet vorrangig den Primärschlüssel als eindeutigen Datensatzbezeichner.

Wenn Sie eine Ansicht, eine Tabelle ohne Primärschlüssel oder eine Tabelle mit zusammengesetztem Primärschlüssel integrieren, müssen Sie in der Datentabellenkonfiguration manuell „Record unique key“ festlegen. Wenn kein geeigneter eindeutiger Bezeichner vorhanden ist, können Seitenblöcke Datensätze möglicherweise nicht korrekt anzeigen, bearbeiten oder löschen.

![20260709210636](https://static-docs.nocobase.com/20260709210636.png)
![20260709210651](https://static-docs.nocobase.com/20260709210651.png)

## Verwandte Links

- [Externe Datenbanken](./index.md) — Allgemeine Konfigurations- und Verwaltungshinweise zu externen Datenbanken
- [Datenquellenverwaltung](../data-source-manager/index.md) — Informationen zum Zugriff auf und zur Verwaltung von Datenquellen
- [Datentabellenfelder](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen