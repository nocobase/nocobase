---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Authenticatie: SAML 2.0

## Introductie

De Authenticatie: SAML 2.0 plugin volgt de SAML 2.0 (Security Assertion Markup Language 2.0) protocolstandaard, waardoor u kunt inloggen bij NocoBase met accounts die worden aangeboden door externe identiteitsaanbieders (IdP's).

## Plugin activeren

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## SAML-authenticatie toevoegen

Ga naar de beheerpagina voor gebruikersauthenticatieplugins.

![](https://static-docs.nocobase.com/202411130004459.png)

Toevoegen - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## Configuratie

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- SSO URL - Wordt geleverd door de IdP, gebruikt voor single sign-on (SSO).
- Public Certificate - Wordt geleverd door de IdP.
- Entity ID (IdP Issuer) - Optioneel, wordt geleverd door de IdP.
- http - Vink dit aan als uw NocoBase-applicatie het HTTP-protocol gebruikt.
- Gebruik dit veld om de gebruiker te koppelen - Het veld dat wordt gebruikt om te matchen en te koppelen aan bestaande gebruikers. U kunt kiezen voor e-mail of gebruikersnaam; de standaardwaarde is e-mail. De gebruikersinformatie die door de IdP wordt meegestuurd, moet het veld `email` of `username` bevatten.
- Automatisch registreren als de gebruiker niet bestaat - Vink dit aan om automatisch een nieuwe gebruiker aan te maken wanneer er geen overeenkomende bestaande gebruiker wordt gevonden.
- Gebruik - De `SP Issuer / EntityID` en `ACS URL` moeten worden gekopieerd en ingevuld in de corresponderende configuratie van de IdP.

## Veldtoewijzing

Veldtoewijzing moet worden geconfigureerd op het configuratieplatform van de IdP. Raadpleeg het [voorbeeld](./examples/google.md) voor meer informatie.

De velden die beschikbaar zijn voor toewijzing in NocoBase zijn:

- email (verplicht)
- phone (alleen van toepassing op platforms die `phone` in hun scope ondersteunen)
- nickname
- username
- firstName
- lastName

`nameID` wordt meegestuurd door het SAML-protocol en hoeft niet te worden toegewezen; het wordt opgeslagen als een unieke gebruikersidentificatie.
De prioriteit voor de bijnaam van nieuwe gebruikers is: `nickname` > `firstName lastName` > `username` > `nameID`
Het toewijzen van gebruikersorganisaties en -rollen wordt momenteel niet ondersteund.

## Inloggen

Ga naar de inlogpagina en klik op de knop onder het inlogformulier om in te loggen via een externe service.

![](https://static-docs.nocobase.com/7496365c9d36a294948e6adeb5b24bc.png)