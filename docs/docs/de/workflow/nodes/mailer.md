---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# E-Mail senden

## Einführung

Dieser Knoten dient zum Senden von E-Mails und unterstützt Inhalte im Text- und HTML-Format.

## Knoten erstellen

Klicken Sie in der Workflow-Konfigurationsoberfläche auf das Plus-Symbol („+“) im Workflow, um einen „E-Mail senden“-Knoten hinzuzufügen:

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Knotenkonfiguration

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Jede Option kann Variablen aus dem Workflow-Kontext verwenden. Für sensible Informationen können Sie auch globale Variablen und Secrets nutzen.

## Häufig gestellte Fragen (FAQ)

### Frequenzlimit für den Gmail-Versand

Beim Senden einiger E-Mails kann der folgende Fehler auftreten:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Dies liegt daran, dass Gmail Sendeanfragen von nicht spezifizierten Domains einem Frequenzlimit unterzieht. Beim Deployment der Anwendung müssen Sie den Hostnamen des Servers auf die Domain konfigurieren, die Sie in Gmail hinterlegt haben. Zum Beispiel bei einem Docker-Deployment:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Legen Sie hier Ihre konfigurierte Sendedomain fest
```

Referenz: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)