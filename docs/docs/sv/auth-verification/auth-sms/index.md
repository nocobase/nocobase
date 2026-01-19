---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# SMS-autentisering

## Introduktion

Pluginen för SMS-autentisering gör det möjligt för användare att registrera sig och logga in på NocoBase via SMS.

> Den behöver användas tillsammans med funktionen för SMS-verifieringskoder som tillhandahålls av [`@nocobase/plugin-verification` pluginen](/auth-verification/verification/).

## Lägg till SMS-autentisering

Gå till sidan för hantering av användarautentiserings-pluginen.

![](https://static-docs.nocobase.com/202502282112517.png)

Lägg till - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Konfiguration för ny version

:::info{title=Obs}
Den nya konfigurationen introducerades i `1.6.0-alpha.30` och planeras få stabilt stöd från och med `1.7.0`.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Verifierare:** Koppla en SMS-verifierare för att skicka SMS-verifieringskoder. Om ingen verifierare är tillgänglig behöver ni först gå till sidan för verifieringshantering och skapa en SMS-verifierare.
Se även:

- [Verifiering](../verification/index.md)
- [Verifiering: SMS](../verification/sms/index.md)

**Registrera automatiskt när användaren inte finns:** När detta alternativ är markerat, om användarens telefonnummer inte finns, kommer en ny användare att registreras med telefonnumret som användarnamn.

## Konfiguration för gammal version

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

Funktionen för SMS-inloggningsautentisering kommer att använda den konfigurerade och som standard inställda SMS-verifieringskod-Providern för att skicka SMS.

**Registrera automatiskt när användaren inte finns:** När detta alternativ är markerat, om användarens telefonnummer inte finns, kommer en ny användare att registreras med telefonnumret som användarnamn.

## Logga in

Besök inloggningssidan för att använda funktionen.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)