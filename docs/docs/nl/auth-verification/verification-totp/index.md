---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Verificatie: TOTP Authenticator

## Introductie

De TOTP Authenticator stelt gebruikers in staat om elke authenticator te koppelen die voldoet aan de TOTP (Time-based One-Time Password) specificatie (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>), en identiteitsverificatie uit te voeren met behulp van een tijdgebonden eenmalig wachtwoord (TOTP).

## Beheerdersconfiguratie

Navigeer naar de pagina voor verificatiebeheer.

![](https://static-docs.nocobase.com/202502271726791.png)

Toevoegen - TOTP Authenticator

![](https://static-docs.nocobase.com/202502271745028.png)

Afgezien van een unieke identificatie en een titel, is er geen verdere configuratie vereist voor de TOTP authenticator.

![](https://static-docs.nocobase.com/202502271746034.png)

## Gebruikerskoppeling

Nadat de authenticator is toegevoegd, kunnen gebruikers de TOTP authenticator koppelen in het verificatiebeheer van hun persoonlijke omgeving.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
De plugin biedt momenteel geen herstelcode-mechanisme. Nadat de TOTP authenticator is gekoppeld, wordt u geadviseerd deze veilig te bewaren. Mocht de authenticator per ongeluk verloren gaan, dan kunt u een alternatieve verificatiemethode gebruiken om uw identiteit te verifiëren, en deze vervolgens ontkoppelen en opnieuw koppelen via een andere verificatiemethode.
:::

## Gebruikersontkoppeling

Voor het ontkoppelen van de authenticator is verificatie vereist via de reeds gekoppelde verificatiemethode.

![](https://static-docs.nocobase.com/202502282103205.png)