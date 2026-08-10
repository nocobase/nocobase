---
title: "Datenquellen – Übersicht"
description: "Datenquellen und Datenmodellierung in NocoBase: Hauptdatenbank, externe Datenbanken, REST API, externes NocoBase, Datenquellenverwaltung, reguläre Tabellen, Baumtabellen, SQL-Tabellen und Dateitabellen."
keywords: "Datenquelle,Datenmodellierung,Hauptdatenbank,externe Datenbank,REST API,externes NocoBase,Collection,Baumtabelle,SQL-Tabelle,NocoBase"
---

# Übersicht

Die Datenmodellierung ist ein entscheidender Schritt beim Entwurf einer Datenbank. Sie umfasst die eingehende Analyse und Abstraktion verschiedener Daten aus der realen Welt sowie ihrer Beziehungen zueinander. Dabei versuchen wir, die inhärenten Zusammenhänge zwischen den Daten aufzudecken und sie als Datenmodell formal zu beschreiben, um die Grundlage für die Datenbankstruktur eines Informationssystems zu schaffen. NocoBase ist eine datamodellgetriebene Plattform mit folgenden Merkmalen:

## Unterstützt die Anbindung von Daten aus verschiedenen Quellen

Datenquellen in NocoBase können gängige Datenbanken, API-Plattformen (SDK) und Dateien sein.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase stellt ein [Plugin zur Datenquellenverwaltung](./data-source-manager/index.md) bereit, mit dem die verschiedenen Datenquellen und ihre Datentabellen verwaltet werden können. Das Plugin zur Datenquellenverwaltung bietet lediglich eine Verwaltungsoberfläche für alle Datenquellen, jedoch keine Möglichkeit, Datenquellen anzubinden. Es muss zusammen mit verschiedenen Datenquellen-Plugins verwendet werden. Derzeit werden folgende Datenquellen unterstützt:

- [Hauptdatenquelle](./data-source-main/index.md): NocoBase-Hauptdatenbank; unterstützt PostgreSQL, MySQL, MariaDB, KingbaseES und OceanBase.
- [Externes PostgreSQL](./data-source-external-postgres/index.md): Anbindung einer vorhandenen PostgreSQL-Datenbank.
- [Externes MySQL](./data-source-external-mysql/index.md): Anbindung einer vorhandenen MySQL-Datenbank.
- [Externes MariaDB](./data-source-external-mariadb/index.md): Anbindung einer vorhandenen MariaDB-Datenbank.
- [Externes MSSQL](./data-source-external-mssql/index.md): Anbindung einer vorhandenen SQL-Server-Datenbank.
- [Externes KingbaseES](./data-source-kingbase/index.md): Anbindung einer vorhandenen KingbaseES-Datenbank.
- [Externes OceanBase](./external/oceanbase.md): Anbindung einer vorhandenen OceanBase-Datenbank.
- [Externes Oracle](./data-source-external-oracle/index.md): Anbindung einer vorhandenen Oracle-Datenbank.
- [Externes ClickHouse](./external/clickhouse.md): Anbindung einer vorhandenen ClickHouse-Datenbank.
- [Externes Doris](./external/doris.md): Anbindung einer vorhandenen Doris-Datenbank.
- [REST-API-Datenquelle](./data-source-rest-api/index.md): Abbildung der REST API eines Drittsystems als Datenquelle.
- [Externe NocoBase-Datenquelle](./data-source-external-nocobase/index.md): Verbindung zu Datentabellen in einer anderen NocoBase-Anwendung.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Bietet vielfältige Werkzeuge zur Datenmodellierung

**Einfache Verwaltungsoberfläche für Datentabellen**: Zum Erstellen verschiedener Modelle (Datentabellen) oder zum Verbinden mit vorhandenen Modellen (Datentabellen).

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Visualisierung ähnlich einem ER-Diagramm**: Zum Extrahieren von Entitäten und ihren Beziehungen aus Benutzer- und Geschäftsanforderungen. Sie bietet eine intuitive und leicht verständliche Möglichkeit, Datenmodelle zu beschreiben. Mithilfe eines ER-Diagramms lassen sich die wichtigsten Datenentitäten eines Systems und ihre Beziehungen zueinander klarer verstehen.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Unterstützt die Erstellung verschiedener Datentabellen

| Datentabelle | Beschreibung |
| - | - |
| [Reguläre Datentabelle](/data-sources/data-source-main/general-collection) | Enthält häufig verwendete Systemfelder |
| [Kalenderdatentabelle](/data-sources/calendar/calendar-collection) | Zum Erstellen von Ereignistabellen für Kalender |
| [Kommentartabelle](/data-sources/collection-comment/) | Zum Speichern von Kommentaren oder Feedback zu Daten |
| [Baumstrukturtabelle](/data-sources/collection-tree/) | Baumstrukturtabelle, derzeit wird nur das Adjazenzlistenmodell unterstützt |
| [Dateidatentabelle](/data-sources/file-manager/file-collection) | Zur Verwaltung der Dateispeicherung |
| [Verbindung zu einer Datenbankansicht](/data-sources/collection-view/) | Verbindung zu einer vorhandenen Datenbankansicht |
| [SQL-Datentabelle](/data-sources/collection-sql/) | Keine tatsächliche Datenbanktabelle, sondern eine schnelle Möglichkeit, SQL-Abfragen strukturiert darzustellen |
| [Verbindung zu externen Daten](/data-sources/collection-fdw) | Verbindung zu entfernten Datentabellen auf Basis der FDW-Technologie von Datenbanken |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Weitere Informationen finden Sie im Kapitel „[Datentabellen / Übersicht](/data-sources/data-modeling/collection)“.

## Bietet eine große Auswahl an Feldtypen

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Weitere Informationen finden Sie im Kapitel „[Felder von Datentabellen / Übersicht](/data-sources/data-modeling/collection-fields/)“.