---
pkg: "@nocobase/plugin-kanban"
title: "Kanban-Block"
description: "Kanban-Block: Datensätze nach Spalten gruppiert anzeigen, mit Stilumschaltung, Schnellanlegen, Popup-Konfiguration, Drag-and-Drop-Sortierung und Karten-Klick zum Öffnen."
keywords: "Kanban-Block,Kanban,Datengruppierung,Drag-and-Drop-Sortierung,Schnellanlegen,Popup-Einstellungen,Kartenlayout,Interface Builder,NocoBase"
---

# Kanban

## Einführung

Der Kanban-Block stellt Datensätze in nach Gruppen gegliederten Spalten dar und eignet sich für Szenarien, in denen Daten phasenweise betrachtet und vorangetrieben werden, z. B. Statusübergänge bei Aufgaben, Verlauf von Vertriebsphasen oder Bearbeitung von Tickets.

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_51_PM.png)

## Block-Konfigurationsoptionen

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM.png)

### Gruppierungseinstellungen

Im Kanban-Block muss zuerst ein Gruppierungsfeld festgelegt werden. Das System ordnet die Datensätze anhand des Feldwertes in unterschiedliche Spalten ein.

- Als Gruppierungsfeld werden Einfachauswahl-Felder und Many-to-One-Felder unterstützt.
- Bei Einfachauswahl-Feldern werden Spaltentitel und Spaltenfarbe direkt aus den Optionen des Feldes übernommen.
- Bei Many-to-One-Feldern werden die Gruppierungsoptionen aus den Datensätzen der verknüpften Tabelle geladen.
- Wenn das Gruppierungsfeld ein Many-to-One-Feld ist, sind zusätzliche Konfigurationen möglich:
	- Titelfeld: bestimmt, welcher Wert eines verknüpften Feldes im Spaltenkopf angezeigt wird.
	- Farbfeld: bestimmt die Hintergrundfarbe des Spaltenkopfs und des Spaltencontainers.
- Über „Gruppierungswerte auswählen" lässt sich steuern, welche Spalten angezeigt werden und in welcher Reihenfolge.
- Datensätze ohne Gruppierungswert werden in der Spalte „Unbekannt" angezeigt.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM%20(1).png)
![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM.png)

### Stil

Der Kanban unterstützt zwei Spaltenstile:

- `Classic`: Behält einen leichteren, dezenten Hintergrund für die Spalten.
- `Filled`: Rendert Spaltenkopf und Spaltencontainer in der Spaltenfarbe – passend für Szenarien mit klar zugeordneten Statusfarben.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM%20(1).png)

### Drag-and-Drop-Einstellungen

Wenn Drag-and-Drop aktiviert ist, können Karten direkt per Ziehen umsortiert werden.

- Nach Aktivierung von „Drag-and-Drop-Sortierung aktivieren" lässt sich zusätzlich das „Drag-and-Drop-Sortierfeld" auswählen.
- Die Drag-and-Drop-Sortierung ist auf ein Sortierfeld angewiesen, das mit dem aktuellen Gruppierungsfeld kompatibel sein muss.
- Wird eine Karte in eine andere Spalte gezogen, werden gleichzeitig der Wert des Gruppierungsfelds und die Sortierposition aktualisiert.

Weitere Informationen unter [Sortierfeld](/data-sources/field-sort).

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_55_PM.png)

### Schnellanlegen

Bei aktiviertem „Schnellanlegen" wird rechts neben jedem Spaltentitel eine Plus-Schaltfläche angezeigt.

- Klick auf das Plus im Spaltenkopf öffnet das Popup zum Anlegen, mit der aktuellen Spalte als Kontext.
- Im Anlegen-Formular wird der zur aktuellen Spalte gehörende Gruppierungswert automatisch eingetragen.
- Ist die aktuelle Spalte die Spalte „Unbekannt", wird das Gruppierungsfeld leer vorbelegt.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_57_PM.png)

### Popup-Einstellungen

Die „Popup-Einstellungen" auf Block-Ebene steuern das Verhalten des Popups, das über die Schnellanlegen-Schaltfläche im Spaltenkopf geöffnet wird.

- Konfigurierbar ist die Öffnungsart, z. B. Drawer, Dialog oder Seite.
- Konfigurierbar ist die Größe des Popups.
- Es kann eine Popup-Vorlage gebunden oder anschließend weiter mit Block-Inhalten gefüllt werden.

### Anzahl pro Spalte

Steuert, wie viele Datensätze pro Spalte beim ersten Laden angezeigt werden. Bei vielen Datensätzen in einer Spalte können diese durch weiteres Scrollen nachgeladen werden.

### Spaltenbreite

Legt die Breite jeder Spalte fest, um die Darstellung an die Inhaltsdichte der Karten anzupassen.

### Datenbereich festlegen

Beschränkt den im Kanban-Block angezeigten Datenumfang.

Beispiel: Nur Aufgaben anzeigen, die der aktuelle Verantwortliche erstellt hat, oder nur Datensätze eines bestimmten Projekts.

Weitere Informationen unter [Datenbereich festlegen](/interface-builder/blocks/block-settings/data-scope).


## Felder konfigurieren

Im Inneren der Kanban-Karte wird die Zusammenfassung des Datensatzes über ein detailansicht-ähnliches Feldlayout dargestellt.

### Felder hinzufügen

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM.png)

Konfigurationsoptionen der Felder finden Sie unter [Detailfelder](/interface-builder/fields/generic/detail-form-item).

### Karteneinstellungen

Die Karte selbst unterstützt folgende Einstellungen:

- Klick zum Öffnen aktivieren: Wenn aktiviert, kann ein Klick auf die Karte den aktuellen Datensatz öffnen.
- Popup-Einstellungen: Öffnungsart, Größe und Popup-Vorlage für den Karten-Klick lassen sich gesondert konfigurieren.
- Layout: Das Anzeigelayout der Felder innerhalb der Karte kann angepasst werden.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_56_PM.png)

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM%20(2).png)

## Aktionen konfigurieren

Der Kanban-Block unterstützt globale Aktionen am oberen Rand. Welche Aktionen sichtbar sind, hängt von den in der aktuellen Umgebung aktivierten Aktions-Funktionen ab.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_10_02_PM.png)

### Globale Aktionen

- [Hinzufügen](/interface-builder/actions/types/add-new)
- [Popup](/interface-builder/actions/types/pop-up)
- [Link](/interface-builder/actions/types/link)
- [Aktualisieren](/interface-builder/actions/types/refresh)
- [Custom Request](/interface-builder/actions/types/custom-request)
- [JS Action](/interface-builder/actions/types/js-action)
- [KI-Mitarbeiter](/interface-builder/actions/types/ai-employee)
