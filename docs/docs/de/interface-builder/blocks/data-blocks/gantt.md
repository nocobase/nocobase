---
pkg: '@nocobase/plugin-gantt'
title: 'Gantt-Block'
description: 'Der Gantt-Block zeigt Start- und Endzeiten sowie Fortschritt von Datensätzen auf einer Zeitleiste an. Er eignet sich für Projektplanung, Aufgabenplanung und Meilensteinverfolgung und unterstützt Titelfeld, Datumsfelder, Fortschrittsfeld, Farbfeld, Zeitskalierung, linke Tabelle und Ereignis-Popup.'
keywords: 'Gantt-Block,Gantt,Projektplanung,Aufgabenplanung,Zeitleiste,Fortschrittsverwaltung,UI-Erstellung,NocoBase'
---

# Gantt-Block

## Einführung

Der Gantt-Block zeigt Start- und Endzeiten sowie Fortschritt von Datensätzen auf einer Zeitleiste an. Er eignet sich für Projektplanung, Aufgabenplanung, Meilensteinverfolgung und andere Szenarien, in denen du Aufgaben nach Zeitspanne betrachten musst.

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_30_AM.png)

## Installation

Dieser Block ist ein integriertes Plugin und muss nicht zusätzlich installiert werden.

## Block hinzufügen

Nachdem du den Gantt-Block ausgewählt und eine Datentabelle festgelegt hast, konfigurierst du im Popup die Felder, die der Gantt-Block benötigt:

1. Wähle das Titelfeld, um den Aufgabennamen anzuzeigen
2. Wähle das Startdatumsfeld, um die Startzeit der Aufgabe festzulegen
3. Wähle das Enddatumsfeld, um die Endzeit der Aufgabe festzulegen
4. Wähle bei Bedarf das Fortschrittsfeld, um den Aufgabenfortschritt anzuzeigen und per Ziehen zu aktualisieren
5. Wähle bei Bedarf das Farbfeld, um unterschiedliche Aufgaben zu unterscheiden
6. Wähle die Zeitskalierung, um die Granularität der Zeitleiste zu steuern

Nach Abschluss der Konfiguration kannst du den Gantt-Block erstellen.

![](<https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_27_AM%20(1).png>)

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_27_AM.png)

## Blockeinstellungen

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_28_AM.png)

### Gantt-Felder

Gantt-Felder legen fest, wie Datensätze auf Aufgaben in der Zeitleiste abgebildet werden.

Dazu gehören:

- Das Titelfeld bestimmt den Namen auf dem Aufgabenbalken
- Das Startdatumsfeld bestimmt die Startposition des Aufgabenbalkens
- Das Enddatumsfeld bestimmt die Endposition des Aufgabenbalkens
- Das Fortschrittsfeld bestimmt die Fortschrittsanzeige im Aufgabenbalken
- Das Farbfeld bestimmt die Farbe des Aufgabenbalkens
- Die Zeitskalierung bestimmt, ob die Zeitleiste nach Stunde, Tag, Woche, Monat usw. angezeigt wird

### Titelfeld

Wird verwendet, um den Aufgabennamen anzuzeigen. Üblicherweise wählst du ein Textfeld wie Aufgabenname, Projektname oder Titel.

### Startdatumsfeld

Wird verwendet, um die Startzeit der Aufgabe festzulegen. Der Gantt-Block platziert die Aufgabe anhand dieses Feldes auf der Zeitleiste.

### Enddatumsfeld

Wird verwendet, um die Endzeit der Aufgabe festzulegen. Wenn Start- und Enddatum identisch sind, wird die Aufgabe als kürzerer Zeitraum angezeigt.

### Fortschrittsfeld

Wird verwendet, um den Fertigstellungsgrad der Aufgabe anzuzeigen. Er kann auch über den Fortschrittsgriff am Aufgabenbalken aktualisiert werden.

Das Fortschrittsfeld ist ein Float-Feld. Daten werden von `0` bis `1` gespeichert und im Gantt-Block als Prozentwert angezeigt. Zum Beispiel wird `0.6` als `60%` angezeigt.

### Farbfeld

Wird verwendet, um die Farbe des Aufgabenbalkens festzulegen, damit verschiedene Aufgabentypen, Status oder Prioritäten leichter unterscheidbar sind.

Das Farbfeld unterstützt:

- Einfachauswahlfeld
- Farbfeld

Wenn ein Einfachauswahlfeld verwendet wird, nutzt der Gantt-Block bevorzugt die Farbe der ausgewählten Option.

### Zeitskalierung

Wird verwendet, um die Granularität der Zeitleiste zu steuern.

Aktuell unterstützt:

- Stunde
- Vierteltag
- Halbtag
- Tag
- Woche
- Monat
- Jahr
- Quartal

Für kurze Aufgabenzeiträume kannst du Stunde, Halbtag oder Tag verwenden. Für längere Aufgabenzeiträume kannst du Woche, Monat, Quartal oder Jahr verwenden.

### Tabelle anzeigen

Wenn diese Option aktiviert ist, zeigt der Gantt-Block links einen Tabellenbereich an. Dort kannst du Tabellenspalten konfigurieren, um wichtige Aufgabenattribute anzuzeigen.

Wenn diese Option deaktiviert ist, zeigt der Block nur die Zeitleiste rechts an. Das eignet sich, wenn der Platz auf der Seite knapp ist oder du nur die Planung anzeigen möchtest.

### Tabellenbreite

Wird verwendet, um die Breite des linken Tabellenbereichs festzulegen. Diese Einstellung erscheint nur, wenn Tabelle anzeigen aktiviert ist.

Wenn viele Tabellenfelder vorhanden sind, kannst du die Tabellenbreite erhöhen. Wenn nur wenige Felder erhalten bleiben, kannst du die Breite reduzieren und mehr Platz für die Zeitleiste lassen.

### Ziehen zum Neuplanen aktivieren

Wenn diese Option aktiviert ist, kannst du Aufgabenbalken in der Zeitleiste ziehen, um Start- und Enddatum anzupassen.

Dabei gilt:

- Ziehe den gesamten Aufgabenbalken, um Start- und Enddatum gleichzeitig anzupassen
- Ziehe die Griffe an den beiden Seiten des Aufgabenbalkens, um Startdatum oder Enddatum anzupassen
- Ziehe den Fortschrittsgriff, um das Fortschrittsfeld zu aktualisieren

Wenn Benutzer die Planung nicht direkt im Gantt-Block ändern sollen, deaktiviere diese Option.

### Beim ersten Anzeigen zu heute scrollen

Wenn diese Option aktiviert ist, scrollt der Gantt-Block beim ersten Anzeigen automatisch zu heute.

Diese Option eignet sich für Projekte mit langen Aufgabenzeiträumen. Beim Öffnen der Seite sehen Benutzer zuerst Aufgaben in der Nähe des aktuellen Datums.

### Ereignis-Popup-Einstellungen

Wird verwendet, um zu konfigurieren, wie ein Aufgabenbalken nach dem Anklicken geöffnet wird.

Du kannst konfigurieren:

- Öffnungsmodus, etwa Schublade, Dialog oder Seite
- Popup-Größe
- Popup-Vorlage

Nach dem Anklicken eines Aufgabenbalkens öffnet NocoBase den aktuellen Datensatz entsprechend dieser Konfiguration, damit Aufgabendetails bequem angezeigt oder bearbeitet werden können.

### Datenbereich

Wird verwendet, um die im Gantt-Block angezeigten Daten einzuschränken.

Zum Beispiel: nur Aufgaben des aktuellen Projekts oder nur unfertige Aufgaben anzeigen.

Weitere Details findest du unter [Datenbereich](../block-settings/data-scope).

### Seitengröße

Wird verwendet, um die Anzahl der pro Seite geladenen Datensätze zu steuern. Bei vielen Datensätzen können Benutzer über die Seitennavigation weitere Aufgaben anzeigen.

### Zeilennummern anzeigen

Wenn diese Option aktiviert ist, zeigt die linke Tabelle Zeilennummern an. Das erleichtert das Auffinden von Datensätzen bei vielen Aufgaben.

### Baumtabelle

Wenn die aktuelle Datentabelle eine Baumtabelle ist, kann der Gantt-Block den Baumtabellenmodus aktivieren. Danach zeigt die linke Tabelle Datensätze nach Eltern-Kind-Hierarchie an, und die Zeitleiste rechts zeigt Aufgaben in derselben Hierarchie an.

Im Baumtabellenmodus kannst du außerdem Alle Zeilen standardmäßig erweitern konfigurieren.

## Felder konfigurieren

Der linke Tabellenbereich verwendet Tabellenspalten, um Datensatzfelder anzuzeigen.

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_29_AM.png)

### Felder hinzufügen

Nachdem Tabelle anzeigen aktiviert wurde, kannst du Feldspalten zur linken Tabelle hinzufügen. Feldoptionen findest du unter [Tabellenspalte](../../fields/generic/table-column).

### Aktionsspalte

Der Gantt-Block enthält standardmäßig eine Aktionsspalte. Du kannst dort Datensatzaktionen wie Anzeigen, Bearbeiten und Löschen hinzufügen.

Wenn Ereignis-Popup-Einstellungen bereits konfiguriert sind, kannst du auch direkt den Aufgabenbalken rechts anklicken, um die Datensatzdetails zu öffnen.

## Aktionen konfigurieren

Der Gantt-Block unterstützt globale Aktionen oben im Block. Die verfügbaren Aktionstypen hängen von den aktivierten Funktionen in der aktuellen Umgebung ab.

![](<https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_29_AM%20(1).png>)

### Integrierte Aktionen

- Heute: schnell zu heute scrollen
- Erweitern/Reduzieren: im Baumtabellenmodus alle Zeilen erweitern oder reduzieren

### Globale Aktionen

- [Neu hinzufügen](../../actions/types/add-new)
- [Popup](../../actions/types/pop-up)
- [Link](../../actions/types/link)
- [Aktualisieren](../../actions/types/refresh)
- [Filter](../../actions/types/filter)
- [Massenbearbeitung](../../actions/types/bulk-edit)
- [Massenaktualisierung](../../actions/types/bulk-update)
- [Workflow auslösen](../../actions/types/trigger-workflow)
- [Benutzerdefinierte Anfrage](../../actions/types/custom-request)
- [JS Item](../../actions/types/js-item)
- [JS Action](../../actions/types/js-action)
- [AI-Mitarbeiter](../../actions/types/ai-employee)
