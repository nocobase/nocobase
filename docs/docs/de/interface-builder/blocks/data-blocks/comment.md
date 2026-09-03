---
pkg: "@nocobase/plugin-block-comment"
title: "Kommentarblock"
description: "Kommentarblock: Kommentare in Datensatzdetails, Pop-ups und ähnlichen Szenarien anzeigen und erstellen, mit Feldzuordnung, Seitengröße, Datenbereich, Standardsortierung und automatischem Sprung zur letzten Seite."
keywords: "Kommentarblock,CommentBlock,Kommentartabelle,Feldzuordnung,Datenbereich,Standardsortierung,Interface Builder,NocoBase"
---

# Kommentarblock

## Einführung

Der Kommentarblock fügt Geschäftsdatensätzen Kommentarfunktionen hinzu. Sie können ihn zu Detailseiten oder Pop-ups für Aufgaben, Artikel, Tickets, Kunden und andere Datensätze hinzufügen, damit Benutzer Kommentare zum aktuellen Datensatz anzeigen, beantworten und erstellen können.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_02_PM.png)

:::tip Hinweis

Der Kommentarblock erstellt selbst keine Sammlung. Bereiten Sie vor der Verwendung eine Sammlung zum Speichern von Kommentaren vor und konfigurieren Sie Felder wie Kommentarinhalt, Kommentator, Kommentarzuordnung und Kommentarzeit.

:::

## Block hinzufügen

Der Kommentarblock wird normalerweise zur Detailseite oder zum Pop-up eines Geschäftsdatensatzes hinzugefügt.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_03_PM.png)

1. Öffnen Sie die Detailseite oder das Pop-up des Zieldatensatzes
2. Klicken Sie auf "Block hinzufügen"
3. Wählen Sie "Kommentar"
4. Wählen Sie die Sammlung aus, in der Kommentare gespeichert werden
5. Schließen Sie die Feldzuordnung gemäß den Hinweisen ab

Wenn der Kommentarblock aus einer Verknüpfung erstellt wird, versucht NocoBase, das Kommentarzuordnungsfeld und den aktuellen Datensatzwert anhand der aktuellen Verknüpfung automatisch zu erkennen. In diesem Fall werden "Kommentarzuordnungsfeld" und "Wert des Kommentarzuordnungsfelds" automatisch ausgefüllt und müssen normalerweise nicht manuell konfiguriert werden.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_04_PM.png)

Wenn der Block direkt aus der Kommentarsammlung erstellt wird, müssen Sie das Kommentarzuordnungsfeld und den Wert manuell konfigurieren.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_03_PM%20(1).png)

## Feldzuordnung

Der Kommentarblock verwendet die "Feldzuordnung", um zu wissen, wie jeder Kommentar angezeigt und gespeichert werden soll.

| Konfiguration | Beschreibung |
| --- | --- |
| Kommentarinhalt-Feld | Wählen Sie das Feld aus, in dem der Kommentartext gespeichert wird. |
| Kommentator-Feld | Wählen Sie ein Viele-zu-eins-Feld aus, das mit der Benutzersammlung verknüpft ist. |
| Kommentarzuordnungsfeld | Wählen Sie das Feld aus, in dem die Kennung des aktuellen Geschäftsdatensatzes gespeichert wird. |
| Wert des Kommentarzuordnungsfelds | Geben Sie den Wert des aktuellen Geschäftsdatensatzes an, z. B. `{{ ctx.popup.record.id }}`. |
| Kommentardatum-Feld | Wählen Sie das Kommentarzeitfeld aus, das für Anzeige und Standardsortierung verwendet wird. |

### Kommentarzuordnungsfeld

Das "Kommentarzuordnungsfeld" wird verwendet, um Kommentare für den aktuellen Datensatz zu filtern, und wird auch beim Erstellen eines neuen Kommentars geschrieben.

Bei manueller Auswahl zeigt die Dropdown-Liste nur normale Skalarfelder und keine Verknüpfungsfelder an. Häufige Konfigurationen sind:

| Geschäftssammlung | Zuordnungsfeld in der Kommentarsammlung | Wert des Kommentarzuordnungsfelds |
| --- | --- | --- |
| Aufgaben | `taskId` | `{{ ctx.popup.record.id }}` |
| Artikel | `postId` | `{{ ctx.popup.record.id }}` |
| Tickets | `ticketId` | `{{ ctx.popup.record.id }}` |

Wenn der aktuelle Datensatz eine eindeutige Kennung außer `id` verwendet, ändern Sie den "Wert des Kommentarzuordnungsfelds" auf das entsprechende Feld, z. B. `{{ ctx.popup.record.uuid }}`.

### Automatische Zuordnung aus Verknüpfungen

Wenn der Block aus einer Verknüpfung des Geschäftsdatensatzes erstellt wird, verwendet der Kommentarblock vorrangig das Fremdschlüsselfeld dieser Verknüpfung als Kommentarzuordnungsfeld und den aktuellen Datensatzwert als Wert des Kommentarzuordnungsfelds.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_04_PM.png)

Wenn es zum Beispiel eine Eins-zu-viele-Verknüpfung zwischen der Aufgabensammlung und der Aufgabenkommentarsammlung gibt und das Fremdschlüsselfeld in der Aufgabenkommentarsammlung `taskId` ist, verwendet der Block beim Hinzufügen eines Kommentarblocks aus der Verknüpfung auf der Aufgabendetailseite automatisch:

- Kommentarzuordnungsfeld: `taskId`
- Wert des Kommentarzuordnungsfelds: die Kennung des aktuellen Aufgabendatensatzes

Dieser Ansatz eignet sich für die meisten Szenarien und reduziert Fehler bei der manuellen Konfiguration.

## Block-Konfiguration

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_07_PM.png)

### Seitengröße

Legen Sie fest, wie viele Kommentare pro Seite angezeigt werden. Verfügbare Werte sind `5`, `10`, `20`, `50`, `100` und `200`.

### Datenbereich

Legen Sie den Datenfilterbereich für die Kommentarliste fest. Sie können hier weitere Bedingungen hinzufügen, z. B. nur Kommentare anzeigen, die bestimmten Status- oder Berechtigungsbedingungen entsprechen.

Weitere Informationen finden Sie unter [Datenbereich festlegen](../block-settings/data-scope.md).

### Standardsortierregel

Legen Sie die Standardsortierung der Kommentarliste fest. Normalerweise können Sie nach dem Kommentardatum-Feld aufsteigend oder absteigend sortieren.

Wenn keine separate Standardsortierregel konfiguriert ist, verwendet der Kommentarblock vorrangig das "Kommentardatum-Feld" als Standardsortierfeld.

Weitere Informationen finden Sie unter [Sortierregel festlegen](../block-settings/sorting-rule.md).

### Automatisch zur letzten Seite springen

Standardmäßig deaktiviert. Wenn deaktiviert, bleibt der Kommentarblock nach dem Öffnen auf der ersten Seite.

Wenn aktiviert, springt der Kommentarblock beim ersten Laden zur letzten Seite. Dies eignet sich, wenn Benutzer zuerst die neuesten Kommentare sehen sollen.
