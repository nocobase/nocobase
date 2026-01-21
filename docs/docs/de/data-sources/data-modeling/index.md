:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Übersicht

Die Datenmodellierung ist ein entscheidender Schritt beim Entwurf von Datenbanken. Sie umfasst die tiefgehende Analyse und Abstraktion verschiedener Datentypen der realen Welt und ihrer wechselseitigen Beziehungen. Dabei versuchen wir, die intrinsischen Verbindungen zwischen den Daten aufzudecken und sie formal in Datenmodellen zu beschreiben, wodurch das Fundament für die Datenbankstruktur von Informationssystemen gelegt wird. NocoBase ist eine datenmodellgesteuerte Plattform, die folgende Merkmale aufweist:

## Unterstützung für Datenzugriff aus verschiedenen Quellen

Die Datenquellen von NocoBase können gängige Datenbanken, API- (SDK-) Plattformen und Dateien sein.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase bietet ein [Datenquellen-Manager-Plugin](/data-sources/data-source-manager) zur Verwaltung verschiedener Datenquellen und ihrer Sammlungen. Das Datenquellen-Manager-Plugin stellt lediglich eine Verwaltungsoberfläche für alle Datenquellen bereit und bietet nicht die Möglichkeit, direkt auf Datenquellen zuzugreifen. Es muss in Verbindung mit verschiedenen Datenquellen-Plugins verwendet werden. Die derzeit unterstützten Datenquellen umfassen:

- [Hauptdatenbank](/data-sources/data-source-main): Die Hauptdatenbank von NocoBase, die relationale Datenbanken wie MySQL, PostgreSQL und MariaDB unterstützt.
- [KingbaseES](/data-sources/data-source-kingbase): Verwendet die KingbaseES-Datenbank als Datenquelle, die sowohl als Hauptdatenbank als auch als externe Datenbank genutzt werden kann.
- [Externe MySQL](/data-sources/data-source-external-mysql): Verwendet eine externe MySQL-Datenbank als Datenquelle.
- [Externe MariaDB](/data-sources/data-source-external-mariadb): Verwendet eine externe MariaDB-Datenbank als Datenquelle.
- [Externe PostgreSQL](/data-sources/data-source-external-postgres): Verwendet eine externe PostgreSQL-Datenbank als Datenquelle.
- [Externe MSSQL](/data-sources/data-source-external-mssql): Verwendet eine externe MSSQL- (SQL Server-) Datenbank als Datenquelle.
- [Externe Oracle](/data-sources/data-source-external-oracle): Verwendet eine externe Oracle-Datenbank als Datenquelle.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Bietet vielfältige Datenmodellierungs-Tools

**Einfache Verwaltungsoberfläche für Sammlungen**: Dient zum Erstellen verschiedener Modelle (Sammlungen) oder zum Verbinden mit bestehenden Modellen (Sammlungen).

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Visuelle ER-Diagramm-ähnliche Oberfläche**: Dient dazu, Entitäten und deren Beziehungen aus Benutzer- und Geschäftsanforderungen zu extrahieren. Sie bietet eine intuitive und leicht verständliche Methode zur Beschreibung von Datenmodellen. Mithilfe von ER-Diagrammen können Sie die wichtigsten Datenentitäten im System und deren Beziehungen klarer erfassen.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Unterstützt verschiedene Arten von Sammlungen

| Sammlung | Beschreibung |
| - | - |
| [Allgemeine Sammlung](/data-sources/data-source-main/general-collection) | Enthält gängige Systemfelder |
| [Kalender-Sammlung](/data-sources/calendar/calendar-collection) | Zum Erstellen von kalenderbezogenen Ereignistabellen |
| Kommentar-Sammlung | Zum Speichern von Kommentaren oder Feedback zu Daten |
| [Baumstruktur-Sammlung](/data-sources/collection-tree) | Baumstrukturierte Sammlung, unterstützt derzeit nur das Adjazenzlistenmodell |
| [Datei-Sammlung](/data-sources/file-manager/file-collection) | Für die Verwaltung der Dateispeicherung |
| [SQL-Sammlung](/data-sources/collection-sql) | Ist keine tatsächliche Datenbanktabelle, sondern stellt SQL-Abfragen schnell strukturiert dar |
| [Datenbankansicht verbinden](/data-sources/collection-view) | Verbindet sich mit bestehenden Datenbankansichten |
| Ausdrucks-Sammlung | Für dynamische Ausdrucksszenarien in Workflows |
| [Fremddaten verbinden](/data-sources/collection-fdw) | Ermöglicht dem Datenbanksystem den direkten Zugriff auf und die Abfrage von Daten in externen Datenquellen basierend auf der FDW-Technologie |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Weitere Informationen finden Sie im Kapitel „[Sammlung / Übersicht](/data-sources/data-modeling/collection)“.

## Bietet eine Vielzahl von Feldtypen

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Weitere Informationen finden Sie im Kapitel „[Sammlungsfelder / Übersicht](/data-sources/data-modeling/collection-fields)“.