---
pkg: '@nocobase/plugin-two-factor-authentication'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Twee-factorauthenticatie (2FA)

## Introductie

Twee-factorauthenticatie (2FA) is een extra beveiligingsmaatregel die wordt gebruikt bij het inloggen op een applicatie. Wanneer 2FA is ingeschakeld, moeten gebruikers naast hun wachtwoord een extra verificatiemethode opgeven, zoals een OTP-code of TOTP.

:::info{title=Opmerking}
Momenteel is het 2FA-proces alleen van toepassing op wachtwoordgebaseerde logins. Als uw applicatie SSO of andere authenticatiemethoden heeft ingeschakeld, gebruik dan de multi-factorauthenticatie (MFA) die wordt aangeboden door de betreffende IdP.
:::

## Plugin inschakelen

![](https://static-docs.nocobase.com/202502282108145.png)

## Beheerdersconfiguratie

Nadat u de plugin heeft ingeschakeld, wordt er een 2FA-configuratiepagina toegevoegd aan de authenticatiebeheerpagina.

Beheerders moeten de optie "Twee-factorauthenticatie (2FA) voor alle gebruikers afdwingen" aanvinken en een beschikbaar type authenticatieapparaat selecteren om te koppelen. Als er geen authenticatieapparaten beschikbaar zijn, dient u eerst een nieuw authenticatieapparaat aan te maken op de verificatiebeheerpagina. Zie [Verificatie](../verification/index.md) voor meer details.

![](https://static-docs.nocobase.com/202502282109802.png)

## Gebruikerslogin

Zodra 2FA is ingeschakeld, komen gebruikers die met een wachtwoord inloggen in het 2FA-verificatieproces terecht.

Als een gebruiker nog geen van de opgegeven authenticatieapparaten heeft gekoppeld, wordt u gevraagd er een te koppelen. Na een succesvolle koppeling krijgt u toegang tot de applicatie.

![](https://static-docs.nocobase.com/202502282110829.png)

Als een gebruiker al een van de opgegeven authenticatieapparaten heeft gekoppeld, wordt u gevraagd uw identiteit te verifiëren met behulp van het gekoppelde authenticatieapparaat. Na succesvolle verificatie krijgt u toegang tot de applicatie.

![](https://static-docs.nocobase.com/202502282110148.png)

Na het inloggen kunt u extra authenticatieapparaten koppelen op de verificatiebeheerpagina in uw persoonlijke centrum.

![](https://static-docs.nocobase.com/202502282110024.png)