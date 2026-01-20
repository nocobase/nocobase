---
pkg: "@nocobase/plugin-calendar"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Kalender-Block

## Einführung

Der Kalender-Block bietet eine optimierte Möglichkeit, Ereignisse und datumsbezogene Daten in einem Kalenderformat anzuzeigen und zu verwalten. Er eignet sich hervorragend für die Terminplanung, Veranstaltungsplanung und effiziente Zeitverwaltung.

## Installation

Dieses Plugin ist vorinstalliert, sodass keine zusätzliche Einrichtung erforderlich ist.

## Blöcke hinzufügen

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1.  **Titel-Feld**: Dient zur Anzeige von Informationen in den Kalenderbalken. Derzeit werden Feldtypen wie `input`, `select`, `phone`, `email`, `radioGroup` und `sequence` unterstützt. Die unterstützten Titel-Feldtypen können durch Plugins erweitert werden.
2.  **Startzeit**: Zeigt an, wann die Aufgabe beginnt.
3.  **Endzeit**: Markiert, wann die Aufgabe endet.

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>

Wenn Sie auf einen Aufgabenbalken klicken, wird die Auswahl hervorgehoben und ein detailliertes Pop-up-Fenster geöffnet.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Block-Konfiguration

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Mondkalender anzeigen

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

### Datenbereich festlegen

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Weitere Informationen finden Sie unter 

### Block-Höhe festlegen

Beispiel: Passen Sie die Höhe des Kalender-Blocks für Bestellungen an. Im Kalender-Block wird kein Scrollbalken angezeigt.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Weitere Informationen finden Sie unter 

### Hintergrundfarben-Feld

:::info{title=Tipp}
Die NocoBase-Version muss v1.4.0-beta oder höher sein.
:::

Diese Option kann verwendet werden, um die Hintergrundfarbe von Kalenderereignissen zu konfigurieren. So verwenden Sie sie:

1.  Die Kalender-Datenbanktabelle muss ein Feld vom Typ **Einzelauswahl (Single select)** oder **Optionsgruppe (Radio group)** enthalten, und dieses Feld muss mit Farben konfiguriert sein.
2.  Kehren Sie dann zur Konfigurations-Oberfläche des Kalender-Blocks zurück und wählen Sie im Feld **Hintergrundfarben-Feld** das Feld aus, das Sie gerade mit Farben konfiguriert haben.
3.  Wählen Sie abschließend eine Farbe für ein Kalenderereignis aus und klicken Sie auf „Senden“. Sie werden sehen, dass die Farbe wirksam geworden ist.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Wochenstart-Tag

> Unterstützt ab Version v1.7.7

Der Kalender-Block unterstützt die Festlegung des Wochenstart-Tages. Sie können **Sonntag** oder **Montag** als ersten Tag der Woche auswählen.
Der Standard-Starttag ist **Montag**, was es Benutzern erleichtert, die Kalenderanzeige an regionale Gewohnheiten anzupassen und so ein besseres Benutzererlebnis zu bieten.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)

## Aktionen konfigurieren

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Heute

Die Schaltfläche „Heute“ im Kalender-Block bietet eine schnelle Navigation, mit der Benutzer nach dem Erkunden anderer Daten sofort zum aktuellen Datum zurückkehren können.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Ansicht wechseln

Die Standardansicht ist auf Monat eingestellt.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)