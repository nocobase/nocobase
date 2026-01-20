---
pkg: "@nocobase/plugin-file-manager"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# Bestandsbeheer

## Introductie

De Bestandsbeheer plugin biedt een bestands**collectie**, bijlagevelden en bestandsopslag-engines voor het effectief beheren van bestanden. Bestanden zijn records in een speciaal type **collectie**, bekend als een bestands**collectie**, die bestandsmetadata opslaat en beheerd kan worden via Bestandsbeheer. Bijlagevelden zijn specifieke associatievelden die gekoppeld zijn aan de bestands**collectie**. De plugin ondersteunt meerdere opslagmethoden, waaronder lokale opslag, Alibaba Cloud OSS, Amazon S3 en Tencent Cloud COS.

## Gebruikershandleiding

### Bestands**collectie**

Een `attachments` **collectie** is ingebouwd om alle bestanden op te slaan die gekoppeld zijn aan bijlagevelden. Daarnaast kunt u nieuwe bestands**collecties** aanmaken om specifieke bestanden op te slaan.

[Meer informatie vindt u in de documentatie over bestands**collecties**](/data-sources/file-manager/file-collection)

### Bijlageveld

Bijlagevelden zijn specifieke associatievelden die gerelateerd zijn aan de bestands**collectie**, en die kunnen worden aangemaakt via het veldtype "Bijlage" of geconfigureerd via een "Relatie" veld.

[Meer informatie vindt u in de documentatie over bijlagevelden](/data-sources/file-manager/field-attachment)

### Bestandsopslag-engine

De bestandsopslag-engine wordt gebruikt om bestanden op te slaan in specifieke services, waaronder lokale opslag (opslaan op de harde schijf van de server), cloudopslag, enzovoort.

[Meer informatie vindt u in de documentatie over bestandsopslag-engines](./storage/index.md)

### HTTP API

Bestandsuploads kunnen worden afgehandeld via de HTTP API, zie [HTTP API](./http-api.md).

## Ontwikkeling

*