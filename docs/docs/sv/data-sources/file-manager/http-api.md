:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# HTTP API

Filuppladdningar för både bilagefält och filsamlingar kan hanteras via HTTP API:et. Anropsmetoden skiljer sig åt beroende på vilken lagringsmotor som används av bilagan eller filsamlingen.

## Uppladdning via servern

För inbyggda öppen källkods-lagringsmotorer som S3, OSS och COS är HTTP API-anropet detsamma som det som används av uppladdningsfunktionen i användargränssnittet, där filer laddas upp via servern. API-anrop kräver att en användarbaserad JWT-token skickas med i `Authorization`-begäranshuvudet; annars kommer åtkomst att nekas.

### Bilagefält

Initiera en `create`-åtgärd på `attachments`-resursen (`attachments`) genom att skicka en POST-begäran och ladda upp det binära innehållet via fältet `file`. Efter anropet kommer filen att laddas upp till den förvalda lagringsmotorn.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

För att ladda upp filer till en annan lagringsmotor kan ni använda parametern `attachmentField` för att ange den lagringsmotor som är konfigurerad för samlingsfältet. Om ingen är konfigurerad kommer filen att laddas upp till den förvalda lagringsmotorn.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Filsamling

Uppladdning till en filsamling kommer automatiskt att generera en filpost. Initiera en `create`-åtgärd på filsamlingsresursen genom att skicka en POST-begäran och ladda upp det binära innehållet via fältet `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Vid uppladdning till en filsamling behöver ni inte ange en lagringsmotor; filen kommer att laddas upp till den lagringsmotor som är konfigurerad för den samlingen.

## Uppladdning via klienten

För S3-kompatibla lagringsmotorer som tillhandahålls via det kommersiella `S3-Pro`-`plugin`:et, kräver HTTP API-uppladdningen flera steg.

### Bilagefält

1.  Hämta information om lagringsmotorn

    Initiera en `getBasicInfo`-åtgärd på `storages`-samlingen (`storages`), inklusive lagringsnamnet, för att begära lagringsmotorns konfigurationsinformation.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Exempel på returnerad konfigurationsinformation för lagringsmotorn:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Hämta den försignerade URL:en från tjänsteleverantören

    Initiera en `createPresignedUrl`-åtgärd på `fileStorageS3`-resursen genom att skicka en POST-begäran med filrelaterad information i `body` för att få den försignerade uppladdningsinformationen.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Obs:
    >
    > *   `name`: Filnamn
    > *   `size`: Filstorlek (i byte)
    > *   `type`: Filens MIME-typ. Ni kan referera till: [Vanliga MIME-typer](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: Lagringsmotorns ID (fältet `id` som returnerades i steg 1).
    > *   `storageType`: Lagringsmotorns typ (fältet `type` som returnerades i steg 1).
    >
    > Exempel på begärandedata:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Datastrukturen för den erhållna försignerade informationen är följande:

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

3.  Ladda upp filen

    Använd den returnerade `putUrl`:en för att göra en `PUT`-begäran och ladda upp filen som `body`.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Obs:
    > *   `putUrl`: Fältet `putUrl` som returnerades i föregående steg.
    > *   `file_path`: Den lokala sökvägen till filen som ska laddas upp.
    >
    > Exempel på begärandedata:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Skapa filposten

    Efter en lyckad uppladdning, skapa filposten genom att initiera en `create`-åtgärd på `attachments`-resursen (`attachments`) med en POST-begäran.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Förklaring av beroende data i `data-raw`:
    > *   `title`: Fältet `fileInfo.title` som returnerades i föregående steg.
    > *   `filename`: Fältet `fileInfo.key` som returnerades i föregående steg.
    > *   `extname`: Fältet `fileInfo.extname` som returnerades i föregående steg.
    > *   `path`: Tomt som standard.
    > *   `size`: Fältet `fileInfo.size` som returnerades i föregående steg.
    > *   `url`: Tomt som standard.
    > *   `mimetype`: Fältet `fileInfo.mimetype` som returnerades i föregående steg.
    > *   `meta`: Fältet `fileInfo.meta` som returnerades i föregående steg.
    > *   `storageId`: Fältet `id` som returnerades i steg 1.
    >
    > Exempel på begärandedata:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Filsamling

De första tre stegen är desamma som för uppladdning till ett bilagefält. I det fjärde steget behöver ni dock skapa filposten genom att initiera en `create`-åtgärd på filsamlingsresursen med en POST-begäran, och ladda upp filinformationen i `body`.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Förklaring av beroende data i `data-raw`:
> *   `title`: Fältet `fileInfo.title` som returnerades i föregående steg.
> *   `filename`: Fältet `fileInfo.key` som returnerades i föregående steg.
> *   `extname`: Fältet `fileInfo.extname` som returnerades i föregående steg.
> *   `path`: Tomt som standard.
> *   `size`: Fältet `fileInfo.size` som returnerades i föregående steg.
> *   `url`: Tomt som standard.
> *   `mimetype`: Fältet `fileInfo.mimetype` som returnerades i föregående steg.
> *   `meta`: Fältet `fileInfo.meta` som returnerades i föregående steg.
> *   `storageId`: Fältet `id` som returnerades i steg 1.
>
> Exempel på begärandedata:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```