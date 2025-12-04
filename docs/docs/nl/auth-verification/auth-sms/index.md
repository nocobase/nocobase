---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# SMS-authenticatie

## Introductie

De SMS-authenticatie **plugin** stelt gebruikers in staat om zich via SMS te registreren en in te loggen bij NocoBase.

> Deze functionaliteit moet worden gebruikt in combinatie met de SMS-verificatiecodefunctie die wordt aangeboden door de [`@nocobase/plugin-verification` plugin](/auth-verification/verification/).

## SMS-authenticatie toevoegen

Ga naar de beheerpagina voor de gebruikersauthenticatie **plugin**s.

![](https://static-docs.nocobase.com/202502282112517.png)

Toevoegen - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Configuratie nieuwe versie

:::info{title=Opmerking}
De nieuwe configuratie is geïntroduceerd in `1.6.0-alpha.30` en zal naar verwachting stabiel worden ondersteund vanaf `1.7.0`.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Verificator:** Koppel een SMS-verificator om SMS-verificatiecodes te versturen. Als er geen verificator beschikbaar is, moet u eerst naar de verificatiebeheerpagina gaan om een SMS-verificator aan te maken.
Zie ook:

- [Verificatie](../verification/index.md)
- [Verificatie: SMS](../verification/sms/index.md)

**Automatisch registreren wanneer de gebruiker niet bestaat:** Wanneer deze optie is aangevinkt, en het gebruikte telefoonnummer bestaat niet, wordt een nieuwe gebruiker geregistreerd met het telefoonnummer als bijnaam.

## Configuratie oude versie

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

De SMS-loginauthenticatiefunctionaliteit zal de geconfigureerde en als standaard ingestelde SMS-verificatiecode Provider gebruiken om tekstberichten te versturen.

**Automatisch registreren wanneer de gebruiker niet bestaat:** Wanneer deze optie is aangevinkt, en het gebruikte telefoonnummer bestaat niet, wordt een nieuwe gebruiker geregistreerd met het telefoonnummer als bijnaam.

## Inloggen

Ga naar de inlogpagina om deze functionaliteit te gebruiken.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)