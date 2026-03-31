---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Authentifizierung: DingTalk

## Einführung

Das Authentifizierung: DingTalk Plugin ermöglicht Benutzern, sich mit ihren DingTalk-Konten bei NocoBase anzumelden.

## Plugin aktivieren

![](https://static-docs.nocobase.com/202406120929356.png)

## API-Berechtigungen im DingTalk Developer Console beantragen

Beachten Sie <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">DingTalk Offene Plattform – Anmeldung bei Drittanbieter-Websites implementieren</a>, um eine Anwendung zu erstellen.

Navigieren Sie zum Anwendungs-Management-Backend und aktivieren Sie „Informationen zur persönlichen Telefonnummer“ und „Leseberechtigung für persönliche Adressbuchinformationen“.

![](https://static-docs.nocobase.com/202406120006620.png)

## Anmeldeinformationen aus dem DingTalk Developer Console abrufen

Kopieren Sie die Client ID und das Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## DingTalk-Authentifizierung in NocoBase hinzufügen

Gehen Sie zur Verwaltungsseite der Benutzerauthentifizierungs-Plugins.

![](https://static-docs.nocobase.com/202406112348051.png)

Hinzufügen - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Konfiguration

![](https://static-docs.nocobase.com/202406120016896.png)

- Automatisch registrieren, wenn der Benutzer nicht existiert – Ob automatisch ein neuer Benutzer erstellt werden soll, wenn keine Übereinstimmung mit einem bestehenden Benutzer anhand der Telefonnummer gefunden wird.
- Client ID und Client Secret – Tragen Sie die im vorherigen Schritt kopierten Informationen ein.
- Redirect URL – Callback-URL, kopieren Sie diese und fahren Sie mit dem nächsten Schritt fort.

## Callback-URL im DingTalk Developer Console konfigurieren

Fügen Sie die kopierte Callback-URL in das Backend für DingTalk-Entwickler ein.

![](https://static-docs.nocobase.com/202406120012221.png)

## Anmeldung

Besuchen Sie die Anmeldeseite und klicken Sie auf die Schaltfläche unter dem Anmeldeformular, um die Anmeldung über einen Drittanbieter zu starten.

![](https://static-docs.nocobase.com/202406120014539.png)