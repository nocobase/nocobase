---
pkg: '@nocobase/plugin-notification-manager'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Benachrichtigungsmanager

## Einführung

Der Benachrichtigungsmanager ist ein zentraler Dienst, der mehrere Benachrichtigungskanäle integriert. Er bietet eine einheitliche Konfiguration der Kanäle, Versandverwaltung und Protokollierung und unterstützt eine flexible Erweiterung.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- **Lila Bereich**: Der Benachrichtigungsmanager bietet einen umfassenden Dienst, der Funktionen wie Kanal-Konfiguration und Protokollierung umfasst, wobei die Benachrichtigungskanäle erweiterbar sind.
- **Grüner Bereich**: In-App-Nachricht (In-App Message), ein integrierter Kanal, der es Benutzern ermöglicht, Benachrichtigungen direkt in der Anwendung zu empfangen.
- **Roter Bereich**: E-Mail (Email), ein erweiterbarer Kanal, der es Benutzern ermöglicht, Benachrichtigungen per E-Mail zu empfangen.

## Kanalverwaltung

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

Derzeit werden folgende Kanäle unterstützt:

- [In-App-Nachricht](/notification-manager/notification-in-app-message)
- [E-Mail](/notification-manager/notification-email) (mit integriertem SMTP-Transport)

Sie können auch weitere Kanäle für Benachrichtigungen hinzufügen. Beachten Sie dazu die Dokumentation zur [Kanalerweiterung](/notification-manager/development/extension).

## Benachrichtigungsprotokolle

Das System protokolliert detaillierte Informationen und den Status jeder Benachrichtigung, was die Analyse und Fehlerbehebung erleichtert.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Workflow-Benachrichtigungsknoten

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)