:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Overzicht

## Introductie

Opslag-engines worden gebruikt om bestanden op te slaan in specifieke services, waaronder lokale opslag (opgeslagen op de harde schijf van de server), cloudopslag, enzovoort.

Voordat u bestanden kunt uploaden, moet u eerst een opslag-engine configureren. Het systeem voegt tijdens de installatie automatisch een lokale opslag-engine toe, die u direct kunt gebruiken. U kunt ook nieuwe engines toevoegen of de parameters van bestaande engines bewerken.

## Typen opslag-engines

NocoBase ondersteunt momenteel de volgende ingebouwde engine-typen:

- [Lokale opslag](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

Het systeem voegt tijdens de installatie automatisch een lokale opslag-engine toe, die u direct kunt gebruiken. U kunt ook nieuwe engines toevoegen of de parameters van bestaande engines bewerken.

## Algemene parameters

Naast de specifieke parameters voor verschillende engine-typen, zijn de volgende parameters algemeen (met lokale opslag als voorbeeld):

![Voorbeeld van configuratie van een bestandsopslag-engine](https://static-docs.nocobase.com/20240529115151.png)

### Titel

De naam van de opslag-engine, voor menselijke identificatie.

### Systeemnaam

De systeemnaam van de opslag-engine, gebruikt voor systeemidentificatie. Deze moet uniek zijn binnen het systeem. Als u dit veld leeg laat, genereert het systeem automatisch een willekeurige naam.

### Openbaar URL-voorvoegsel

Het voorvoegsel van de publiek toegankelijke URL voor het bestand. Dit kan de basis-URL van een CDN zijn, zoals: "`https://cdn.nocobase.com/app`" (zonder afsluitende "/").

### Pad

Het relatieve pad dat wordt gebruikt bij het opslaan van bestanden. Dit deel wordt ook automatisch toegevoegd aan de uiteindelijke URL bij toegang. Bijvoorbeeld: "`user/avatar`" (zonder beginnende of afsluitende "/").

### Bestandsgroottebeperking

De maximale bestandsgrootte voor uploads naar deze opslag-engine. Bestanden die deze grootte overschrijden, kunnen niet worden geüpload. De standaardlimiet van het systeem is 20 MB en kan worden aangepast tot maximaal 1 GB.

### Bestandstypen

U kunt de typen bestanden beperken die kunnen worden geüpload, met behulp van de [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)-syntaxis. Bijvoorbeeld: `image/*` staat voor afbeeldingsbestanden. Meerdere typen kunnen worden gescheiden door komma's, zoals: `image/*, application/pdf` wat zowel afbeeldings- als PDF-bestanden toestaat.

### Standaard opslag-engine

Wanneer aangevinkt, wordt dit ingesteld als de standaard opslag-engine van het systeem. Als een bijlageveld of bestands**collectie** geen opslag-engine specificeert, worden geüploade bestanden opgeslagen in de standaard opslag-engine. De standaard opslag-engine kan niet worden verwijderd.

### Bestand behouden bij verwijdering van record

Wanneer aangevinkt, blijft het geüploade bestand in de opslag-engine behouden, zelfs als het gegevensrecord in de bijlage- of bestands**collectie** wordt verwijderd. Standaard is dit niet aangevinkt, wat betekent dat het bestand in de opslag-engine samen met het record wordt verwijderd.

:::info{title=Tip}
Nadat een bestand is geüpload, wordt het uiteindelijke toegangspad samengesteld uit verschillende delen:

```
<Openbaar URL-voorvoegsel>/<Pad>/<Bestandsnaam><Extensie>
```

Bijvoorbeeld: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::