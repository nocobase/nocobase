---
pkg: "@nocobase/plugin-data-source-external-mariadb"
title: "Externe Datenquelle – MariaDB"
description: "Erfahren Sie, wie Sie MariaDB als externe Datenbank in NocoBase anbinden, einschließlich unterstützter Versionen, Plugin-Installation, Verbindungskonfiguration, Tabellenumfang, Berechtigungen und Feldzuordnung."
keywords: "Externe Datenquelle,MariaDB,externe Datenbank,Feldzuordnung,NocoBase"
---

# MariaDB

## Einführung

MariaDB kann als externe Datenbank an NocoBase angebunden werden. Nach der Anbindung liest NocoBase die Tabellen, Felder und Ansichten aus MariaDB ein und verwendet sie als Datentabellen in der externen Datenquelle.

Im Gegensatz zur [Hauptdatenbank](../main/index.md) wird die tatsächliche Tabellenstruktur der externen MariaDB weiterhin vom ursprünglichen Geschäftssystem, Datenbank-Client oder Migrationsskript verwaltet. NocoBase liest die Struktur ein, speichert Feldmetadaten und konfiguriert Seitenblöcke, Berechtigungen, Workflows und APIs.

| Konfiguration | Beschreibung |
| --- | --- |
| Unterstützte Versionen | MariaDB >= 10.3. |
| Kommerzielle Editionen | Unterstützt in der Standard-, Professional- und Enterprise-Edition. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-external-mariadb`. |
| Kompatibles Protokoll | Die Verbindung erfolgt über das MySQL-Protokoll; die Feldzuordnung folgt grundsätzlich der MySQL-kompatiblen Logik. |

Die Verwendung einer externen MariaDB eignet sich insbesondere in folgenden Szenarien:

- Anbindung der MariaDB-Datenbank bestehender Geschäftssysteme wie ERP, MES, WMS oder CRM
- Aufbau einer Verwaltungsoberfläche mit NocoBase, ohne historische Daten zu migrieren
- Anwendung von Berechtigungen, Prozessverarbeitung, Datenkorrekturen oder Berichtsanzeigen auf bestehenden Tabellen
- Weitere Verwaltung der Datenbankstruktur durch DBAs, Migrationsskripte oder das ursprüngliche System

:::warning Hinweis

Eine externe MariaDB ist nicht die Systemdatenbank von NocoBase. NocoBase übernimmt weder ihre Sicherung und Wiederherstellung noch ihre Migration oder Änderungen an der Tabellenstruktur.

:::

## Plugin installieren

Dieses Plugin ist ein kommerzielles Plugin. Ausführliche Informationen zur Aktivierung finden Sie im [Leitfaden zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).

## Datenquelle hinzufügen

Klicken Sie in der „Datenquellenverwaltung“ auf „Add new“, wählen Sie MariaDB aus und geben Sie anschließend die Verbindungsinformationen ein.

![20260709204413](https://static-docs.nocobase.com/20260709204413.png)

Häufig verwendete Verbindungseinstellungen:

| Einstellung | Beschreibung |
| --- | --- |
| Data source name | Der Bezeichner der Datenquelle, der für Verweise in Seitenblöcken, Berechtigungen, Workflows und APIs verwendet wird. Nach der Erstellung kann er nicht mehr geändert werden. |
| Data source display name | Der in der Benutzeroberfläche angezeigte Name der Datenquelle. Es empfiehlt sich, einen für die Fachanwender verständlichen Namen zu verwenden, zum Beispiel „ERP MariaDB“ oder „Bestelldatenbank“. |
| Host / Port | Hostadresse und Port der MariaDB. Der Standardport ist normalerweise `3306`. |
| Database | Der Name der MariaDB-Datenbank, mit der eine Verbindung hergestellt werden soll. |
| Username / Password | Benutzername und Passwort für die Verbindung mit MariaDB. NocoBase kann nur auf Objekte zugreifen, für die dieses Konto Berechtigungen besitzt; Berechtigungen werden nicht erteilt und private Objekte anderer Konten nicht gelesen. |
| Table prefix | Präfix der Tabellennamen. Nach der Konfiguration liest NocoBase nur Tabellen und Ansichten ein, die diesem Präfix entsprechen, und erzeugt in NocoBase Tabellennamen ohne Präfix. |
| Collections / Add all collections | Steuert den Umfang der Anbindung. Wenn „Add all collections“ aktiviert ist, bindet NocoBase alle Tabellen und Ansichten im aktuellen Bereich an. Wenn die Option deaktiviert ist, werden nur die unter „Collections“ ausgewählten Objekte angebunden. |
| Enabled the data source | Legt fest, ob diese Datenquelle aktiviert ist. Nach der Deaktivierung bleibt die Konfiguration erhalten, Seitenblöcke, Berechtigungen, Workflows und APIs können jedoch nicht mehr auf ihre Daten zugreifen. |

:::tip Tipp

Wenn MariaDB viele Objekte enthält, grenzen Sie den Umfang zunächst über `Database`, `Table prefix` und „Collections“ ein. Binden Sie nur die Tabellen und Ansichten an, die die aktuelle Anwendung benötigt. Dadurch werden die spätere Berechnung von Berechtigungen, der Seitenaufbau und die laufende Pflege übersichtlicher.

:::

## Datenbanktabellen auswählen

Nachdem Sie die Verbindungsinformationen eingegeben haben, können Sie auf „Load Collections“ klicken, um die verfügbaren Tabellen und Ansichten aus MariaDB einzulesen. Die eingelesenen Ergebnisse werden durch das Verbindungskonto, `Database`, `Table prefix` und die Konfiguration von „Collections“ beeinflusst.

Standardmäßig ist „Add all collections“ aktiviert. Das bedeutet, dass alle Tabellen und Ansichten im aktuellen Bereich angebunden werden. Wenn Sie nur bestimmte Objekte anbinden möchten, deaktivieren Sie „Add all collections“ und wählen Sie anschließend die gewünschten Tabellen oder Ansichten in der Liste aus.

![20260709204452](https://static-docs.nocobase.com/20260709204452.png)

:::warning Hinweis

Eine einzelne externe Datenquelle kann höchstens 500 Tabellen oder Ansichten gleichzeitig anbinden. Wenn MariaDB viele Objekte enthält, empfiehlt es sich, den Umfang zunächst über `Database`, `Table prefix` oder „Collections“ einzugrenzen.

:::

## Synchronisierung und Feldkonfiguration

Die Tabellenstruktur der externen MariaDB wird auf Datenbankseite verwaltet. NocoBase erstellt in der externen MariaDB keine Felder, ändert keine Feldtypen und löscht keine echten Felder.

Wenn sich die Tabellenstruktur auf der MariaDB-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um die Tabellen- und Feldmetadaten erneut einzulesen. Bei der Synchronisierung werden die in NocoBase gespeicherten Informationen zu Datentabellen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und Feldtypzuordnungen aktualisiert. Echte Tabellen oder Daten in MariaDB werden dabei nicht gelöscht.

Nach der Feldsynchronisierung können Sie in NocoBase den Feldtitel, den Feldtyp (Field type) und die Feldkomponente (Field interface) konfigurieren. Wenn Sie NocoBase-Beziehungsfelder anlegen müssen, werden auch deren Beziehungsmetadaten in NocoBase gespeichert; in der MariaDB-Tabelle wird nicht automatisch ein echter Fremdschlüsselfeld hinzugefügt.

## Feldtypzuordnung

NocoBase ordnet MariaDB-Feldtypen automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Die gängigen Feldzuordnungen von MariaDB entsprechen im Wesentlichen denen von MySQL. Die Darstellungsweise in der Benutzeroberfläche kann in der Feldkonfiguration angepasst werden.

Häufige Zuordnungen:

| MariaDB-Feldtyp | NocoBase Field type | Verfügbare Field interface |
| --- | --- | --- |
| `TINYINT`, `SMALLINT`, `MEDIUMINT` | `integer`, `boolean`, `sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `INT`, `INTEGER` | `integer`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Select, Radio group. |
| `BIGINT` | `bigInt`, `snowflakeId`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `FLOAT`, `DOUBLE` | `float` | Number, Percent. |
| `DECIMAL` | `decimal` | Number, Percent, Currency. |
| `CHAR`, `VARCHAR` | `string`, `uuid`, `nanoid`, `encryption` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `DATETIME` | `datetimeNoTz`, `datetimeTz`, `date` | Date, Time, Created at, Updated at. |
| `TIMESTAMP` | `datetimeTz`, `date` | Date, Time, Created at, Updated at. |
| `YEAR` | `string`, `integer` | Input, Integer, Date. |
| `JSON` | `json`, `array` | JSON. |

:::warning Hinweis

Nicht unterstützte MariaDB-Feldtypen werden in der Feldkonfiguration separat angezeigt. Solche Felder können erst nach einer entsprechenden Anpassung durch die Entwicklung in NocoBase als normale Felder verwendet werden.

:::

## Primärschlüssel und eindeutige Datensatzkennung

Für Datentabellen, die in Seitenblöcken angezeigt und bearbeitet werden, wird ein Primärschlüssel oder ein eindeutiges Feld empfohlen. NocoBase verwendet bevorzugt den Primärschlüssel als eindeutige Kennung eines Datensatzes.

Wenn eine Ansicht, eine Tabelle ohne Primärschlüssel oder eine Tabelle mit zusammengesetztem Primärschlüssel angebunden wird, müssen Sie in der Konfiguration der Datentabelle manuell „Record unique key“ festlegen. Ohne eine verfügbare eindeutige Kennung können Seitenblöcke Datensätze möglicherweise nicht korrekt anzeigen, bearbeiten oder löschen.

![20260709205835](https://static-docs.nocobase.com/20260709205835.png)
![20260709205854](https://static-docs.nocobase.com/20260709205854.png)

## Weiterführende Links

- [Externe Datenbanken](./index.md) — Allgemeine Informationen zur Konfiguration und Verwaltung externer Datenbanken
- [Datenquellenverwaltung](../data-source-manager/index.md) — Informationen zum Zugriff auf Datenquellen und zu deren Verwaltung
- [Datentabellenfelder](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen