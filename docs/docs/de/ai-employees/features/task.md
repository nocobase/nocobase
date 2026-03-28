:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/ai-employees/features/task).
:::

# Schnellaufgaben

Damit KI-Mitarbeiter ihre Arbeit effizienter aufnehmen können, lassen sich KI-Mitarbeiter an Szenario-Blöcke binden und mehrere häufig verwendete Aufgaben voreinstellen.

Dies ermöglicht es Benutzern, die Aufgabenverarbeitung mit einem Klick zu starten, ohne jedes Mal den **Block auswählen** und einen **Befehl eingeben** zu müssen.

## KI-Mitarbeiter an Blöcke binden

Nachdem Sie in den UI-Bearbeitungsmodus gewechselt sind, wählen Sie bei Blöcken, die `Actions` unterstützen, das Menü `AI employees` unter `Actions` aus und entscheiden Sie sich für einen KI-Mitarbeiter. Dieser KI-Mitarbeiter wird daraufhin mit dem aktuellen Block verknüpft.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Nach Abschluss der Bindung wird bei jedem Aufruf der Seite der an den aktuellen Block gebundene KI-Mitarbeiter im Bereich `Actions` des Blocks angezeigt.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Aufgaben konfigurieren

Bewegen Sie im UI-Bearbeitungsmodus den Mauszeiger über das Symbol des an den Block gebundenen KI-Mitarbeiters. Es erscheint eine Menüschaltfläche. Wählen Sie `Edit tasks`, um die Seite für die Aufgabeneinstellungen zu öffnen.

Auf der Seite für die Aufgabeneinstellungen können Sie dem aktuellen KI-Mitarbeiter mehrere Aufgaben hinzufügen.

Jede Registerkarte stellt eine unabhängige Aufgabe dar. Klicken Sie auf das „+“-Zeichen daneben, um eine neue Aufgabe hinzuzufügen.

![clipboard-image-1771913187](https://static-docs.nocobase.com/clipboard-image-1771913187.png)

Formular für Aufgabeneinstellungen:

- Geben Sie im Eingabefeld `Title` den Titel der Aufgabe ein. Dieser kurze Titel wird in der Aufgabenliste des KI-Mitarbeiters angezeigt.
- Geben Sie im Eingabefeld `Background` den Hauptinhalt der Aufgabe ein. Dieser Inhalt dient als System-Prompt für den Dialog mit dem KI-Mitarbeiter.
- Geben Sie im Eingabefeld `Default user message` die standardmäßig zu sendende Benutzernachricht ein. Nach Auswahl der Aufgabe wird diese automatisch in das Eingabefeld des Benutzers eingefügt.
- Wählen Sie unter `Work context` die Standard-Anwendungskontextinformationen aus, die an den KI-Mitarbeiter gesendet werden sollen. Dieser Vorgang entspricht der Vorgehensweise im Dialogfenster.
- Im Auswahlfeld `Skills` werden die verfügbaren Fähigkeiten des aktuellen KI-Mitarbeiters angezeigt. Sie können eine Fähigkeit deaktivieren, damit der KI-Mitarbeiter diese bei der Ausführung der Aufgabe ignoriert.
- Das Kontrollkästchen `Send default user message automatically` legt fest, ob die Standard-Benutzernachricht nach dem Klicken auf die Aufgabenausführung automatisch gesendet wird.


## Aufgabenliste

Nachdem die Aufgaben für den KI-Mitarbeiter konfiguriert wurden, erscheinen diese im Profil-Popup des KI-Mitarbeiters sowie in der Begrüßungsnachricht vor Beginn der Konversation. Ein Klick genügt, um die Aufgabe auszuführen.

![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)