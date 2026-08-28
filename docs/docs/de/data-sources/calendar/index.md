---
pkg: "@nocobase/plugin-calendar"
title: "Kalenderblock"
description: "Der Kalenderblock zeigt Ereignis- und Datumsdaten in einer Kalenderansicht an und eignet sich für die Planung von Besprechungen und Aktivitäten. Konfigurierbar sind Titelfeld, Start-/Endzeit, Mondkalender und Datenbereich."
keywords: "Kalenderblock, Kalenderansicht, Ereignis, Besprechungsplanung, Calendar, NocoBase"
---
# Kalenderblock

## Einführung

Der Kalenderblock zeigt ereignis- und datumsbezogene Daten in einer Kalenderansicht an und eignet sich für Szenarien wie die Planung von Besprechungen und Aktivitäten.

## Installation

Integriertes Plugin, keine Installation erforderlich.

## Block hinzufügen

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1. Titelfeld: Die Informationen, die in der Kalenderleiste angezeigt werden; derzeit werden die Feldtypen `input`, `select`, `phone`, `email`, `radioGroup` und `sequence` unterstützt. Die unterstützten Titelfeldtypen des Kalenderblocks können über Plugins erweitert werden.
2. Startzeit: Die Startzeit der Aufgabe;
3. Endzeit: Die Endzeit der Aufgabe;

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>


Klicken Sie auf die Aufgabenleiste. Die entsprechende Aufgabenleiste wird hervorgehoben und ein Popup-Fenster wird angezeigt.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Blockkonfiguration

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Mondkalender anzeigen

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

-
-

### Datenbereich festlegen

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Weitere Informationen finden Sie unter

### Blockhöhe festlegen

Beispiel: Passen Sie die Höhe des Bestellkalenderblocks an, damit innerhalb des Kalenderblocks keine Bildlaufleiste angezeigt wird.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Weitere Informationen finden Sie unter

### Feld für Hintergrundfarbe

:::info{title=Hinweis}
Erfordert NocoBase v1.4.0-beta oder höher.
:::

Mit dieser Option kann die Hintergrundfarbe von Kalenderereignissen konfiguriert werden. Gehen Sie dazu wie folgt vor:

1. Die Tabelle mit den Kalenderdaten muss ein Feld vom Typ **Einzelauswahl (Single select)** oder **Optionsfeldgruppe (Radio group)** enthalten. Für dieses Feld muss eine Farbe konfiguriert sein.
2. Kehren Sie anschließend zur Konfigurationsoberfläche des Kalenderblocks zurück und wählen Sie unter **Feld für Hintergrundfarbe** das soeben mit einer Farbe konfigurierte Feld aus.
3. Wählen Sie abschließend für ein Kalenderereignis eine Farbe aus und klicken Sie auf „Absenden“. Die Farbe wird daraufhin angezeigt.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Erster Wochentag

> Unterstützt ab v1.7.7

Der Kalenderblock unterstützt die Einstellung des ersten Wochentags. Sie können **Sonntag** oder **Montag** als ersten Tag der Woche auswählen.
Standardmäßig ist **Montag** als erster Wochentag festgelegt. So können Benutzer die Kalenderanzeige an die regionalen Gewohnheiten anpassen und besser auf ihre tatsächlichen Anforderungen abstimmen.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)
## Konfigurationsaktionen

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Heute

Die Schaltfläche „Heute“ des Kalenderblocks bietet eine praktische Navigationsfunktion. Nachdem Benutzer zu anderen Datumsangaben gewechselt haben, können sie schnell zur Kalenderseite mit dem aktuellen Datum zurückkehren.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Ansicht wechseln

Standardmäßig ist die Monatsansicht eingestellt.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)