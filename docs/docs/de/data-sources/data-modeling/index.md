---
title: "Überblick über die Datenmodellierung"
description: "Datenmodellierung: Entwerfen von Datenmodellen, Anbinden verschiedener Datenquellen, Visualisieren von ER-Diagrammen und Erstellen von Datentabellen mit Unterstützung für Haupt- und externe Datenbanken."
keywords: "Datenmodellierung,Collection,Datenmodell,ER-Diagramm,Hauptdatenbank,externe Datenbank,NocoBase"
---

# Überblick

Die Datenmodellierung ist ein wichtiger Schritt beim Entwurf einer Datenbank. Sie umfasst die eingehende Analyse und Abstraktion verschiedener Daten der realen Welt sowie ihrer Beziehungen zueinander. Dabei werden die inneren Zusammenhänge zwischen den Daten aufgedeckt und formal als Datenmodell beschrieben, um die Grundlage für die Datenbankstruktur eines Informationssystems zu schaffen. NocoBase ist eine datenmodellgetriebene Plattform mit folgenden Merkmalen:

## Unterstützung für die Anbindung verschiedener Datenquellen

Datenquellen von NocoBase können gängige Datenbanken, API-(SDK-)Plattformen und Dateien sein.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase stellt ein [Plugin zur Datenquellenverwaltung](/data-sources/data-source-manager) zur Verwaltung verschiedener Datenquellen und ihrer Datentabellen bereit. Das Plugin zur Datenquellenverwaltung bietet lediglich eine Verwaltungsoberfläche für alle Datenquellen, jedoch keine Möglichkeit, Datenquellen anzubinden. Es muss zusammen mit verschiedenen Datenquellen-Plugins verwendet werden. Derzeit werden folgende Datenquellen unterstützt:

- [Hauptdatenbank](/data-sources/data-source-main): Die NocoBase-Hauptdatenbank unterstützt relationale Datenbanken wie MySQL, PostgreSQL und MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): Verwendung der KingbaseES-Datenbank als Datenquelle; sie kann sowohl als Hauptdatenbank als auch als externe Datenbank verwendet werden.
- [Externes MySQL](/data-sources/data-source-external-mysql): Verwendung einer externen MySQL-Datenbank als Datenquelle.
- [Externes MariaDB](/data-sources/data-source-external-mariadb): Verwendung einer externen MariaDB-Datenbank als Datenquelle.
- [Externes PostgreSQL](/data-sources/data-source-external-postgres): Verwendung einer externen PostgreSQL-Datenbank als Datenquelle.
- [Externes MSSQL](/data-sources/data-source-external-mssql): Verwendung einer externen MSSQL-Datenbank (SQL Server) als Datenquelle.
- [Externes Oracle](/data-sources/data-source-external-oracle): Verwendung einer externen Oracle-Datenbank als Datenquelle.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Vielfältige Werkzeuge zur Datenmodellierung

**Einfache Verwaltungsoberfläche für Datentabellen**: Zum Erstellen verschiedener Modelle (Datentabellen) oder zum Verbinden mit vorhandenen Modellen (Datentabellen).

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Visualisierungsoberfläche ähnlich einem ER-Diagramm**: Zum Extrahieren von Entitäten und ihren Beziehungen aus Benutzer- und Geschäftsanforderungen. Sie bietet eine intuitive und leicht verständliche Möglichkeit, Datenmodelle zu beschreiben. Mithilfe von ER-Diagrammen lassen sich die wichtigsten Datenentitäten eines Systems und ihre Beziehungen zueinander klarer verstehen.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Unterstützung für die Erstellung verschiedener Datentabellen

| Datentabelle | Beschreibung |
| - | - |
| [Standarddatentabelle](/data-sources/data-source-main/general-collection) | Enthält häufig verwendete integrierte Systemfelder |
| [Kalenderdatentabelle](/data-sources/calendar/calendar-collection) | Zum Erstellen von Ereignistabellen für Kalender |
| Kommentartabelle | Zum Speichern von Kommentaren oder Feedback zu Daten |
| [Baumstrukturtabelle](/data-sources/collection-tree) | Baumstrukturtabelle, derzeit wird nur das Adjazenzlistenmodell unterstützt |
| [Dateidatentabelle](/data-sources/file-manager/file-collection) | Zur Verwaltung der Dateispeicherung |
| [SQL-Datentabelle](/data-sources/collection-sql) | Keine tatsächliche Datenbanktabelle, sondern eine schnelle strukturierte Darstellung von SQL-Abfragen |
| [Verbundene Datenbankansicht](/data-sources/collection-view) | Zum Verbinden mit vorhandenen Datenbankansichten |
| Ausdrückstabelle | Für dynamische Ausdrucksszenarien in Workflows |
| [Externe Daten anbinden](/data-sources/collection-fdw) | Verbindung mit entfernten Datentabellen auf Basis der datenbankgestützten FDW-Technologie |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Weitere Informationen finden Sie im Kapitel „[Datentabellen / Überblick](/data-sources/data-modeling/collection)“.

## Bietet zahlreiche Feldtypen

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Weitere Informationen finden Sie im Kapitel „[Felder von Datentabellen / Überblick](/data-sources/data-modeling/collection-fields)“.