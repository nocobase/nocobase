---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# E-mail verzenden

## Introductie

Wordt gebruikt om e-mails te verzenden. Ondersteunt e-mailinhoud in zowel tekst- als HTML-formaat.

## Knooppunt aanmaken

In de workflow configuratie-interface klikt u op de plusknop ("+") in de flow om een "E-mail verzenden" knooppunt toe te voegen:

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Knooppuntconfiguratie

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Elke optie kan gebruikmaken van variabelen uit de workflow context. Voor gevoelige informatie kunt u ook globale variabelen en geheimen gebruiken.

## Veelgestelde vragen

### Frequentielimiet voor het verzenden via Gmail

Bij het verzenden van bepaalde e-mails kunt u de volgende fout tegenkomen:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Dit komt doordat Gmail een frequentielimiet toepast op verzendverzoeken van niet-gespecificeerde domeinen. Bij het implementeren van de applicatie moet u de hostnaam van de server configureren naar het domein dat u in Gmail heeft ingesteld. Bijvoorbeeld, bij een Docker-implementatie:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Stel in op uw geconfigureerde verzenddomein
```

Zie ook: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)