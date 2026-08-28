---
pkg: "@nocobase/plugin-data-source-external-mariadb"
title: "Externe Datenquelle – MariaDB"
description: "Erfahren Sie, wie Sie MariaDB als externe Datenbank in NocoBase einbinden, einschließlich unterstützter Versionen, Plugin-Installation, Verbindungskonfiguration, Tabellenumfang, Berechtigungen und Feldzuordnung."
keywords: "Externe Datenquelle,MariaDB,externe Datenbank,Feldzuordnung,NocoBase"
---

# MariaDB

## Einführung

MariaDB kann als externe Datenbank in NocoBase eingebunden werden. Nach der Einbindung liest NocoBase die Tabellen, Felder und Ansichten aus MariaDB aus und verwendet sie als Datentabellen in der externen Datenquelle.

Im Gegensatz zur [Hauptdatenbank](../data-source-main/index.md) wird die tatsächliche Tabellenstruktur der externen MariaDB weiterhin vom ursprünglichen Geschäftssystem, Datenbank-Client oder Migrationsskript verwaltet. NocoBase liest die Struktur aus, speichert Feldmetadaten und konfiguriert Seitenbereiche, Berechtigungen, Workflows und APIs.

| Konfiguration | Beschreibung |
| --- | --- |
| Unterstützte Version | MariaDB >= 10.3. |
| Kommerzielle Versionen | Unterstützt in der Standard-, Professional- und Enterprise-Edition. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-external-mariadb`. |
| Kompatibles Protokoll | Die Verbindung erfolgt über das MySQL-Protokoll. Die Feldzuordnung folgt weitgehend der MySQL-kompatiblen Logik. |

Die Verwendung einer externen MariaDB eignet sich insbesondere für folgende Szenarien:

- Einbindung der MariaDB-Datenbank vorhandener ERP-, MES-, WMS-, CRM- und anderer Geschäftssysteme
- Aufbau einer Verwaltungsoberfläche mit NocoBase, ohne historische Daten zu migrieren
- Steuerung von Berechtigungen, Verarbeitung von Workflows, Korrektur von Daten oder Erstellung von Berichten für vorhandene Tabellen
- Weiterhin Verwaltung der Datenbankstruktur durch DBAs, Migrationsskripte oder das ursprüngliche System

:::warning Hinweis

Die externe MariaDB ist keine Systemdatenbank von NocoBase. NocoBase übernimmt weder deren Sicherung, Wiederherstellung und Migration noch Änderungen an der Tabellenstruktur.

:::

## Plugin installieren

Dieses Plugin ist ein kommerzielles Plugin. Ausführliche Informationen zur Aktivierung finden Sie im [Leitfaden zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).

## Datenquelle hinzufügen

Klicken Sie in der „Datenquellenverwaltung“ auf „Add new“, wählen Sie MariaDB aus und geben Sie anschließend die Verbindungsinformationen ein.

![20260709204413](https://static-docs.nocobase.com/20260709204413.png)

Häufig verwendete Verbindungseinstellungen:

| Einstellung | Beschreibung |
| --- | --- |
| Data source name | Bezeichner der Datenquelle zur Verwendung in Seitenbereichen, Berechtigungen, Workflows und APIs. Nach der Erstellung kann dieser nicht mehr geändert werden. |
| Data source display name | Name, unter dem die Datenquelle in der Benutzeroberfläche angezeigt wird. Verwenden Sie möglichst einen für Fachanwender verständlichen Namen, z. B. „ERP MariaDB“ oder „Auftragsdatenbank“. |
| Host / Port | Hostadresse und Port der MariaDB. Der Standardport ist normalerweise `3306`. |
| Database | Name der MariaDB-Datenbank, mit der eine Verbindung hergestellt werden soll. |
| Username / Password | Benutzername und Passwort für die Verbindung mit MariaDB. NocoBase kann nur auf Objekte zugreifen, für die dieses Konto berechtigt ist. Es erteilt keine Berechtigungen und liest keine privaten Objekte anderer Konten. |
| Table prefix | Präfix der Tabellennamen. Nach der Konfiguration liest NocoBase nur Tabellen und Ansichten, die diesem Präfix entsprechen, und erzeugt in NocoBase Tabellennamen ohne Präfix. |
| Collections / Add all collections | Steuert den Umfang der Einbindung. Wenn „Add all collections“ aktiviert ist, bindet NocoBase alle Tabellen und Ansichten im aktuellen Bereich ein. Wenn die Option deaktiviert ist, werden nur die unter „Collections“ ausgewählten Objekte eingebunden. |
| Enabled the data source | Legt fest, ob diese Datenquelle aktiviert ist. Nach der Deaktivierung bleibt die Konfiguration erhalten, aber Seitenbereiche, Berechtigungen, Workflows und APIs können nicht mehr auf ihre Daten zugreifen. |

:::tip Tipp

Wenn MariaDB viele Objekte enthält, schränken Sie den Umfang vorzugsweise über `Database`, `Table prefix` und „Collections“ ein. Binden Sie nur die Tabellen und Ansichten ein, die von der aktuellen Anwendung verwendet werden. Dadurch werden die spätere Berechtigungskonfiguration, der Seitenaufbau und die laufende Pflege erheblich vereinfacht.

:::

## Daten tabellen auswählen

Nachdem Sie die Verbindungsinformationen eingegeben haben, können Sie auf „Load Collections“ klicken, um die verfügbaren Tabellen und Ansichten aus MariaDB zu laden. Das Ergebnis wird durch das Verbindungskonto, `Database`, `Table prefix` und die Konfiguration von „Collections“ beeinflusst.

Standardmäßig ist „Add all collections“ aktiviert. Damit werden alle Tabellen und Ansichten im aktuellen Bereich eingebunden. Wenn Sie nur bestimmte Objekte einbinden möchten, deaktivieren Sie „Add all collections“ und wählen Sie anschließend die gewünschten Tabellen oder Ansichten in der Liste aus.

![20260709204452](https://static-docs.nocobase.com/20260709204452.png)

:::warning Hinweis

Eine einzelne externe Datenquelle kann höchstens 500 Tabellen oder Ansichten gleichzeitig einbinden. Wenn MariaDB viele Objekte enthält, empfiehlt es sich, den Umfang zunächst über `Database`, `Table prefix` oder „Collections“ einzuschränken.

:::

## Synchronisieren und Felder konfigurieren

Die Tabellenstruktur der externen MariaDB wird auf Datenbankseite verwaltet. NocoBase erstellt in der externen MariaDB keine Felder, ändert keine Feldtypen und löscht keine realen Felder.

Wenn sich die Tabellenstruktur auf der MariaDB-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um die Tabellen- und Feldmetadaten erneut einzulesen. Die Synchronisierung aktualisiert die in NocoBase gespeicherten Informationen zu Datentabellen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und der Zuordnung von Feldtypen. Sie löscht jedoch weder reale Tabellen noch Daten in MariaDB.

Nach der Feldsynchronisierung können Sie in NocoBase die Feldbezeichnung, den Feldtyp (Field type) und die Feldschnittstelle (Field interface) konfigurieren. Wenn Sie in NocoBase ein Beziehungsfeld erstellen müssen, werden auch die Beziehungsmetadaten in NocoBase gespeichert. In der MariaDB-Tabelle wird dabei nicht automatisch ein reales Fremdschlüsselfeld hinzugefügt.

## Zuordnung von Feldtypen

NocoBase ordnet MariaDB-Feldtypen automatisch einem geeigneten Field type und einer geeigneten Field interface zu. Die gängigen Feldzuordnungen von MariaDB entsprechen im Wesentlichen denen von MySQL. Die Darstellungsweise in der Benutzeroberfläche kann in der Feldkonfiguration angepasst werden.

Häufige Zuordnungen:

| MariaDB-Feldtyp | NocoBase Field type | Verfügbare Field interfaces |
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

Nicht unterstützte MariaDB-Feldtypen werden in der Feldkonfiguration separat angezeigt. Diese Felder können erst nach entsprechender Entwicklungsanpassung als normale Felder in NocoBase verwendet werden.

:::

## Primärschlüssel und eindeutige Datensatzkennung

Für Datentabellen, die in Seitenbereichen angezeigt und bearbeitet werden, wird ein Primärschlüssel oder ein eindeutiges Feld empfohlen. NocoBase verwendet bevorzugt den Primärschlüssel als eindeutige Kennung eines Datensatzes.

Wenn Sie eine Ansicht, eine Tabelle ohne Primärschlüssel oder eine Tabelle mit zusammengesetztem Primärschlüssel einbinden, müssen Sie in der Datenkonfiguration manuell „Record unique key“ festlegen. Wenn keine geeignete eindeutige Kennung vorhanden ist, können Seitenbereiche Datensätze möglicherweise nicht korrekt anzeigen, bearbeiten oder löschen.

![20260709205835](https://static-docs.nocobase.com/20260709205835.png)
![20260709205854](https://static-docs.nocobase.com/20260709205854.png)

## Verwandte Links

- [Externe Datenbanken](./index.md) — Informationen zur allgemeinen Konfiguration und Verwaltung externer Datenbanken
- [Datenquellenverwaltung](../data-source-manager/index.md) — Informationen zum Zugriff auf Datenquellen und zur Verwaltung von Datenquellen
- [Felder von Datentabellen](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen