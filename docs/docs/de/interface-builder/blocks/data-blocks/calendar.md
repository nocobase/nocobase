---
pkg: "@nocobase/plugin-calendar"
title: "Kalender-Block"
description: "Der Kalender-Block stellt Ereignisse und datumsbezogene Daten in einer Kalenderansicht dar – ideal für Terminplanung, Veranstaltungen und ähnliche Szenarien. Konfigurierbar sind Titelfeld, Start- und Endzeit, Anzeige des Mondkalenders sowie Datenbereich."
keywords: "Kalender-Block, Kalenderansicht, Eventmanagement, Terminplanung, Calendar, NocoBase"
---

# Kalender-Block

## Einführung

Der Kalender-Block stellt Ereignisse und datumsbezogene Daten übersichtlich in einer Kalenderansicht dar. Er eignet sich für typische Szenarien wie Terminplanung und Veranstaltungsorganisation.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_27_PM.png)

## Installation

Dieser Block ist ein integriertes Plugin und erfordert keine zusätzliche Installation.

## Block hinzufügen

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_39_PM.png)

Wählen Sie den „Kalender"-Block und geben Sie die zugehörige Datentabelle an, um den Block anzulegen.

## Block-Konfigurationsoptionen

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_38_AM.png)

### Titelfeld

Wird verwendet, um den Titel auf den Kalendereinträgen anzuzeigen.

Aktuell unterstützte Feldtypen sind u. a. `input`, `select`, `phone`, `email`, `radioGroup`, `sequence`. Weitere Typen können über Plugins ergänzt werden.

### Startdatumsfeld

Gibt die Startzeit eines Ereignisses an.

### Enddatumsfeld

Gibt die Endzeit eines Ereignisses an.

### Schnelles Erstellen von Ereignissen

Wenn Sie auf einen leeren Datumsbereich im Kalender klicken, öffnet sich ein Pop-up zum schnellen Erstellen eines Ereignisses.

![](https://static-docs.nocobase.com/Add-new-04-23-2026_10_39_AM.png)

Beim Klick auf ein bestehendes Ereignis:
- Wird das aktuelle Ereignis hervorgehoben.
- Öffnet sich gleichzeitig ein Detailfenster zum Anzeigen oder Bearbeiten.

### Mondkalender anzeigen

Wenn aktiviert, werden die entsprechenden Mondkalender-Informationen im Kalender angezeigt.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM.png)

### Datenbereich

Wird verwendet, um den im Kalender-Block angezeigten Datenumfang einzuschränken.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM.png)

Weitere Informationen finden Sie unter: [Datenbereich festlegen](/interface-builder/blocks/block-settings/data-scope)

### Block-Höhe

Die Höhe des Kalender-Blocks lässt sich anpassen, um Bildlaufleisten zu vermeiden und das Gesamtlayout zu verbessern.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM%20(1).png)

Weitere Informationen finden Sie unter: [Block-Höhe](/interface-builder/blocks/block-settings/block-height)

### Farbfeld

Dient zur Konfiguration der Hintergrundfarbe von Kalenderereignissen, um die visuelle Unterscheidung zu verbessern.

Vorgehen:

1. Fügen Sie in der Datentabelle ein Feld vom Typ **Single select (Einfachauswahl)** oder **Radio group (Optionsfeld)** hinzu und konfigurieren Sie Farben für die Optionen;
2. Wählen Sie dieses Feld in der Konfiguration des Kalender-Blocks als „Farbfeld" aus;
3. Beim Erstellen oder Bearbeiten eines Ereignisses wählen Sie eine Farbe aus, die im Kalender wirksam wird.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM%20(1).png)

### Wochenstart

Sie können den Wochenstart festlegen:
- Sonntag
- Montag (Standard)

So lässt sich die Anzeige an die Gewohnheiten verschiedener Regionen anpassen.


## Aktionskonfiguration

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_32_PM.png)

### Heute

Klicken Sie auf die Schaltfläche „Heute", um schnell zur Kalenderansicht des aktuellen Datums zu springen.

### Seitenwechsel

Wechselt die angezeigte Zeit je nach aktuellem Ansichtsmodus:
- Monatsansicht: vorheriger / nächster Monat
- Wochenansicht: vorherige / nächste Woche
- Tagesansicht: gestern / morgen

### Ansicht auswählen

Unterstützt den Wechsel zwischen folgenden Ansichten:
- Monatsansicht (Standard)
- Wochenansicht
- Tagesansicht

### Titel

Zeigt das Datum der aktuellen Ansicht an.
