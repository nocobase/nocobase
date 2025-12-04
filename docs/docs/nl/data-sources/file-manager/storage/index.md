:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Overzicht

## Ingebouwde engines

NocoBase ondersteunt momenteel de volgende ingebouwde enginetypen:

- [Lokale opslag](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Bij de installatie van het systeem wordt automatisch een lokale opslagengine toegevoegd, die u direct kunt gebruiken. U kunt ook nieuwe engines toevoegen of de parameters van bestaande engines bewerken.

## Algemene engineparameters

Naast de specifieke parameters voor verschillende enginetypen, zijn de volgende parameters algemeen (met lokale opslag als voorbeeld):

![Voorbeeld van bestandsopslagengineconfiguratie](https://static-docs.nocobase.com/20240529115151.png)

### Titel

De naam van de opslagengine, voor menselijke herkenning.

### Systeemnaam

De systeemnaam van de opslagengine, voor systeemherkenning. Deze moet uniek zijn binnen het systeem. Als u dit veld leeg laat, wordt het automatisch door het systeem gegenereerd.

### Basis-URL voor toegang

Het voorvoegsel van het URL-adres voor externe toegang tot het bestand. Dit kan de basis-URL van een CDN zijn, bijvoorbeeld: "`https://cdn.nocobase.com/app`" (zonder de afsluitende "`/`").

### Pad

Het relatieve pad dat wordt gebruikt bij het opslaan van bestanden. Dit deel wordt ook automatisch toegevoegd aan de uiteindelijke URL wanneer het bestand wordt geopend. Bijvoorbeeld: "`user/avatar`" (zonder de beginnende of afsluitende "`/`").

### Bestandsgroottebeperking

De maximale bestandsgrootte voor uploads naar deze opslagengine. Bestanden die deze limiet overschrijden, kunnen niet worden geüpload. De standaardlimiet van het systeem is 20 MB, en de maximale instelbare limiet is 1 GB.

### Bestandstype

U kunt de typen bestanden beperken die kunnen worden geüpload, met behulp van de [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) syntaxis. Bijvoorbeeld: `image/*` staat voor afbeeldingsbestanden. Meerdere typen kunnen worden gescheiden door komma's, zoals: `image/*, application/pdf` staat voor zowel afbeeldingen als PDF-bestanden.

### Standaard opslagengine

Wanneer aangevinkt, wordt dit ingesteld als de standaard opslagengine van het systeem. Als een bijlageveld of bestands**collectie** geen opslagengine specificeert, worden geüploade bestanden opgeslagen in de standaard opslagengine. De standaard opslagengine kan niet worden verwijderd.

### Bestanden behouden bij verwijderen van records

Wanneer aangevinkt, blijven geüploade bestanden in de opslagengine behouden, zelfs wanneer de gegevensrecords in de bijlage- of bestands**collectie** worden verwijderd. Standaard is dit uitgeschakeld, wat betekent dat bestanden in de opslagengine samen met de records worden verwijderd.

:::info{title=Tip}
Nadat een bestand is geüpload, wordt het uiteindelijke toegangspad samengesteld uit verschillende delen:

```
<Basis-URL voor toegang>/<Pad>/<Bestandsnaam><Extensie>
```

Bijvoorbeeld: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::