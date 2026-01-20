---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Authenticatie: DingTalk

## Introductie

De Authenticatie: DingTalk plugin stelt gebruikers in staat om met hun DingTalk-account in te loggen bij NocoBase.

## Plugin activeren

![](https://static-docs.nocobase.com/202406120929356.png)

## API-machtigingen aanvragen in de DingTalk Ontwikkelaarsconsole

Raadpleeg <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">DingTalk Open Platform - Login implementeren op websites van derden</a> om een applicatie aan te maken.

Ga naar de applicatiebeheerconsole en schakel "Informatie over persoonlijk telefoonnummer" en "Leesrechten voor persoonlijke informatie uit het adresboek" in.

![](https://static-docs.nocobase.com/202406120006620.png)

## Inloggegevens ophalen uit de DingTalk Ontwikkelaarsconsole

Kopieer de Client ID en Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## DingTalk-authenticatie toevoegen in NocoBase

Ga naar de beheerpagina voor gebruikersauthenticatie plugins.

![](https://static-docs.nocobase.com/202406112348051.png)

Toevoegen - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Configuratie

![](https://static-docs.nocobase.com/202406120016896.png)

- Automatisch registreren wanneer de gebruiker niet bestaat - Of er automatisch een nieuwe gebruiker moet worden aangemaakt wanneer er geen bestaande gebruiker wordt gevonden die overeenkomt met het telefoonnummer.
- Client ID en Client Secret - Vul de informatie in die u in de vorige stap hebt gekopieerd.
- Redirect URL - Callback URL, kopieer deze en ga verder naar de volgende stap.

## Callback URL configureren in de DingTalk Ontwikkelaarsconsole

Plak de gekopieerde callback URL in de DingTalk Ontwikkelaarsconsole.

![](https://static-docs.nocobase.com/202406120012221.png)

## Inloggen

Bezoek de inlogpagina en klik op de knop onder het inlogformulier om in te loggen via een externe partij.

![](https://static-docs.nocobase.com/202406120014539.png)