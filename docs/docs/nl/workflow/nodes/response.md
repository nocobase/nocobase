---
pkg: "@nocobase/plugin-workflow-response-message"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# HTTP-respons

## Introductie

Dit knooppunt wordt alleen ondersteund in synchrone Webhook-workflows en wordt gebruikt om een respons terug te sturen naar een extern systeem. Bijvoorbeeld, tijdens de verwerking van een betalingscallback, als het bedrijfsproces een onverwacht resultaat heeft (zoals een fout of mislukking), kunt u het respons-knooppunt gebruiken om een foutrespons terug te sturen naar het externe systeem, zodat sommige externe systemen later opnieuw kunnen proberen op basis van de status.

Bovendien beëindigt de uitvoering van het respons-knooppunt de uitvoering van de workflow, en worden volgende knooppunten niet meer uitgevoerd. Als er geen respons-knooppunt is geconfigureerd in de gehele workflow, zal het systeem automatisch reageren op basis van de uitvoeringsstatus van de flow: `200` voor een succesvolle uitvoering en `500` voor een mislukte uitvoering.

## Een respons-knooppunt aanmaken

Klik in de workflow-configuratie-interface op de plusknop ('+') in de flow om een 'Respons'-knooppunt toe te voegen:

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Respons-configuratie

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

U kunt variabelen uit de workflow-context gebruiken in de respons-body.