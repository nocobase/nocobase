:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# HTTP API

Bestandsuploads voor zowel bijlagevelden als bestands**collecties** worden ondersteund via de HTTP API. De manier van aanroepen verschilt afhankelijk van de opslag-engine die door het bijlageveld of de bestands**collectie** wordt gebruikt.

## Uploaden via de server

Voor ingebouwde open-source opslag-engines in het project, zoals S3, OSS en COS, is de HTTP API-aanroep hetzelfde als de uploadfunctie van de gebruikersinterface. Bestanden worden altijd via de server geüpload. Bij het aanroepen van de API moet u een JWT-token op basis van de gebruikerslogin meesturen via de `Authorization` request header; anders wordt de toegang geweigerd.

### Bijlageveld

Start een `create`-actie op de `attachments`-resource (de bijlage**collectie**), verstuur een POST-verzoek en upload de binaire inhoud via het `file`-veld. Na de aanroep wordt het bestand geüpload naar de standaard opslag-engine.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Als u een bestand naar een andere opslag-engine wilt uploaden, kunt u de `attachmentField`-parameter gebruiken om de opslag-engine te specificeren die voor het **collectie**veld is geconfigureerd (indien niet geconfigureerd, wordt het geüpload naar de standaard opslag-engine).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Bestands**collectie**

Het uploaden naar een bestands**collectie** genereert automatisch een bestandsrecord. Start een `create`-actie op de bestands**collectie**-resource, verstuur een POST-verzoek en upload de binaire inhoud via het `file`-veld.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Bij het uploaden naar een bestands**collectie** hoeft u geen opslag-engine te specificeren; het bestand wordt geüpload naar de opslag-engine die voor die **collectie** is geconfigureerd.

## Uploaden via de client

Voor S3-compatibele opslag-engines die via de commerciële S3-Pro **plugin** worden aangeboden, moet de HTTP API-upload in verschillende stappen worden aangeroepen.

### Bijlageveld

1.  Opslag-engine-informatie ophalen

    Start een `getBasicInfo`-actie op de `storages`-**collectie**, met de opslagnaam (`storage name`), om de configuratie-informatie van de opslag-engine op te vragen.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Voorbeeld van geretourneerde opslag-engine-configuratie-informatie:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Vooraf ondertekende informatie van de serviceprovider ophalen

    Start een `createPresignedUrl`-actie op de `fileStorageS3`-resource, verstuur een POST-verzoek en voeg bestandsgerelateerde informatie toe in de body om de vooraf ondertekende uploadinformatie te verkrijgen.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Opmerking:
    > 
    > * name: Bestandsnaam
    > * size: Bestandsgrootte (in bytes)
    > * type: Het MIME-type van het bestand. U kunt hiernaar verwijzen: [Veelvoorkomende MIME-types](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: De ID van de opslag-engine (het `id`-veld dat in de eerste stap is geretourneerd)
    > * storageType: Het type opslag-engine (het `type`-veld dat in de eerste stap is geretourneerd)
    > 
    > Voorbeeld van aanvraaggegevens:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    De datastructuur van de verkregen vooraf ondertekende informatie is als volgt:

    ```json
    {
      "putUrl": "https://xxxxxxx",
      "fileInfo": {
        "key": "xxx",
        "title": "xxx",
        "filename": "xxx",
        "extname": ".png",
        "size": 4405,
        "mimetype": "image/png",
        "meta": {},
        "url": ""
      }
    }
    ```

3.  Bestand uploaden

    Gebruik de geretourneerde `putUrl` om een `PUT`-verzoek te initiëren en het bestand als body te uploaden.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Opmerking:
    > * putUrl: Het `putUrl`-veld dat in de vorige stap is geretourneerd
    > * file_path: Het lokale pad van het te uploaden bestand
    > 
    > Voorbeeld van aanvraaggegevens:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Bestandsrecord aanmaken

    Na een succesvolle upload start u een `create`-actie op de `attachments`-resource (de bijlage**collectie**) door een POST-verzoek te versturen om het bestandsrecord aan te maken.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Beschrijving van afhankelijke gegevens in data-raw:
    > * title: Het `fileInfo.title`-veld dat in de vorige stap is geretourneerd
    > * filename: Het `fileInfo.key`-veld dat in de vorige stap is geretourneerd
    > * extname: Het `fileInfo.extname`-veld dat in de vorige stap is geretourneerd
    > * path: Standaard leeg
    > * size: Het `fileInfo.size`-veld dat in de vorige stap is geretourneerd
    > * url: Standaard leeg
    > * mimetype: Het `fileInfo.mimetype`-veld dat in de vorige stap is geretourneerd
    > * meta: Het `fileInfo.meta`-veld dat in de vorige stap is geretourneerd
    > * storageId: Het `id`-veld dat in de eerste stap is geretourneerd
    > 
    > Voorbeeld van aanvraaggegevens:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Bestands**collectie**

De eerste drie stappen zijn hetzelfde als voor uploads via een bijlageveld, maar in de vierde stap moet u een bestandsrecord aanmaken. Dit doet u door een `create`-actie op de bestands**collectie**-resource te starten, een POST-verzoek te versturen en de bestandsinformatie via de body te uploaden.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Beschrijving van afhankelijke gegevens in data-raw:
> * title: Het `fileInfo.title`-veld dat in de vorige stap is geretourneerd
> * filename: Het `fileInfo.key`-veld dat in de vorige stap is geretourneerd
> * extname: Het `fileInfo.extname`-veld dat in de vorige stap is geretourneerd
> * path: Standaard leeg
> * size: Het `fileInfo.size`-veld dat in de vorige stap is geretourneerd
> * url: Standaard leeg
> * mimetype: Het `fileInfo.mimetype`-veld dat in de vorige stap is geretourneerd
> * meta: Het `fileInfo.meta`-veld dat in de vorige stap is geretourneerd
> * storageId: Het `id`-veld dat in de eerste stap is geretourneerd
> 
> Voorbeeld van aanvraaggegevens:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```