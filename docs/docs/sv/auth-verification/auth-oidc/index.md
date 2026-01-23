---
pkg: '@nocobase/plugin-auth-oidc'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Autentisering: OIDC

## Introduktion

Pluginen Autentisering: OIDC följer OIDC-protokollstandarden (Open ConnectID) och använder auktoriseringskodflödet (Authorization Code Flow) för att låta användare logga in på NocoBase med konton som tillhandahålls av tredjepartsleverantörer av identitetsautentisering (IdP).

## Aktivera pluginen

![](https://static-docs.nocobase.com/202411122358790.png)

## Lägg till OIDC-autentisering

Gå till sidan för hantering av användarautentiseringspluginen.

![](https://static-docs.nocobase.com/202411130004459.png)

Lägg till - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Konfiguration

### Grundläggande konfiguration

![](https://static-docs.nocobase.com/202411130006341.png)

| Konfiguration                                      | Beskrivning                                                                                                                                                                | Version        |
| :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| Sign up automatically when the user does not exist | Ska en ny användare automatiskt skapas om ingen matchande befintlig användare hittas?                                                                                      | -              |
| Issuer                                             | Utfärdaren som tillhandahålls av IdP, slutar vanligtvis med `/.well-known/openid-configuration`.                                                                           | -              |
| Client ID                                          | Klient-ID                                                                                                                                                                  | -              |
| Client Secret                                      | Klienthemlighet                                                                                                                                                            | -              |
| scope                                              | Valfritt, standard är `openid email profile`.                                                                                                                              | -              |
| id_token signed response algorithm                 | Signeringsalgoritmen för `id_token`, standard är `RS256`.                                                                                                                  | -              |
| Enable RP-initiated logout                         | Aktiverar RP-initierad utloggning. Loggar ut IdP-sessionen när användaren loggar ut. IdP:s utloggningscallback ska använda den Post logout redirect URL som anges under [Användning](#anvandning). | `v1.3.44-beta` |

### Fältmappning

![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)

| Konfiguration                   | Beskrivning                                                                                                                                                      |
| :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field Map                       | Fältmappning. NocoBase stöder för närvarande mappning av fält som smeknamn, e-post och telefonnummer. Standard för smeknamn är `openid`.                         |
| Use this field to bind the user | Används för att matcha och koppla till befintliga användare. Du kan välja e-post eller användarnamn, med e-post som standard. IdP måste tillhandahålla användarinformation som innehåller fälten `email` eller `username`. |

### Avancerad konfiguration

![](https://static-docs.nocobase.com/202411130013306.png)

| Konfiguration                                                     | Beskrivning                                                                                                                                                                                                                                                         | Version        |
| :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------- |
| HTTP                                                              | Om NocoBase callback-URL:en använder HTTP-protokollet, standard är `https`.                                                                                                                                                                                         | -              |
| Port                                                              | Port för NocoBase callback-URL:en, standard är `443/80`.                                                                                                                                                                                                            | -              |
| State token                                                       | Används för att verifiera begärans källa och förhindra CSRF-attacker. Du kan ange ett fast värde, men **det rekommenderas starkt att lämna det tomt, då slumpmässiga värden genereras som standard. Om du använder ett fast värde, vänligen utvärdera din miljö och säkerhetsrisker noggrant.** | -              |
| Pass parameters in the authorization code grant exchange          | När du utbyter en kod mot en token kan vissa IdP:er kräva att Client ID eller Client Secret skickas som parametrar. Du kan markera detta alternativ och ange motsvarande parameternamn.                                                                                | -              |
| Method to call the user info endpoint                             | HTTP-metoden som används vid anrop till API:et för användarinformation.                                                                                                                                                                                             | -              |
| Where to put the access token when calling the user info endpoint | Hur åtkomsttoken skickas vid anrop till API:et för användarinformation:<br/>- Header - I begärans rubrik (standard).<br />- Body - I begärans kropp, används med `POST`-metoden.<br />- Query parameters - Som frågeparametrar, används med `GET`-metoden.                   | -              |
| Skip SSL verification                                             | Hoppa över SSL-verifiering vid anrop till IdP API:et. **Detta alternativ exponerar ditt system för risker med man-in-the-middle-attacker. Aktivera endast detta alternativ om du förstår dess syfte och konsekvenser. Det avråds starkt från att använda denna inställning i produktionsmiljöer.**        | `v1.3.40-beta` |

### Användning

![](https://static-docs.nocobase.com/202411130019570.png)

| Konfiguration            | Beskrivning                                                                                    |
| :----------------------- | :--------------------------------------------------------------------------------------------- |
| Redirect URL             | Används för att konfigurera callback-URL:en i IdP.                                                 |
| Post logout redirect URL | Används för att konfigurera Post logout redirect URL i IdP när RP-initierad utloggning är aktiverad. |

:::info
Vid lokal testning, använd `127.0.0.1` istället för `localhost` för URL:en, eftersom OIDC-inloggning kräver att ett `state`-värde skrivs till klientens cookie för säkerhetsvalidering. Om inloggningsfönstret bara blinkar till men du inte lyckas logga in, kontrollera serverloggarna för att se om det finns problem med `state`-matchning och se till att `state`-parametern inkluderas i begärans cookie. Detta problem uppstår ofta när `state`-värdet i klientens cookie inte matchar `state`-värdet i begäran.
:::

## Logga in

Besök inloggningssidan och klicka på knappen under inloggningsformuläret för att initiera tredjepartsinloggning.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)