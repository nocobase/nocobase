---
pkg: "@nocobase/plugin-data-source-external-clickhouse"
title: "Externe Datenquelle – ClickHouse"
description: "Erfahren Sie, wie Sie ClickHouse als externe Datenbank in NocoBase integrieren, einschließlich MySQL-kompatiblem Port, SSL, Tabellenumfang, schreibgeschützten Analyseszenarien und Feldzuordnung."
keywords: "Externe Datenquelle,ClickHouse,externe Datenbank,MySQL-kompatibler Port,Berichte,Feldzuordnung,NocoBase"
---

# ClickHouse

## Einführung

ClickHouse kann als externe Datenbank in NocoBase integriert werden. Nach der Integration liest NocoBase die Tabellen, Felder und Ansichten aus ClickHouse und verwendet sie als Datentabellen in der externen Datenquelle.

ClickHouse eignet sich besonders für analytische Abfragen, Protokollanalysen, Kennzahlen und Berichte. Im Gegensatz zu Transaktionsdatenbanken eignet es sich nicht als Datenquelle für häufiges Anlegen, Bearbeiten und Löschen von Geschäftsdaten in NocoBase.

| Konfiguration | Beschreibung |
| --- | --- |
| Unterstützte Versionen | ClickHouse >= 20.2. |
| Kommerzielle Version | Wird von der Enterprise Edition unterstützt. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-external-clickhouse`. |
| Verbindungsmethode | Verbindung über den MySQL-kompatiblen Port von ClickHouse. |
| Empfehlung | Hauptsächlich zum Anzeigen, Filtern, Auswerten und Darstellen von Berichten verwenden. |

Geeignete Szenarien für die Verwendung von ClickHouse als externer Datenquelle:

- Integration von Analysedaten wie Protokollen, Tracking-Daten, Kennzahlen und Risikokontrolldaten
- Erstellung von Betriebs-Dashboards, Statistikberichten oder Abfrageseiten in NocoBase
- Bereitstellung eines schreibgeschützten Abfragezugangs für Fachanwender, um den direkten Zugriff über Datenbank-Clients zu reduzieren
- Berechtigungssteuerung und Visualisierung vorhandener ClickHouse-Daten

:::warning Hinweis

ClickHouse sollte in NocoBase als schreibgeschützte Analysedatenquelle verwendet werden. Verwenden Sie es nicht als Datenquelle zum Schreiben in reguläre Geschäftstabellen und konfigurieren Sie auf Seiten möglichst keine Vorgänge zum Anlegen, Bearbeiten oder Löschen.

:::

## Plugin-Installation

Bei diesem Plugin handelt es sich um ein kommerzielles Plugin. Ausführliche Informationen zur Aktivierung finden Sie unter [Aktivierungsleitfaden für kommerzielle Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).

## Datenquelle hinzufügen

Klicken Sie in „Datenquellenverwaltung“ auf „Add new“, wählen Sie ClickHouse aus und geben Sie anschließend die Verbindungsinformationen ein.
![20260709211117](https://static-docs.nocobase.com/20260709211117.png)

Häufig verwendete Verbindungseinstellungen:

| Einstellung | Beschreibung |
| --- | --- |
| Data source name | Bezeichner der Datenquelle zur Verwendung in Seitenblöcken, Berechtigungen, Workflows und APIs. Nach der Erstellung kann er nicht mehr geändert werden. |
| Data source display name | Name, unter dem die Datenquelle in der Benutzeroberfläche angezeigt wird. Verwenden Sie möglichst einen für Fachanwender verständlichen Namen, z. B. „ClickHouse-Protokolldatenbank“ oder „Kennzahlendatenbank“. |
| Host / Port | Hostadresse von ClickHouse und MySQL-kompatibler Port. Geben Sie nicht den HTTP-Port oder den nativen TCP-Port ein. |
| Database | Name der ClickHouse-Datenbank, mit der eine Verbindung hergestellt werden soll. |
| Username / Password | Benutzername und Passwort für die Verbindung mit ClickHouse. NocoBase kann nur auf Objekte zugreifen, für die dieses Konto Berechtigungen besitzt, und erteilt oder liest keine privaten Objekte anderer Konten. |
| Table prefix | Tabellenpräfix. Nach der Konfiguration liest NocoBase nur Tabellen, die diesem Präfix entsprechen, und erzeugt in NocoBase Tabellennamen ohne Präfix. |
| Use SSL | Gibt an, ob SSL aktiviert wird. Für Verbindungen mit ClickHouse Cloud oder in Umgebungen mit gesicherten Verbindungen ist die Aktivierung normalerweise erforderlich. |
| Enabled the data source | Gibt an, ob diese Datenquelle aktiviert ist. Nach der Deaktivierung bleibt die Konfiguration erhalten, aber Seitenblöcke, Berechtigungen, Workflows und APIs können ihre Daten nicht mehr aus dieser Datenquelle lesen. |

:::tip Tipp

Das ClickHouse-Plugin stellt die Verbindung über das MySQL-kompatible Protokoll her. Vergewissern Sie sich vor der Konfiguration, dass der MySQL-kompatible Port des ClickHouse-Dienstes aktiviert ist und Netzwerk, Firewall sowie Kontoberechtigungen den Zugriff von NocoBase erlauben.

:::

## Umfang der Integration

Die ClickHouse-Seite bietet keine Tabelle zur Auswahl von „Collections“. Der Umfang der Integration wird hauptsächlich durch `Database`, die Berechtigungen des Verbindungskontos und `Table prefix` gesteuert.

Wenn ClickHouse viele Tabellen enthält, empfiehlt es sich, für NocoBase eine eigene Datenbank, ein eigenes Konto oder ein Tabellenpräfix einzurichten und nur die Tabellen bereitzustellen, die die aktuelle Anwendung anzeigen und auswerten muss.

:::warning Hinweis

Eine einzelne externe Datenquelle kann höchstens 500 Tabellen oder Ansichten gleichzeitig integrieren. Wenn ClickHouse viele Objekte enthält, sollte der Umfang zunächst über die Datenbank, Kontoberechtigungen oder `Table prefix` eingeschränkt werden.

:::

## Synchronisierung und Konfiguration von Feldern

Die Tabellenstruktur der externen ClickHouse-Datenquelle wird auf Datenbankseite verwaltet. NocoBase erstellt in der externen ClickHouse-Datenbank keine Felder, ändert keine Feldtypen und löscht keine realen Felder.

Wenn sich die Tabellenstruktur auf der ClickHouse-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um die Metadaten der Tabellen und Felder erneut einzulesen. Bei der Synchronisierung werden die in NocoBase gespeicherten Informationen zu Datentabellen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und Feldtypzuordnungen aktualisiert. Reale Tabellen oder Daten in ClickHouse werden jedoch nicht gelöscht.

Nach der Feldsynchronisierung können Sie in NocoBase den Feldtitel, den Feldtyp (Field type) und die Feldkomponente (Field interface) konfigurieren. Wenn Sie in NocoBase Beziehungsfelder erstellen müssen, werden die Beziehungsmetadaten ebenfalls in NocoBase gespeichert; in der ClickHouse-Tabelle wird dadurch nicht automatisch ein reales Fremdschlüsselfeld angelegt.

## Feldtypzuordnung

NocoBase konvertiert ClickHouse-Feldtypen zunächst in einen MySQL-kompatiblen Stil und ordnet sie anschließend einem passenden Field type und Field interface zu. Die Darstellungsweise in der Benutzeroberfläche kann in der Feldkonfiguration angepasst werden.

Häufige Zuordnungen:

| ClickHouse-Feldtyp | NocoBase Field type | Verfügbare Field interfaces |
| --- | --- | --- |
| `Int8`、`Int16`、`Int32`、`UInt8`、`UInt16`、`UInt32` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `Int64`、`UInt64` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `Float32`、`Float64` | `float` | Number、Percent。 |
| `Decimal` | `decimal`、`double` | Number、Percent、Currency。 |
| `String`、`FixedString` | `text`、`string` | Input、Textarea、Markdown、URL。 |
| `Date`、`Date32` | `dateOnly` | Date。 |
| `DateTime`、`DateTime64` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `UUID` | `string`、`uuid` | Input、UUID。 |
| `Bool`、`Boolean` | `integer`、`boolean`、`sort` | Checkbox、Switch、Integer。 |
| `Array` | `json`、`array` | JSON。 |
| `Nullable(...)` | Zuordnung gemäß internem Feldtyp | Abhängig vom internen Feldtyp. |
| `LowCardinality(...)` | Zuordnung gemäß internem Feldtyp | Abhängig vom internen Feldtyp. |

:::warning Hinweis

Einige analytische oder verschachtelte Typen in ClickHouse können möglicherweise nicht direkt normalen Geschäftsfeldern zugeordnet werden. Wenn ein Feldtyp nicht unterstützt wird, können Sie zunächst auf der ClickHouse-Seite eine für die Darstellung geeignete Ansicht oder Abfragetabelle erstellen und diese anschließend in NocoBase integrieren.

:::

## Primärschlüssel und eindeutige Datensatzkennung

Sortierschlüssel und Partitionsschlüssel von ClickHouse entsprechen nicht zwangsläufig der fachlichen eindeutigen Kennung. Für Datentabellen, die in Seitenblöcken angezeigt werden, empfiehlt es sich weiterhin, ein Feld bereitzustellen, mit dem sich ein Datensatz eindeutig bestimmen lässt.

Wenn eine Tabelle oder Ansicht ohne eindeutiges Feld integriert wird, muss in der Datenbankkonfiguration manuell „Record unique key“ festgelegt werden. Wenn keine geeignete eindeutige Kennung vorhanden ist, können Seitenblöcke möglicherweise Datensatzdetails nicht korrekt anzeigen und sind für Bearbeitungs- oder Löschvorgänge nicht geeignet.

![20260709211300](https://static-docs.nocobase.com/20260709211300.png)
![20260709211239](https://static-docs.nocobase.com/20260709211239.png)

## Verwandte Links

- [Externe Datenbanken](./index.md) — Allgemeine Konfigurations- und Verwaltungshinweise zu externen Datenbanken anzeigen
- [Datenquellenverwaltung](../data-source-manager/index.md) — Einstieg und Verwaltung von Datenquellen anzeigen
- [Felder von Datentabellen](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen anzeigen