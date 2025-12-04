---
pkg: '@nocobase/plugin-notification-manager'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Notificatiebeheer

## Introductie

Notificatiebeheer is een gecentraliseerde service die meerdere notificatiekanalen integreert. Het biedt een uniforme interface voor kanaalconfiguratie, verzendbeheer en logboekregistratie, en ondersteunt flexibele uitbreiding naar extra kanalen.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- **Paarse gedeelte**: Notificatiebeheer biedt een uitgebreide service die kanaalconfiguratie en logboekregistratie omvat, met de mogelijkheid om uit te breiden naar extra notificatiekanalen.
- **Groene gedeelte**: In-App Bericht (In-App Message), een ingebouwd kanaal, stelt gebruikers in staat om notificaties direct binnen de applicatie te ontvangen.
- **Rode gedeelte**: E-mail (Email), een uitbreidbaar kanaal, waarmee gebruikers notificaties via e-mail kunnen ontvangen.

## Kanaalbeheer

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

Momenteel ondersteunde kanalen:

- [In-App Bericht](/notification-manager/notification-in-app-message)
- [E-mail](/notification-manager/notification-email) (met ingebouwde SMTP-transportmethode)

U kunt ook uitbreiden naar meer kanalen. Raadpleeg hiervoor de documentatie over [Kanaaluitbreiding](/notification-manager/development/extension).

## Notificatielogboeken

Het systeem registreert gedetailleerde informatie en de status van elke notificatie, wat analyse en probleemoplossing vergemakkelijkt.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Workflow Notificatieknooppunt

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)