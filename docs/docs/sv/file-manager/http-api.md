:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# HTTP API

Bilduppladdningar för både bilagefält och fil-samlingar stöds via HTTP API. Hur anropet görs skiljer sig beroende på vilken lagringsmotor som används av bilagefältet eller fil-samlingen.

## Uppladdning via server

För inbyggda öppen källkods-lagringsmotorer i projektet, som S3, OSS och COS, är HTTP API-anropet detsamma som uppladdningsfunktionen i användargränssnittet, och filer laddas upp via servern. För att anropa API:et måste ni skicka en JWT-token baserad på användarinloggning via `Authorization`-request-headern; annars kommer åtkomst att nekas.

### Bilagefält

Initiera en `create`-åtgärd på `attachments`-resursen (bilagesamlingen), skicka en POST-förfrågan och ladda upp det binära innehållet via `file`-fältet. Efter anropet laddas filen upp till den förvalda lagringsmotorn.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Om ni behöver ladda upp en fil till en annan lagringsmotor kan ni använda parametern `attachmentField` för att ange den lagringsmotor som är konfigurerad för samlingsfältet (om ingen är konfigurerad laddas filen upp till den förvalda lagringsmotorn).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Fil-samling

När ni laddar upp till en fil-samling genereras automatiskt en filpost. Initiera en `create`-åtgärd på fil-samlingsresursen, skicka en POST-förfrågan och ladda upp det binära innehållet via `file`-fältet.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

När ni laddar upp till en fil-samling behöver ni inte ange någon lagringsmotor; filen laddas upp till den lagringsmotor som är konfigurerad för den samlingen.

## Uppladdning via klient

För S3-kompatibla lagringsmotorer som tillhandahålls via det kommersiella S3-Pro-pluginet, måste HTTP API-uppladdningen anropas i flera steg.

### Bilagefält

1.  Hämta information om lagringsmotor

    Initiera en `getBasicInfo`-åtgärd på `storages`-samlingen (lagringssamlingen), med lagringsnamnet, för att begära lagringsmotorns konfigurationsinformation.

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

2.  Hämta försignerade uppgifter från tjänsteleverantören

    Initiera en `createPresignedUrl`-åtgärd på `fileStorageS3`-resursen, skicka en POST-förfrågan och inkludera filrelaterad information i body för att få de försignerade uppladdningsuppgifterna.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Obs!
    > 
    > * name: Filnamn
    > * size: Filstorlek (i byte)
    > * type: Filens MIME-typ. Ni kan referera till: [Vanliga MIME-typer](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: Lagringsmotorns ID (fältet `id` som returnerades i första steget)
    > * storageType: Lagringsmotorns typ (fältet `type` som returnerades i första steget)
    > 
    > Exempel på förfrågningsdata:
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

3.  Filuppladdning

    Använd den returnerade `putUrl` för att initiera en `PUT`-förfrågan och ladda upp filen som body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Obs!
    > * putUrl: Fältet `putUrl` som returnerades i föregående steg
    > * file_path: Den lokala sökvägen till filen som ska laddas upp
    > 
    > Exempel på förfrågningsdata:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Skapa filpost

    Efter en lyckad uppladdning initierar ni en `create`-åtgärd på `attachments`-resursen (bilagesamlingen) genom att skicka en POST-förfrågan för att skapa filposten.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Beskrivning av beroende data i data-raw:
    > * title: Fältet `fileInfo.title` som returnerades i föregående steg
    > * filename: Fältet `fileInfo.key` som returnerades i föregående steg
    > * extname: Fältet `fileInfo.extname` som returnerades i föregående steg
    > * path: Tomt som standard
    > * size: Fältet `fileInfo.size` som returnerades i föregående steg
    > * url: Tomt som standard
    > * mimetype: Fältet `fileInfo.mimetype` som returnerades i föregående steg
    > * meta: Fältet `fileInfo.meta` som returnerades i föregående steg
    > * storageId: Fältet `id` som returnerades i första steget
    > 
    > Exempel på förfrågningsdata:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Fil-samling

De första tre stegen är desamma som för uppladdning av bilagefält, men i det fjärde steget behöver ni skapa en filpost genom att initiera en `create`-åtgärd på fil-samlingsresursen, skicka en POST-förfrågan och ladda upp filinformationen via body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Beskrivning av beroende data i data-raw:
> * title: Fältet `fileInfo.title` som returnerades i föregående steg
> * filename: Fältet `fileInfo.key` som returnerades i föregående steg
> * extname: Fältet `fileInfo.extname` som returnerades i föregående steg
> * path: Tomt som standard
> * size: Fältet `fileInfo.size` som returnerades i föregående steg
> * url: Tomt som standard
> * mimetype: Fältet `fileInfo.mimetype` som returnerades i föregående steg
> * meta: Fältet `fileInfo.meta` som returnerades i föregående steg
> * storageId: Fältet `id` som returnerades i första steget
> 
> Exempel på förfrågningsdata:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```