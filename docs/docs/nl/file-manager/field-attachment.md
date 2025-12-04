:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Bijlageveld

## Introductie

Het systeem heeft een ingebouwd bijlageveldtype om het uploaden van bestanden in aangepaste collecties te ondersteunen.

Het bijlageveld is in de basis een veld met een veel-op-veel-relatie dat verwijst naar de ingebouwde 'Attachments' (`attachments`) collectie. Wanneer u een bijlageveld aanmaakt in een collectie, wordt er automatisch een koppeltabel voor de veel-op-veel-relatie gegenereerd. De metadata van geüploade bestanden wordt opgeslagen in de 'Attachments' collectie, en de bestandsinformatie waarnaar in de collectie wordt verwezen, wordt via deze koppeltabel gekoppeld.

## Veldconfiguratie

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### MIME-typebeperkingen

Wordt gebruikt om de typen bestanden te beperken die u kunt uploaden, met behulp van de [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) syntaxis. Bijvoorbeeld: `image/*` staat voor afbeeldingsbestanden. Meerdere typen kunt u scheiden met een komma, bijvoorbeeld: `image/*,application/pdf` staat zowel afbeeldings- als PDF-bestandstypen toe.

### Opslagengine

Selecteer de opslagengine voor het opslaan van geüploade bestanden. Indien u dit veld leeg laat, wordt de standaard opslagengine van het systeem gebruikt.