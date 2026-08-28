---
pkg: "@nocobase/plugin-field-signature"
---

# Datenquellenfeld: Handschriftliche Unterschrift

## Einführung

Das Feld für handschriftliche Unterschriften ermöglicht es Benutzern, mit der Maus oder einem Touchscreen auf einer Zeichenfläche zu unterschreiben. Nach dem Speichern wird das Unterschriftsbild in die ausgewählte **Dateidatentabelle** geschrieben und verwendet den vom **Dateimanager** bereitgestellten Prozess für das Hochladen und Speichern von Dateien erneut.

## Installation

1. Stellen Sie sicher, dass die aktuelle Umgebung **Professional Edition oder höher** verwendet und die Lizenz gültig ist.
2. Öffnen Sie den **Plugin-Manager**, suchen Sie **Datenquellenfeld: Handschriftliche Unterschrift** (`@nocobase/plugin-field-signature`) und aktivieren Sie es.
3. Stellen Sie sicher, dass der **Dateimanager** (`@nocobase/plugin-file-manager`) aktiviert ist. Das Feld für handschriftliche Unterschriften ist auf die vom Dateimanager bereitgestellte Dateidatentabelle sowie dessen Funktionen zum Hochladen und Speichern angewiesen. Wenn der Dateimanager nicht aktiviert ist, können Unterschriftsbilder nicht gespeichert werden.

## Verwendung

### Feld hinzufügen

Gehen Sie zu **Datenquellen** → Wählen Sie eine Datentabelle aus → **Felder konfigurieren** → **Feld hinzufügen** → Wählen Sie in der Gruppe „Multimedia“ die Option **Handschriftliche Unterschrift** aus.

### Feldkonfiguration

- **Dateidatentabelle**: Erforderlich; wählen Sie eine Dateidatentabelle zum Speichern der Dateien aus (z. B. `attachments`). Das Unterschriftsbild wird dort gespeichert.
- Die tatsächlich für das Unterschriftsbild verwendete Speicherkonfiguration und die Regeln für das Hochladen werden von der ausgewählten Dateidatentabelle selbst bestimmt.

### Schnittstellenkonfiguration

- Nachdem Sie das Feld für handschriftliche Unterschriften zu einem Formular hinzugefügt haben, können Sie in der Schnittstellenkonfiguration des Feldes die **Unterschriftseinstellungen** anpassen. Dazu gehören die Strichfarbe, die Hintergrundfarbe, die Breite und Höhe der Unterschriftsfläche sowie die Breite und Höhe des Vorschaubilds.
- In schreibgeschützten Ansichten können Sie außerdem die Breite und Höhe des Vorschaubilds der Unterschrift anpassen, um die Anzeiggröße des Unterschriftsbilds zu steuern.
### Schnittstellenbedienung

- Klicken Sie auf den Feldbereich, um die Unterschriftsfläche zu öffnen. Nach dem Unterschreiben bestätigen Sie, um das Bild hochzuladen und mit dem entsprechenden Dateidatensatz zu verknüpfen.
- Auf Geräten mit kleinem Bildschirm können Sie eine für Querformat oder Vollbild optimierte Unterschriftsoberfläche verwenden, um das Unterschreiben zu erleichtern.
![20260709232226](https://static-docs.nocobase.com/20260709232226.png)
