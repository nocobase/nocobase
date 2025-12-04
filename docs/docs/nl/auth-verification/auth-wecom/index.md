---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Authenticatie: WeCom

## Introductie

De **WeCom** plugin stelt gebruikers in staat om met hun WeCom-account in te loggen bij NocoBase.

## Plugin activeren

![](https://static-docs.nocobase.com/202406272056962.png)

## Een aangepaste WeCom-applicatie aanmaken en configureren

Ga naar de WeCom-beheerconsole om een aangepaste applicatie aan te maken.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Klik op de applicatie om naar de detailpagina te gaan, scroll naar beneden en klik op "WeCom geautoriseerde login".

![](https://static-docs.nocobase.com/202406272104655.png)

Stel het geautoriseerde callback-domein in op het domein van uw NocoBase-applicatie.

![](https://static-docs.nocobase.com/202406272105662.png)

Ga terug naar de detailpagina van de app en klik op "Webautorisatie en JS-SDK".

![](https://static-docs.nocobase.com/202406272107063.png)

Stel het callback-domein voor de OAuth2.0 webautorisatiefunctie van de app in en verifieer dit.

![](https://static-docs.nocobase.com/202406272107899.png)

Klik op de detailpagina van de app op "Vertrouwd bedrijfs-IP".

![](https://static-docs.nocobase.com/202406272108834.png)

Configureer het IP-adres van de NocoBase-applicatie.

![](https://static-docs.nocobase.com/202406272109805.png)

## Referenties ophalen uit de WeCom-beheerconsole

Kopieer in de WeCom-beheerconsole, onder "Mijn bedrijf", de "Bedrijfs-ID".

![](https://static-docs.nocobase.com/202406272111637.png)

Ga in de WeCom-beheerconsole, onder "Appbeheer", naar de detailpagina van de in de vorige stap aangemaakte applicatie en kopieer de AgentId en Secret.

![](https://static-docs.nocobase.com/202406272122322.png)

## WeCom-authenticatie toevoegen in NocoBase

Ga naar de beheerpagina van de gebruikersauthenticatie-plugin.

![](https://static-docs.nocobase.com/202406272115044.png)

Toevoegen - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Configuratie

![](https://static-docs.nocobase.com/202412041459250.png)

| Optie                                                                                                | Beschrijving                                                                                                                                                                                   | Versievereiste |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Wanneer een telefoonnummer niet overeenkomt met een bestaande gebruiker, <br />moet er dan automatisch een nieuwe gebruiker worden aangemaakt | Wanneer een telefoonnummer niet overeenkomt met een bestaande gebruiker, wordt er dan automatisch een nieuwe gebruiker aangemaakt.                                                 | -                   |
| Bedrijfs-ID                                                                                            | Bedrijfs-ID, op te halen via de WeCom-beheerconsole.                                                                                                                                  | -                   |
| AgentId                                                                                               | Op te halen via de configuratie van de aangepaste applicatie in de WeCom-beheerconsole.                                                                 | -                   |
| Secret                                                                                                | Op te halen via de configuratie van de aangepaste applicatie in de WeCom-beheerconsole.                                                                 | -                   |
| Origin                                                                                                | Het domein van de huidige applicatie.                                                                                       | -                   |
| Omleidingslink voor de werkbankapplicatie                                                                   | Het applicatiepad waarnaar wordt omgeleid na een succesvolle login.                                                                           | `v1.4.0`            |
| Automatische login                                                                                       | Automatisch inloggen wanneer de applicatielink wordt geopend in de WeCom-browser. Wanneer er meerdere WeCom-authenticators zijn geconfigureerd, kan slechts één deze optie ingeschakeld hebben. | `v1.4.0`            |
| Startpaginalink van de werkbankapplicatie                                                                   | De startpaginalink van de werkbankapplicatie.                                                                                 | -                   |

## Startpagina van de WeCom-applicatie configureren

:::info
Voor versies `v1.4.0` en hoger, wanneer de optie "Automatische login" is ingeschakeld, kan de link naar de startpagina van de applicatie worden vereenvoudigd tot: `https://<url>/<path>`, bijvoorbeeld `https://example.nocobase.com/admin`.

U kunt ook afzonderlijke links configureren voor mobiel en desktop, bijvoorbeeld `https://example.nocobase.com/m` en `https://example.nocobase.com/admin`.
:::

Ga naar de WeCom-beheerconsole en plak de gekopieerde startpaginalink van de werkbankapplicatie in het adresveld van de startpagina van de betreffende applicatie.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Inloggen

Ga naar de inlogpagina en klik op de knop onder het inlogformulier om in te loggen via een derde partij.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
Vanwege de toegangsbeperkingen van WeCom voor gevoelige informatie zoals telefoonnummers, kan autorisatie alleen worden voltooid binnen de WeCom-client. Wanneer u voor de eerste keer inlogt met WeCom, volgt u de onderstaande stappen om de initiële loginautorisatie binnen de WeCom-client te voltooien.
:::

## Eerste keer inloggen

Ga vanuit de WeCom-client naar de Werkbank, scroll naar beneden en klik op de applicatie om de startpagina te openen die u eerder hebt geconfigureerd. Hiermee voltooit u de initiële autorisatie. Daarna kunt u WeCom gebruiken om in te loggen bij uw NocoBase-applicatie.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />