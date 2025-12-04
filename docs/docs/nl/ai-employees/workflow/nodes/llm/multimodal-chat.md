---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# Multimodale Conversatie

## Afbeeldingen

Als het model dit ondersteunt, kan het LLM-knooppunt afbeeldingen naar het model sturen. Wanneer u dit gebruikt, moet u via een variabele een bijlageveld of een gekoppelde bestandscollectie-record selecteren. Bij het selecteren van een bestandscollectie-record kunt u deze op objectniveau selecteren, of het URL-veld kiezen.

![](https://static-docs.nocobase.com/202503041034858.png)

Er zijn twee opties voor het verzendformaat van afbeeldingen:

- **Verzenden via URL** - Alle afbeeldingen, behalve die lokaal zijn opgeslagen, worden als URL's verzonden. Lokaal opgeslagen afbeeldingen worden vóór verzending omgezet naar base64-formaat.
- **Verzenden via base64** - Alle afbeeldingen, ongeacht of ze lokaal of in de cloud zijn opgeslagen, worden in base64-formaat verzonden. Dit is geschikt voor situaties waarin de afbeeldings-URL niet direct toegankelijk is voor de online LLM-service.

![](https://static-docs.nocobase.com/202503041200638.png)