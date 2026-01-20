---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Konfigurationsprocess

## Översikt
Efter att ni har aktiverat e-post-pluginet måste administratörer först slutföra nödvändig konfiguration innan vanliga användare kan ansluta sina e-postkonton till NocoBase. (För närvarande stöds endast auktoriserad inloggning för Outlook- och Gmail-konton; direkt inloggning med Microsoft- och Google-konton är ännu inte tillgänglig).

Kärnan i konfigurationen ligger i autentiseringsinställningarna för e-posttjänstleverantörens API-anrop. Administratörer behöver slutföra följande steg för att säkerställa att pluginet fungerar korrekt:

1.  **Hämta autentiseringsinformation från tjänstleverantören**
    -   Logga in på e-posttjänstleverantörens utvecklarkonsol (t.ex. Google Cloud Console eller Microsoft Azure Portal).
    -   Skapa en ny applikation eller ett nytt projekt och aktivera Gmail- eller Outlook-e-post-API-tjänsten.
    -   Hämta motsvarande klient-ID (Client ID) och klienthemlighet (Client Secret).
    -   Konfigurera omdirigerings-URI:n (Redirect URI) så att den matchar NocoBase-pluginets callback-adress.

2.  **Konfiguration av e-posttjänstleverantör**
    -   Gå till e-post-pluginets konfigurationssida.
    -   Ange den nödvändiga API-autentiseringsinformationen, inklusive klient-ID (Client ID) och klienthemlighet (Client Secret), för att säkerställa korrekt auktorisering med e-posttjänstleverantören.

3.  **Auktoriserad inloggning**
    -   Användare loggar in på sina e-postkonton via OAuth-protokollet.
    -   Pluginet genererar och lagrar automatiskt användarens auktoriseringstoken för efterföljande API-anrop och e-poståtgärder.

4.  **Ansluta e-postkonton**
    -   Efter lyckad auktorisering kommer användarens e-postkonto att anslutas till NocoBase.
    -   Pluginet synkroniserar användarens e-postdata och tillhandahåller funktioner för att hantera, skicka och ta emot e-postmeddelanden.

5.  **Använda e-postfunktioner**
    -   Användare kan direkt visa, hantera och skicka e-postmeddelanden inom plattformen.
    -   Alla åtgärder slutförs via e-posttjänstleverantörens API-anrop, vilket säkerställer synkronisering i realtid och effektiv överföring.

Genom den ovan beskrivna processen kan NocoBase:s e-post-plugin erbjuda användare effektiva och säkra e-posthanteringstjänster. Om ni stöter på problem under konfigurationen, vänligen se relevant dokumentation eller kontakta supportteamet för hjälp.

## Plugin-konfiguration

### Aktivera e-post-pluginet

1.  Gå till sidan för plugin-hantering
2.  Hitta "Email manager"-pluginet och aktivera det

### Konfiguration av e-posttjänstleverantör

Efter att e-post-pluginet har aktiverats kan ni konfigurera e-posttjänstleverantörerna. För närvarande stöds e-posttjänster från Google och Microsoft. Klicka på "Inställningar" -> "E-postinställningar" i toppmenyn för att komma till inställningssidan.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

För varje tjänstleverantör behöver ni fylla i Klient-ID (Client ID) och Klienthemlighet (Client Secret). Nedan beskrivs i detalj hur ni hämtar dessa två parametrar.