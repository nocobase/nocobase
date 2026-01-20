:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Sammlungsübersicht

NocoBase bietet eine einzigartige DSL (Domain-Specific Language) zur Beschreibung von Datenstrukturen, die als *Sammlung* bezeichnet wird. Diese vereinheitlicht Datenstrukturen aus verschiedenen Quellen und schafft so eine zuverlässige Grundlage für Datenmanagement, -analyse und -anwendungen.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

Um verschiedene Datenmodelle bequem nutzen zu können, unterstützt NocoBase die Erstellung folgender Sammlungsarten:

- [Standard-Sammlung](/data-sources/data-source-main/general-collection): Enthält integrierte, häufig verwendete Systemfelder.
- [Vererbungs-Sammlung](/data-sources/data-source-main/inheritance-collection): Sie können eine übergeordnete Sammlung erstellen und davon eine untergeordnete Sammlung ableiten. Die untergeordnete Sammlung erbt die Struktur der übergeordneten Sammlung und kann zusätzlich eigene Spalten definieren.
- [Baum-Sammlung](/data-sources/collection-tree): Eine Sammlung mit Baumstruktur, die derzeit nur das Adjazenzlisten-Design unterstützt.
- [Kalender-Sammlung](/data-sources/calendar/calendar-collection): Dient zur Erstellung von Sammlungen für kalenderbezogene Ereignisse.
- [Datei-Sammlung](/data-sources/file-manager/file-collection): Dient zur Verwaltung von Dateispeicher.
- : Wird für dynamische Ausdrucksszenarien in Workflows verwendet.
- [SQL-Sammlung](/data-sources/collection-sql): Ist keine tatsächliche Datenbank-Sammlung, sondern stellt SQL-Abfragen schnell und strukturiert dar.
- [Ansichts-Sammlung](/data-sources/collection-view): Verbindet sich mit bestehenden Datenbankansichten.
- [Externe Sammlung](/data-sources/collection-fdw): Ermöglicht dem Datenbanksystem den direkten Zugriff und die Abfrage von Daten in externen Datenquellen, basierend auf der FDW-Technologie.