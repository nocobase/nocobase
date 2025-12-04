:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Bijlageveld

## Introductie

Het systeem beschikt over een ingebouwd veldtype 'Bijlage', waarmee u bestanden kunt uploaden in uw aangepaste collecties.

Onder de motorkap is het bijlageveld een veel-op-veel relatieveld. Dit veld verwijst naar de ingebouwde 'Bijlagen' (`attachments`) collectie van het systeem. Zodra u een bijlageveld aanmaakt in een collectie, wordt er automatisch een veel-op-veel koppeltabel gegenereerd. De metadata van geüploade bestanden wordt opgeslagen in de 'Bijlagen' collectie, en de bestandsinformatie waarnaar in uw collectie wordt verwezen, wordt via deze koppeltabel gekoppeld.

## Veldconfiguratie

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### MIME-typebeperking

Gebruik dit om de toegestane bestandstypen voor uploads te beperken, met behulp van de [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) syntaxis. Bijvoorbeeld: `image/*` staat voor afbeeldingsbestanden. Meerdere typen kunt u scheiden met komma's, zoals `image/*,application/pdf`, wat zowel afbeeldings- als PDF-bestanden toestaat.

### Opslagengine

Kies de opslagengine die u wilt gebruiken voor geüploade bestanden. Als u dit veld leeg laat, wordt de standaard opslagengine van het systeem gebruikt.