:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Übersicht

Die Datenmodellierung ist ein entscheidender Schritt beim Entwurf von Datenbanken. Sie beinhaltet die tiefgehende Analyse und Abstraktion verschiedener Datentypen und ihrer Beziehungen in der realen Welt. In diesem Prozess versuchen wir, die inneren Zusammenhänge zwischen den Daten aufzudecken und sie als Datenmodelle formal zu beschreiben. Dies legt den Grundstein für die Datenbankstruktur eines Informationssystems. NocoBase ist eine datenmodellgesteuerte Plattform, die sich durch folgende Merkmale auszeichnet:

## Unterstützung für Datenzugriff aus verschiedenen Quellen

Die Datenquellen von NocoBase können gängige Datenbanken, API-/SDK-Plattformen und Dateien sein.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase bietet ein [Datenquellen-Manager-Plugin](/data-sources/data-source-manager) zur Verwaltung verschiedener Datenquellen und ihrer Sammlungen. Das Datenquellen-Manager-Plugin stellt lediglich eine Verwaltungsoberfläche für alle Datenquellen bereit und ermöglicht nicht den direkten Zugriff auf Datenquellen. Es muss in Verbindung mit verschiedenen Datenquellen-Plugins verwendet werden. Die derzeit unterstützten Datenquellen umfassen:

- [Hauptdatenbank](/data-sources/data-source-main): Die Hauptdatenbank von NocoBase, die relationale Datenbanken wie MySQL, PostgreSQL und MariaDB unterstützt.
- [KingbaseES](/data-sources/data-source-kingbase): Verwenden Sie die KingbaseES-Datenbank als Datenquelle, die sowohl als Hauptdatenbank als auch als externe Datenbank genutzt werden kann.
- [Externe MySQL](/data-sources/data-source-external-mysql): Verwenden Sie eine externe MySQL-Datenbank als Datenquelle.
- [Externe MariaDB](/data-sources/data-source-external-mariadb): Verwenden Sie eine externe MariaDB-Datenbank als Datenquelle.
- [Externe PostgreSQL](/data-sources/data-source-external-postgres): Verwenden Sie eine externe PostgreSQL-Datenbank als Datenquelle.
- [Externe MSSQL](/data-sources/data-source-external-mssql): Verwenden Sie eine externe MSSQL (SQL Server)-Datenbank als Datenquelle.
- [Externe Oracle](/data-sources/data-source-external-oracle): Verwenden Sie eine externe Oracle-Datenbank als Datenquelle.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Vielfältige Datenmodellierungs-Tools

**Einfache Sammlungs-Verwaltungsoberfläche**: Dient zum Erstellen verschiedener Modelle (Sammlungen) oder zum Verbinden mit bestehenden Modellen.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Visuelle Oberfläche im ER-Stil**: Dient dazu, Entitäten und ihre Beziehungen aus Benutzer- und Geschäftsanforderungen zu extrahieren. Sie bietet eine intuitive und leicht verständliche Möglichkeit, Datenmodelle zu beschreiben. Mittels ER-Diagrammen können Sie die wichtigsten Datenentitäten im System und ihre Beziehungen klarer erfassen.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Unterstützung für verschiedene Sammlungstypen

| Sammlung | Beschreibung |
| - | - |
| [Allgemeine Sammlung](/data-sources/data-source-main/general-collection) | Enthält integrierte, gängige Systemfelder. |
| [Kalender-Sammlung](/data-sources/calendar/calendar-collection) | Dient zum Erstellen von kalenderbezogenen Ereignistabellen. |
| Kommentar-Sammlung | Dient zum Speichern von Kommentaren oder Feedback zu Daten. |
| [Baumstruktur-Sammlung](/data-sources/collection-tree) | Eine Baumstruktur-Sammlung, die derzeit nur das Adjazenzlistenmodell unterstützt. |
| [Datei-Sammlung](/data-sources/file-manager/file-collection) | Dient zur Verwaltung der Dateispeicherung. |
| [SQL-Sammlung](/data-sources/collection-sql) | Ist keine tatsächliche Datenbanktabelle, sondern stellt SQL-Abfragen schnell und strukturiert dar. |
| [Datenbankansicht verbinden](/data-sources/collection-view) | Verbindet sich mit bestehenden Datenbankansichten. |
| Ausdrucks-Sammlung | Wird für dynamische Ausdrucksszenarien in Workflows verwendet. |
| [Externe Daten verbinden](/data-sources/collection-fdw) | Ermöglicht den direkten Zugriff und die Abfrage von Daten in externen Datenquellen basierend auf der FDW-Technologie der Datenbank. |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Weitere Informationen finden Sie im Kapitel „[Sammlung / Übersicht](/data-sources/data-modeling/collection)“.

## Vielfältige Feldtypen

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Weitere Informationen finden Sie im Kapitel „[Sammlungsfelder / Übersicht](/data-sources/data-modeling/collection-fields)“.