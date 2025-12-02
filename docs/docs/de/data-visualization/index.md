---
pkg: "@nocobase/plugin-data-visualization"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Übersicht

Das NocoBase Datenvisualisierungs-Plugin bietet visuelle Datenabfragen und eine Vielzahl von Diagrammkomponenten. Durch einfache Konfiguration können Sie schnell Visualisierungs-Dashboards erstellen, Dateneinblicke präsentieren und mehrdimensionale Datenanalyse und -anzeige unterstützen.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Grundlegende Konzepte
- Diagrammblock: Eine konfigurierbare Diagrammkomponente auf einer Seite, die Datenabfragen, Diagrammoptionen und Interaktionsereignisse unterstützt.
- Datenabfrage (Builder / SQL): Konfigurieren Sie visuell mit dem Builder oder schreiben Sie SQL, um Daten abzurufen.
- Kennzahlen (Measures) und Dimensionen (Dimensions): Kennzahlen werden für die numerische Aggregation verwendet; Dimensionen dienen der Gruppierung (z. B. Datum, Kategorie, Region).
- Feldzuordnung: Ordnen Sie Abfrageergebnisspalten den Kernfeldern des Diagramms zu, wie `xField`, `yField`, `seriesField` oder `Category / Value`.
- Diagrammoptionen (Basic / Custom): Basic konfiguriert gängige Eigenschaften visuell; Custom gibt eine vollständige ECharts `option` über JS zurück.
- Abfrage ausführen: Führen Sie die Abfrage im Konfigurationsbereich aus, um Daten abzurufen; wechseln Sie zwischen Tabelle / JSON, um die zurückgegebenen Daten zu überprüfen.
- Vorschau und Speichern: Die Vorschau ist ein temporärer Effekt; nach dem Klicken auf "Speichern" wird die Konfiguration in die Datenbank geschrieben und offiziell wirksam.
- Kontextvariablen: Verwenden Sie Kontextinformationen wie Seite, Benutzer und Filter (z. B. `{{ ctx.user.id }}`) für Abfragen und die Diagrammkonfiguration wieder.
- Seitenfilter und Verknüpfung: Seitenweite "Filterblöcke" sammeln einheitliche Bedingungen, die automatisch in Diagrammabfragen zusammengeführt werden und verknüpfte Diagramme aktualisieren.
- Interaktionsereignisse: Registrieren Sie Ereignisse über `chart.on`, um Aktionen wie Hervorheben, Navigation und Drill-down zu ermöglichen.

## Installation
Datenvisualisierung ist ein integriertes NocoBase-Plugin, das sofort einsatzbereit ist und keine separate Installation erfordert.