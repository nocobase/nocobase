:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Erweitert

## Einführung

KI-Mitarbeiter können an Seiten oder Blöcke gebunden werden. Nach der Bindung können Sie Aufgaben für das aktuelle Geschäft konfigurieren, sodass Benutzer den KI-Mitarbeiter auf der Seite oder im Block schnell zur Aufgabenbearbeitung nutzen können.

## KI-Mitarbeiter an eine Seite binden

Nachdem die Seite in den UI-Bearbeitungsmodus gewechselt ist, erscheint neben dem Schnellzugriff-Button für KI-Mitarbeiter unten rechts ein „+“-Symbol. Fahren Sie mit der Maus über das „+“-Symbol, und eine Liste der KI-Mitarbeiter wird angezeigt. Wählen Sie einen KI-Mitarbeiter aus, um ihn an die aktuelle Seite zu binden.

![20251022134656](https://static-docs.nocobase.com/20251022134656.png)

Nachdem die Bindung abgeschlossen ist, wird jedes Mal, wenn Sie die Seite aufrufen, der an die aktuelle Seite gebundene KI-Mitarbeiter unten rechts angezeigt.

![20251022134903](https://static-docs.nocobase.com/20251022134903.png)

## KI-Mitarbeiter an einen Block binden

Nachdem die Seite in den UI-Bearbeitungsmodus gewechselt ist, wählen Sie in einem Block, der `Actions` unterstützt, das Menü `AI employees` unter `Actions` und wählen Sie dann einen KI-Mitarbeiter aus, um ihn an den aktuellen Block zu binden.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Nachdem die Bindung abgeschlossen ist, wird jedes Mal, wenn Sie die Seite aufrufen, der an den aktuellen Block gebundene KI-Mitarbeiter im `Actions`-Bereich des Blocks angezeigt.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Aufgaben konfigurieren

Nachdem die Seite in den UI-Bearbeitungsmodus gewechselt ist, fahren Sie mit der Maus über das Symbol des an die Seite oder den Block gebundenen KI-Mitarbeiters. Ein Menü-Button erscheint. Wählen Sie `Edit tasks`, um die Seite zur Aufgabenkonfiguration aufzurufen.

![20251022135710](https://static-docs.nocobase.com/20251022135710.png)

Auf der Seite zur Aufgabenkonfiguration können Sie dem aktuellen KI-Mitarbeiter mehrere Aufgaben hinzufügen.

Jede Registerkarte repräsentiert eine unabhängige Aufgabe. Klicken Sie auf das danebenliegende „+“-Symbol, um eine neue Aufgabe hinzuzufügen.

![20251022140058](https://static-docs.nocobase.com/20251022140058.png)

Formular zur Aufgabenkonfiguration:

- Geben Sie im Eingabefeld `Title` den Aufgabentitel ein. Beschreiben Sie den Aufgabeninhalt kurz. Dieser Titel wird in der Aufgabenliste des KI-Mitarbeiters angezeigt.
- Geben Sie im Eingabefeld `Background` den Hauptinhalt der Aufgabe ein. Dieser Inhalt wird als System-Prompt verwendet, wenn Sie mit dem KI-Mitarbeiter kommunizieren.
- Geben Sie im Eingabefeld `Default user message` die standardmäßig zu sendende Benutzernachricht ein. Diese wird nach Auswahl der Aufgabe automatisch in das Benutzereingabefeld eingefügt.
- Wählen Sie unter `Work context` die standardmäßigen Anwendungskontextinformationen aus, die an den KI-Mitarbeiter gesendet werden sollen. Diese Operation ist identisch mit der im Dialogfeld.
- Das Auswahlfeld `Skills` zeigt die dem aktuellen KI-Mitarbeiter zur Verfügung stehenden Fähigkeiten an. Sie können eine Fähigkeit deaktivieren, damit der KI-Mitarbeiter diese Fähigkeit bei der Ausführung der Aufgabe ignoriert und nicht verwendet.
- Das Kontrollkästchen `Send default user message automatically` konfiguriert, ob die Standard-Benutzernachricht nach dem Klicken auf „Aufgabe ausführen“ automatisch gesendet werden soll.

![20251022140805](https://static-docs.nocobase.com/20251022140805.png)

## Aufgabenliste

Nachdem Aufgaben für einen KI-Mitarbeiter konfiguriert wurden, werden diese Aufgaben im Profil-Pop-up des KI-Mitarbeiters und in der Begrüßungsnachricht vor Beginn einer Konversation angezeigt. Klicken Sie auf eine Aufgabe, um sie auszuführen.

![20251022141231](https://static-docs.nocobase.com/20251022141231.png)