---
pkg: "@nocobase/plugin-field-signature"
---

# Datentabellenfeld: Handschriftunterschrift

## Einführung

Mit dem Feld für Handschriftunterschriften können Benutzer ihre Unterschrift mit Maus oder Touchscreen auf einer Zeichenfläche leisten. Nach dem Speichern wird das Unterschriftsbild in der ausgewählten **Datei-Datentabelle** abgelegt; dabei wird der Upload- und Speicherprozess des **Dateimanagers** wiederverwendet.

## Installation

1. Stellen Sie sicher, dass die aktuelle Umgebung **Professional Edition oder höher** ist und eine gültige Lizenz vorliegt.
2. Öffnen Sie den **Plugin-Manager**, suchen Sie **Datentabellenfeld: Handschriftunterschrift** (`@nocobase/plugin-field-signature`) und aktivieren Sie es.
3. Stellen Sie sicher, dass der **Dateimanager** (`@nocobase/plugin-file-manager`) aktiviert ist. Das Feld für Handschriftunterschriften benötigt diesen für die Datei-Datentabelle, den Upload und die Speicherung; ohne aktivierten Dateimanager kann das Unterschriftsbild nicht gespeichert werden.

## Verwendung

### Feld hinzufügen

In **Datenquelle** → Datentabelle auswählen → **Felder konfigurieren** → **Feld hinzufügen** → in der Gruppe Multimedia **Handschriftunterschrift** auswählen.

### Feldkonfiguration

- **Datei-Datentabelle**: Pflichtfeld; wählen Sie eine Datei-Datentabelle (z. B. `attachments`) aus, in der das Unterschriftsbild gespeichert wird.
- Welche Speicherkonfiguration und Upload-Regeln tatsächlich verwendet werden, bestimmt die ausgewählte Datei-Datentabelle.

### Oberflächenkonfiguration

- Nachdem Sie das Feld für Handschriftunterschriften zum Formular hinzugefügt haben, können Sie in der Oberflächenkonfiguration des Feldes die **Unterschrifteneinstellungen** anpassen, einschließlich Stiftfarbe, Hintergrundfarbe, Breite und Höhe der Zeichenfläche sowie Breite und Höhe der Vorschau (Thumbnail).
- In schreibgeschützten Ansichten lassen sich Breite und Höhe der Vorschau ebenfalls anpassen, um die Anzeigegröße des Unterschriftsbildes zu steuern.

### Bedienung in der Oberfläche

- Klicken Sie auf den Feldbereich, um die Zeichenfläche zu öffnen. Nach dem Unterschreiben bestätigen Sie, um das Bild hochzuladen und mit dem entsprechenden Dateieintrag zu verknüpfen.
- Auf kleineren Bildschirmen kann eine Querformat-/Vollbild-Unterschriftsoberfläche verwendet werden, um das Unterschreiben zu erleichtern.
