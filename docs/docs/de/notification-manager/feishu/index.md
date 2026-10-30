---
pkg: '@nocobase/plugin-feishu'
---

# Benachrichtigung: Feishu / Lark

## Einführung

Das **Feishu / Lark** Plugin ermöglicht der Anwendung, Benachrichtigungen an Feishu-Benutzer zu senden.

## Feishu-Authenticator hinzufügen und konfigurieren

Fügen Sie zuerst einen Feishu-Authenticator in NocoBase hinzu, siehe [Authentifizierung: Feishu / Lark](/auth-verification/auth-feishu/). Nur über Feishu angemeldete Systembenutzer können Systembenachrichtigungen über Feishu erhalten.

Nachrichten werden über die Feishu-App des ausgewählten Authenticators gesendet, wofür zusätzlich gilt:

1. Die **Bot**-Fähigkeit muss unter **App-Funktionen** auf der offenen Plattform aktiviert sein — ohne sie schlägt das Senden fehl;
2. Die Berechtigung **Nachrichten als Bot senden** (`im:message:send_as_bot`) muss unter **Berechtigungen** aktiviert und eine neue Version veröffentlicht sein;
3. Empfangende Benutzer müssen im **Berechtigungsbereich für Kontakte** (Verfügbarkeitsbereich) der App liegen.

Nach Änderung von App-Fähigkeiten oder Berechtigungen eine neue Version veröffentlichen und erneut versuchen.

## Feishu-Benachrichtigungskanal hinzufügen

Öffnen Sie **Benachrichtigungsverwaltung** → Kanäle, fügen Sie einen **Feishu / Lark** Kanal hinzu und wählen Sie den konfigurierten Authenticator.

Optional kann der **Empfänger-ID-Typ** (`open_id`, `user_id`, `union_id` oder `email`) konfiguriert werden; standardmäßig folgt er dem Kennzeichen-Feld des Authenticators.

## Nachrichtentypen

| Typ | Beschreibung |
| --- | --- |
| Textnachricht | Reiner Text. |
| Post-Nachricht | Rich Text im Feishu-Post-Format. |
| Interaktive Karte | Eine als JSON konfigurierte Feishu-Karte. |

Empfänger werden über die mit dem Authenticator verknüpfte Feishu-Identität aufgelöst (nach Empfänger-ID-Typ); nicht verknüpfte Benutzer fallen auf E-Mail oder Benutzername zurück.

## Workflow-Benachrichtigungsknoten

Wählen Sie im Benachrichtigungsknoten des Workflows den konfigurierten Feishu-Kanal, um Feishu-Nachrichten an Benutzer im Workflow-Kontext zu senden.

## Fehlerbehebung

- Senden schlägt mit Berechtigungsfehler fehl (z. B. Code `230002`): **Bot**-Fähigkeit und Berechtigung **Nachrichten als Bot senden** prüfen sowie die letzte Version veröffentlichen.
- Senden schlägt mit ungültigem Empfänger fehl (`receive_id`-Fehler): Benutzer außerhalb des Kontaktbereichs oder Empfänger-ID-Typ passt nicht zur Kanalkonfiguration.
- Die Aufgabe zeigt nur einen allgemeinen Fehler: Eintrag `FeishuNotificationChannel.send failed` in den Server-Logs prüfen; neuere Plugin-Versionen protokollieren zusätzlich Code und Meldung von Feishu.
