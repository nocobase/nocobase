:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/ai-employees/features/new-ai-employees).
:::

# Neuen AI-Mitarbeiter erstellen

Wenn die integrierten AI-Mitarbeiter Ihre Anforderungen nicht erfüllen, können Sie Ihren eigenen AI-Mitarbeiter erstellen und anpassen.

## Erstellung starten

Rufen Sie die Verwaltungsseite `AI employees` auf und klicken Sie auf `New AI employee`.

## Konfiguration der Basisinformationen

Konfigurieren Sie im Tab `Profile` Folgendes:

- `Username`: Eindeutige Kennung.
- `Nickname`: Anzeigename.
- `Position`: Stellenbeschreibung.
- `Avatar`: Profilbild des Mitarbeiters.
- `Bio`: Kurzbeschreibung.
- `About me`: System-Prompt.
- `Greeting message`: Begrüßungsnachricht für den Chat.

![ai-employee-create-without-model-settings-tab.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-create-without-model-settings-tab.png)

## Rolleneinstellungen (Role setting)

Konfigurieren Sie im Tab `Role setting` den System-Prompt des Mitarbeiters. Dieser Inhalt definiert die Identität, Ziele, Arbeitsgrenzen und den Ausgabestil des Mitarbeiters während der Konversationen.

Empfohlene Inhalte:

- Rollenpositionierung und Aufgabenbereich.
- Prinzipien der Aufgabenbearbeitung und Antwortstruktur.
- Untersagte Handlungen, Informationsgrenzen und Tonalität/Stil.

Sie können nach Bedarf Variablen einfügen (z. B. aktueller Benutzer, aktuelle Rolle, aktuelle Sprache, Datum/Uhrzeit), damit sich der Prompt in verschiedenen Konversationen automatisch an den Kontext anpasst.

![ai-employee-role-setting-system-prompt.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-role-setting-system-prompt.png)

## Konfiguration von Fähigkeiten und Wissen

Konfigurieren Sie die Berechtigungen für Fähigkeiten im Tab `Skills`. Wenn die Wissensdatenbank-Funktion aktiviert ist, können Sie die Konfiguration in den entsprechenden Tabs für die Wissensdatenbank fortsetzen.

## Erstellung abschließen

Klicken Sie auf `Submit`, um die Erstellung abzuschließen.