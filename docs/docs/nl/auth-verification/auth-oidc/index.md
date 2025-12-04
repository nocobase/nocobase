---
pkg: '@nocobase/plugin-auth-oidc'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Authenticatie: OIDC

## Introductie

De Authenticatie: OIDC plugin volgt de OIDC (OpenID Connect) protocolstandaard en gebruikt de Authorization Code Flow om gebruikers in staat te stellen in te loggen bij NocoBase met accounts die worden aangeboden door externe identiteitsaanbieders (IdP's).

## Plugin activeren

![](https://static-docs.nocobase.com/202411122358790.png)

## OIDC-authenticatie toevoegen

Ga naar de beheerpagina voor gebruikersauthenticatieplugins.

![](https://static-docs.nocobase.com/202411130004459.png)

Toevoegen - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Configuratie

### Basisconfiguratie

![](https://static-docs.nocobase.com/202411130006341.png)

| Configuratie                                      | Beschrijving                                                                                                                                                                | Versie         |
| :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| Automatisch registreren als gebruiker niet bestaat | Of er automatisch een nieuwe gebruiker moet worden aangemaakt als er geen overeenkomende bestaande gebruiker wordt gevonden.                                                  | -              |
| Issuer                                            | De issuer wordt geleverd door de IdP en eindigt meestal op `/.well-known/openid-configuration`.                                                                             | -              |
| Client ID                                         | De Client ID                                                                                                                                                                | -              |
| Client Secret                                     | Het Client Secret                                                                                                                                                           | -              |
| Scope                                             | Optioneel, standaard is `openid email profile`.                                                                                                                             | -              |
| id_token ondertekeningsalgoritme                  | Het ondertekeningsalgoritme voor de `id_token`, standaard is `RS256`.                                                                                                        | -              |
| RP-geïnitieerde uitloggen inschakelen             | Schakelt RP-geïnitieerde uitloggen in. Logt de IdP-sessie uit wanneer de gebruiker uitlogt. De IdP-uitlogcallback moet de Post logout redirect URL gebruiken die wordt vermeld onder [Gebruik](#gebruik). | `v1.3.44-beta` |

### Veldtoewijzing

![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)

| Configuratie                            | Beschrijving                                                                                                                                                      |
| :-------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Veldtoewijzing                          | Veldtoewijzing. NocoBase ondersteunt momenteel het toewijzen van velden zoals bijnaam, e-mail en telefoonnummer. De standaard bijnaam gebruikt `openid`.             |
| Gebruik dit veld om de gebruiker te koppelen | Wordt gebruikt om te matchen en te koppelen met bestaande gebruikers. U kunt kiezen voor e-mail of gebruikersnaam, waarbij e-mail de standaard is. De IdP moet gebruikersinformatie bevatten met de velden `email` of `username`. |

### Geavanceerde configuratie

![](https://static-docs.nocobase.com/202411130013306.png)

| Configuratie                                                     | Beschrijving                                                                                                                                                                                                                                                         | Versie         |
| :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| HTTP                                                             | Of de NocoBase callback URL het HTTP-protocol gebruikt, standaard is `https`.                                                                                                                                                                                       | -              |
| Poort                                                            | Poort voor de NocoBase callback URL, standaard is `443/80`.                                                                                                                                                                                                           | -              |
| State token                                                      | Wordt gebruikt om de bron van het verzoek te verifiëren en CSRF-aanvallen te voorkomen. U kunt een vaste waarde opgeven, maar **het wordt sterk aanbevolen om dit leeg te laten, zodat er standaard willekeurige waarden worden gegenereerd. Als u een vaste waarde gebruikt, evalueer dan zorgvuldig uw omgeving en beveiligingsrisico's.** | -              |
| Parameters doorgeven bij de uitwisseling van de autorisatiecode  | Sommige IdP's kunnen vereisen dat Client ID of Client Secret als parameters worden doorgegeven bij het uitwisselen van een code voor een token. U kunt deze optie selecteren en de corresponderende parameternamen opgeven.                                                                                | -              |
| Methode om het user info endpoint aan te roepen                   | De HTTP-methode die wordt gebruikt bij het aanvragen van de user info API.                                                                                                                                                                                                             | -              |
| Waar de access token te plaatsen bij het aanroepen van het user info endpoint | Hoe de access token wordt doorgegeven bij het aanroepen van de user info API:<br/>- Header - In de request header (standaard).<br />- Body - In de request body, te gebruiken met de `POST`-methode.<br />- Query parameters - Als queryparameters, te gebruiken met de `GET`-methode.                   | -              |
| SSL-verificatie overslaan                                        | Slaat SSL-verificatie over bij het aanvragen van de IdP API. **Deze optie stelt uw systeem bloot aan risico's van man-in-the-middle-aanvallen. Schakel deze optie alleen in als u het doel en de implicaties ervan begrijpt. Het wordt sterk afgeraden om deze instelling in productieomgevingen te gebruiken.**        | `v1.3.40-beta` |

### Gebruik

![](https://static-docs.nocobase.com/202411130019570.png)

| Configuratie             | Beschrijving                                                                                    |
| :----------------------- | :---------------------------------------------------------------------------------------------- |
| Redirect URL             | Wordt gebruikt om de callback URL in de IdP te configureren.                                                 |
| Post logout redirect URL | Wordt gebruikt om de Post logout redirect URL in de IdP te configureren wanneer RP-geïnitieerde uitloggen is ingeschakeld. |

:::info
Gebruik bij lokaal testen `127.0.0.1` in plaats van `localhost` voor de URL, aangezien OIDC-login vereist dat de 'state' naar de clientcookie wordt geschreven voor beveiligingsvalidatie. Als u een flits van het inlogvenster ziet, maar niet succesvol kunt inloggen, controleer dan de serverlogs op 'state mismatch'-problemen en zorg ervoor dat de 'state'-parameter is opgenomen in de requestcookie. Dit probleem treedt vaak op wanneer de 'state' in de clientcookie niet overeenkomt met de 'state' in het verzoek.
:::

## Inloggen

Ga naar de inlogpagina en klik op de knop onder het inlogformulier om in te loggen via een externe partij.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)