:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# HTTP API

Bestandsuploads voor zowel bijlagevelden als bestandscollecties kunt u afhandelen via de HTTP API. De manier van aanroepen verschilt afhankelijk van de opslagengine die de bijlage of bestandscollectie gebruikt.

## Uploaden via de server

Voor ingebouwde open-source opslagengines zoals S3, OSS en COS is de HTTP API-aanroep hetzelfde als die via de gebruikersinterface; bestanden worden via de server geüpload. Voor API-aanroepen moet u een JWT-token, gebaseerd op de gebruikerslogin, meesturen in de `Authorization`-requestheader; anders wordt de toegang geweigerd.

### Bijlageveld

U initieert een `create`-actie op de `attachments`-resource (bijlagecollectie) door een POST-verzoek te sturen en de binaire inhoud te uploaden via het `file`-veld. Na de aanroep wordt het bestand geüpload naar de standaard opslagengine.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Als u bestanden naar een andere opslagengine wilt uploaden, kunt u de `attachmentField`-parameter gebruiken om de geconfigureerde opslagengine voor het collectieveld te specificeren. Indien niet geconfigureerd, wordt het bestand geüpload naar de standaard opslagengine.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Bestandscollectie

Bij het uploaden naar een bestandscollectie wordt automatisch een bestandsrecord aangemaakt. U initieert een `create`-actie op de bestandscollectie-resource door een POST-verzoek te sturen en de binaire inhoud te uploaden via het `file`-veld.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Bij het uploaden naar een bestandscollectie hoeft u geen opslagengine te specificeren; het bestand wordt geüpload naar de opslagengine die voor die collectie is geconfigureerd.

## Uploaden via de client

Voor S3-compatibele opslagengines die worden aangeboden via de commerciële S3-Pro plugin, vereist het uploaden via de HTTP API verschillende stappen.

### Bijlageveld

1.  Opslagengine-informatie ophalen

    U initieert een `getBasicInfo`-actie op de `storages`-collectie, inclusief de opslagnaam (`storage name`), om de configuratie-informatie van de opslagengine op te vragen.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Voorbeeld van geretourneerde opslagengine-configuratie-informatie:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Voorgedefinieerde URL van de serviceprovider ophalen

    U initieert een `createPresignedUrl`-actie op de `fileStorageS3`-resource door een POST-verzoek te sturen met bestandsgerelateerde informatie in de body, om de voorgedefinieerde uploadinformatie te verkrijgen.

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
    > *   `name`: Bestandsnaam
    > *   `size`: Bestandsgrootte (in bytes)
    > *   `type`: Het MIME-type van het bestand. U kunt hiernaar verwijzen: [Veelvoorkomende MIME-typen](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: De ID van de opslagengine (het `id`-veld dat in stap 1 is geretourneerd).
    > *   `storageType`: Het type opslagengine (het `type`-veld dat in stap 1 is geretourneerd).
    >
    > Voorbeeld van aanvraaggegevens:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    De datastructuur van de verkregen voorgedefinieerde informatie is als volgt:

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

    Gebruik de geretourneerde `putUrl` om een `PUT`-verzoek te doen, waarbij u het bestand als body uploadt.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Opmerking:
    > *   `putUrl`: Het `putUrl`-veld dat in de vorige stap is geretourneerd.
    > *   `file_path`: Het lokale pad van het te uploaden bestand.
    >
    > Voorbeeld van aanvraaggegevens:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Bestandsrecord aanmaken

    Na een succesvolle upload creëert u het bestandsrecord door een `create`-actie te initiëren op de `attachments`-resource (bijlagecollectie) met een POST-verzoek.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Uitleg van afhankelijke gegevens in `data-raw`:
    > *   `title`: Het `fileInfo.title`-veld dat in de vorige stap is geretourneerd.
    > *   `filename`: Het `fileInfo.key`-veld dat in de vorige stap is geretourneerd.
    > *   `extname`: Het `fileInfo.extname`-veld dat in de vorige stap is geretourneerd.
    > *   `path`: Standaard leeg.
    > *   `size`: Het `fileInfo.size`-veld dat in de vorige stap is geretourneerd.
    > *   `url`: Standaard leeg.
    > *   `mimetype`: Het `fileInfo.mimetype`-veld dat in de vorige stap is geretourneerd.
    > *   `meta`: Het `fileInfo.meta`-veld dat in de vorige stap is geretourneerd.
    > *   `storageId`: Het `id`-veld dat in stap 1 is geretourneerd.
    >
    > Voorbeeld van aanvraaggegevens:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Bestandscollectie

De eerste drie stappen zijn hetzelfde als voor het uploaden naar een bijlageveld. In de vierde stap moet u echter het bestandsrecord aanmaken door een `create`-actie te initiëren op de bestandscollectie-resource met een POST-verzoek en de bestandsinformatie in de body te uploaden.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Uitleg van afhankelijke gegevens in `data-raw`:
> *   `title`: Het `fileInfo.title`-veld dat in de vorige stap is geretourneerd.
> *   `filename`: Het `fileInfo.key`-veld dat in de vorige stap is geretourneerd.
> *   `extname`: Het `fileInfo.extname`-veld dat in de vorige stap is geretourneerd.
> *   `path`: Standaard leeg.
> *   `size`: Het `fileInfo.size`-veld dat in de vorige stap is geretourneerd.
> *   `url`: Standaard leeg.
> *   `mimetype`: Het `fileInfo.mimetype`-veld dat in de vorige stap is geretourneerd.
> *   `meta`: Het `fileInfo.meta`-veld dat in de vorige stap is geretourneerd.
> *   `storageId`: Het `id`-veld dat in stap 1 is geretourneerd.
>
> Voorbeeld van aanvraaggegevens:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```