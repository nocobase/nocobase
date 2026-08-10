---
pkg: "@nocobase/plugin-data-source-external-doris"
title: "Externe Datenquelle – Doris"
description: "Erfahren Sie, wie Sie Doris als externe Datenbank an NocoBase anbinden, einschließlich des MySQL-kompatiblen Ports, des FE query_port, des Tabellenumfangs, schreibgeschützter Analyseszenarien und der Feldzuordnung."
keywords: "Externe Datenquelle,Doris,externe Datenbank,MySQL-kompatibler Port,FE query_port,Berichte,Feldzuordnung,NocoBase"
---

# Doris

## Einführung

Doris kann als externe Datenbank an NocoBase angebunden werden. Nach der Anbindung liest NocoBase die Tabellen, Felder und Ansichten aus Doris und verwendet sie als Datentabellen in der externen Datenquelle.

Doris eignet sich besonders für analytische Abfragen, Detaildaten in breiten Tabellen, Kennzahlen und Berichtsdarstellungen. Im Gegensatz zu transaktionalen Datenbanken eignet sich Doris nicht als Datenquelle für häufiges Anlegen, Bearbeiten und Löschen von Geschäftsdaten in NocoBase.

| Konfigurationselement | Beschreibung |
| --- | --- |
| Unterstützte Version | Doris >= 2.1.0. |
| Kommerzielle Version | Wird von der Enterprise Edition unterstützt. |
| Zugehöriges Plugin | `@nocobase/plugin-data-source-external-doris`. |
| Verbindungsmethode | Verwendung des MySQL-kompatiblen Ports von Doris, also des FE query_port. |
| Verwendungsempfehlung | Hauptsächlich zum Anzeigen, Filtern, Aggregieren und Darstellen von Berichten. |

Geeignete Einsatzszenarien für eine externe Doris-Datenquelle:

- Anbindung von Detailtabellen, Aggregationstabellen, breiten Tabellen oder Kennzahlentabellen aus dem Data Warehouse
- Erstellung von Betriebs-Dashboards, Statistikberichten oder Abfrageseiten in NocoBase
- Bereitstellung eines schreibgeschützten Abfragezugangs für Fachanwender, um den direkten Zugriff über Datenbank-Clients zu reduzieren
- Steuerung von Berechtigungen und visuelle Darstellung vorhandener Doris-Daten

:::warning Hinweis

Doris sollte in NocoBase als schreibgeschützte Analysedatenquelle verwendet werden. Verwenden Sie sie nicht als Datenquelle zum Schreiben in reguläre Geschäftstabellen. Außerdem wird empfohlen, auf Seiten keine Vorgänge zum Anlegen, Bearbeiten oder Löschen zu konfigurieren.

:::

## Plugin installieren

Dieses Plugin ist ein kommerzielles Plugin. Ausführliche Informationen zur Aktivierung finden Sie unter: [Leitfaden zur Aktivierung kommerzieller Plugins](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Datenquelle hinzufügen

Klicken Sie in der „Datenquellenverwaltung“ auf „Add new“, wählen Sie Doris aus und geben Sie anschließend die Verbindungsinformationen ein.
![20260709211333](https://static-docs.nocobase.com/20260709211333.png)

Häufig verwendete Verbindungseinstellungen:

| Einstellung | Beschreibung |
| --- | --- |
| Data source name | Der Bezeichner der Datenquelle, der zur Referenzierung in Seitenbereichen, Berechtigungen, Workflows und APIs verwendet wird. Nach der Erstellung kann er nicht mehr geändert werden. |
| Data source display name | Der in der Benutzeroberfläche angezeigte Name der Datenquelle. Es wird empfohlen, einen für Fachanwender verständlichen Namen zu verwenden, z. B. „Doris Data Warehouse“ oder „Kennzahlen-Datenbank“. |
| Host / Port | Die Adresse des Doris-FE und der MySQL-kompatible Port, also `query_port`. Geben Sie nicht den HTTP-Port ein. |
| Database | Der Name der zu verbindenden Doris-Datenbank. |
| Username / Password | Benutzername und Passwort für die Verbindung mit Doris. NocoBase kann nur auf Objekte zugreifen, für die dieses Konto über Berechtigungen verfügt. Es werden weder Berechtigungen erteilt noch private Objekte anderer Konten gelesen. |
| Table prefix | Präfix der Tabellennamen. Nach der Konfiguration liest NocoBase nur Tabellen, die diesem Präfix entsprechen, und erstellt in NocoBase Tabellennamen ohne Präfix. |
| Enabled the data source | Gibt an, ob diese Datenquelle aktiviert ist. Nach der Deaktivierung bleibt die Konfiguration erhalten, aber Seitenbereiche, Berechtigungen, Workflows und APIs können ihre Daten nicht mehr lesen. |

:::tip Hinweis

Das Doris-Plugin stellt die Verbindung über das MySQL-kompatible Protokoll her. Vergewissern Sie sich vor der Konfiguration, dass `query_port` des Doris-FE von NocoBase aus erreichbar ist und das Konto über Leseberechtigungen für die Metadaten der Zieldatenbank, -tabellen und -spalten verfügt.

:::

## Umfang der Anbindung

Die Doris-Seite bietet keine Tabelle zur Auswahl von „Collections“. Der Umfang der Anbindung wird hauptsächlich durch `Database`, die Berechtigungen des Verbindungskontos und `Table prefix` gesteuert.

Wenn Doris viele Tabellen enthält, wird empfohlen, eigens für NocoBase eine Datenbank, ein Konto oder ein Tabellenpräfix einzurichten und nur die Tabellen bereitzustellen, die die aktuelle Anwendung anzeigen und auswerten muss.

:::warning Hinweis

Eine einzelne externe Datenquelle kann höchstens 500 Datentabellen oder Ansichten gleichzeitig anbinden. Wenn Doris viele Objekte enthält, wird empfohlen, den Umfang zunächst über die Datenbank, Kontoberechtigungen oder `Table prefix` einzuschränken.

:::

## Synchronisierung und Konfiguration von Feldern

Die Tabellenstruktur der externen Doris-Datenquelle wird auf Datenbankseite verwaltet. NocoBase erstellt in der externen Doris-Datenbank keine Felder, ändert keine Feldtypen und löscht keine realen Felder.

Wenn sich die Tabellenstruktur auf Doris-Seite ändert, können Sie in der Datenquelle „Sync from database“ ausführen, um die Tabellen- und Feldmetadaten erneut einzulesen. Die Synchronisierung aktualisiert die in NocoBase gespeicherten Informationen zu Datentabellen, Feldern, Primärschlüsseln, eindeutigen Schlüsseln und Feldtypzuordnungen, löscht jedoch weder reale Tabellen noch Daten in Doris.

Nach der Synchronisierung der Felder können Sie in NocoBase die Feldtitel, den Feldtyp (Field type) und die Feldkomponente (Field interface) konfigurieren. Wenn Sie NocoBase-Beziehungsfelder erstellen müssen, werden die Beziehungsmetadaten ebenfalls in NocoBase gespeichert. In der Doris-Tabelle wird dabei nicht automatisch ein reales Fremdschlüsselfeld angelegt.

## Feldtypzuordnung

NocoBase ordnet Doris-Feldtypen anhand der MySQL-Kompatibilitätslogik und der Doris-spezifischen Typen geeigneten Field types und Field interfaces zu. Die Darstellungsweise in der Benutzeroberfläche kann in der Feldkonfiguration angepasst werden.

Häufige Zuordnungen:

| Doris-Feldtyp | NocoBase Field type | Verfügbare Field interfaces |
| --- | --- | --- |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `LARGEINT` | `bigInt` | Integer。 |
| `FLOAT` | `float`、`sort` | Number、Percent、Sort。 |
| `DOUBLE` | `double`、`sort` | Number、Percent、Sort。 |
| `DECIMAL`、`DECIMALV3` | `decimal` | Number、Percent、Currency。 |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `CHAR` | `string` | Input、Email、Phone。 |
| `VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT`、`STRING` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE`、`DATEV2` | `date` | Date。 |
| `DATETIME`、`DATETIMEV2` | `datetime` | Date、Time、Created at、Updated at。 |
| `JSON`、`JSONB` | `json` | JSON。 |
| `HLL`、`BITMAP`、`QUANTILE_STATE`、`AGG_STATE` | `json` | JSON。 |
| `VARIANT`、`ARRAY`、`MAP`、`STRUCT` | `json` | JSON。 |
| `IPV4`、`IPV6` | `string` | Input。 |

`VARIANT` ist ein dynamischer Typ, der ab Apache Doris 2.1.0 bereitgestellt wird. Bei Verwendung einer Doris-Version unter 2.1.0 können Felder dieses Typs nicht angebunden werden.

:::warning Hinweis

Aggregationsstatus-Typen, semi-strukturierte Typen und komplexe Typen in Doris eignen sich eher zur Anzeige oder Fehlersuche und nicht unbedingt als Eingabefelder in Formularen. Bei komplexen Typen wird empfohlen, auf Doris-Seite geeignete Ansichten oder Detailtabellen für die fachliche Anzeige bereitzustellen und diese anschließend an NocoBase anzubinden.

:::

## Primärschlüssel und eindeutige Datensatzkennung

Das Datenmodell und das Schlüsselmodell von Doris entsprechen nicht unbedingt der fachlichen eindeutigen Kennung. Für Datentabellen, die in Seitenbereichen angezeigt werden, wird weiterhin empfohlen, ein Feld bereitzustellen, mit dem sich Datensätze eindeutig identifizieren lassen.

Wenn eine Tabelle oder Ansicht ohne eindeutiges Feld angebunden wird, müssen Sie in der Datenbankkonfiguration manuell „Record unique key“ festlegen. Wenn keine geeignete eindeutige Kennung vorhanden ist, können Seitenbereiche Datensatzdetails möglicherweise nicht korrekt anzeigen und eignen sich nicht für die Konfiguration von Bearbeitungs- oder Löschvorgängen.

![20260709211439](https://static-docs.nocobase.com/20260709211439.png)
![20260709211454](https://static-docs.nocobase.com/20260709211454.png)

## Weiterführende Links

- [Externe Datenbanken](./index.md) — Allgemeine Konfigurations- und Verwaltungshinweise zu externen Datenbanken
- [Datenquellenverwaltung](../data-source-manager/index.md) — Informationen zum Zugriff auf und zur Verwaltung von Datenquellen
- [Datenbankfelder](../data-modeling/collection-fields/index.md) — Informationen zu Feldtypen und Feldzuordnungen