---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Autentisering: DingTalk

## Introduktion

Pluginet Autentisering: DingTalk stöder användare att logga in på NocoBase med sina DingTalk-konton.

## Aktivera plugin

![](https://static-docs.nocobase.com/202406120929356.png)

## Ansök om API-behörigheter i DingTalks utvecklarkonsol

Se <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">DingTalks öppna plattform – Implementera inloggning till tredjepartswebbplatser</a> för att skapa en applikation.

Gå till applikationshanteringskonsolen och aktivera "Information om personligt telefonnummer" och "Läsbehörighet för personlig information i adressboken".

![](https://static-docs.nocobase.com/202406120006620.png)

## Hämta nycklar från DingTalks utvecklarkonsol

Kopiera klient-ID (Client ID) och klienthemlighet (Client Secret).

![](https://static-docs.nocobase.com/202406120000595.png)

## Lägg till DingTalk-autentisering i NocoBase

Gå till sidan för hantering av användarautentiseringsplugin.

![](https://static-docs.nocobase.com/202406112348051.png)

Lägg till - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Konfiguration

![](https://static-docs.nocobase.com/202406120016896.png)

- **Registrera automatiskt när användaren inte finns** – Om en ny användare automatiskt ska skapas när inget befintligt användarkonto matchas med telefonnumret.
- **Client ID och Client Secret** – Fyll i informationen som ni kopierade i föregående steg.
- **Redirect URL** – Återkallnings-URL. Kopiera den och fortsätt till nästa steg.

## Konfigurera återkallnings-URL i DingTalks utvecklarkonsol

Klistra in den kopierade återkallnings-URL:en i DingTalks utvecklarkonsol.

![](https://static-docs.nocobase.com/202406120012221.png)

## Logga in

Besök inloggningssidan och klicka på knappen under inloggningsformuläret för att initiera inloggning via tredje part.

![](https://static-docs.nocobase.com/202406120014539.png)