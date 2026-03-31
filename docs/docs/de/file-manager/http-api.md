:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# HTTP API

Das Hochladen von Dateien für Anhangsfelder und Datei-Sammlungen wird über die HTTP API unterstützt. Die Aufrufmethode unterscheidet sich je nach dem Speicher-Engine, der für das Anhangsfeld oder die Datei-Sammlung verwendet wird.

## Serverseitiger Upload

Bei integrierten Open-Source-Speicher-Engines im Projekt, wie S3, OSS und COS, entspricht der HTTP API-Aufruf der Upload-Funktion der Benutzeroberfläche, und Dateien werden serverseitig hochgeladen. Beim Aufruf der API müssen Sie ein JWT-Token, das auf der Benutzeranmeldung basiert, über den `Authorization`-Request-Header übermitteln; andernfalls wird der Zugriff verweigert.

### Anhangsfeld

Führen Sie eine `create`-Aktion für die `attachments`-Ressource aus, senden Sie eine POST-Anfrage und laden Sie den binären Inhalt über das `file`-Feld hoch. Nach dem Aufruf wird die Datei in den Standard-Speicher-Engine hochgeladen.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Um eine Datei in einen anderen Speicher-Engine hochzuladen, können Sie den `attachmentField`-Parameter verwenden. Damit geben Sie den Speicher-Engine an, der für das Feld der Sammlung konfiguriert ist (falls nicht konfiguriert, wird die Datei in den Standard-Speicher-Engine hochgeladen).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Datei-Sammlung

Beim Hochladen in eine Datei-Sammlung wird automatisch ein Dateieintrag generiert. Führen Sie eine `create`-Aktion für die Ressource der Datei-Sammlung aus, senden Sie eine POST-Anfrage und laden Sie den binären Inhalt über das `file`-Feld hoch.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Beim Hochladen in eine Datei-Sammlung müssen Sie keinen Speicher-Engine angeben; die Datei wird in den für diese Sammlung konfigurierten Speicher-Engine hochgeladen.

## Clientseitiger Upload

Für S3-kompatible Speicher-Engines, die über das kommerzielle S3-Pro Plugin bereitgestellt werden, erfolgt der HTTP API-Upload in mehreren Schritten.

### Anhangsfeld

1.  Speicher-Engine-Informationen abrufen

    Führen Sie eine `getBasicInfo`-Aktion für die `storages`-Sammlung aus und übermitteln Sie den Speicher-Namen, um die Konfigurationsinformationen des Speicher-Engines anzufordern.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Beispiel der zurückgegebenen Speicher-Engine-Konfigurationsinformationen:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Vorab signierte Informationen vom Dienstanbieter abrufen

    Führen Sie eine `createPresignedUrl`-Aktion für die `fileStorageS3`-Ressource aus, senden Sie eine POST-Anfrage und fügen Sie dateibezogene Informationen in den Body ein, um die vorab signierten Upload-Informationen zu erhalten.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Hinweis:
    > 
    > * name: Dateiname
    > * size: Dateigröße (in Bytes)
    > * type: Der MIME-Typ der Datei. Sie können sich hier informieren: [Häufige MIME-Typen](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: Die ID des Speicher-Engines (das `id`-Feld, das im ersten Schritt zurückgegeben wurde)
    > * storageType: Der Typ des Speicher-Engines (das `type`-Feld, das im ersten Schritt zurückgegeben wurde)
    > 
    > Beispiel für Anfragedaten:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Die Datenstruktur der erhaltenen vorab signierten Informationen sieht wie folgt aus:

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

3.  Datei-Upload

    Verwenden Sie die zurückgegebene `putUrl`, um eine `PUT`-Anfrage zu initiieren und die Datei als Body hochzuladen.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Hinweis:
    > * putUrl: Das `putUrl`-Feld, das im vorherigen Schritt zurückgegeben wurde
    > * file_path: Der lokale Pfad der hochzuladenden Datei
    > 
    > Beispiel für Anfragedaten:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Dateieintrag erstellen

    Nach einem erfolgreichen Upload führen Sie eine `create`-Aktion für die `attachments`-Ressource aus, indem Sie eine POST-Anfrage senden, um den Dateieintrag zu erstellen.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Erläuterung der abhängigen Daten in data-raw:
    > * title: Das `fileInfo.title`-Feld, das im vorherigen Schritt zurückgegeben wurde
    > * filename: Das `fileInfo.key`-Feld, das im vorherigen Schritt zurückgegeben wurde
    > * extname: Das `fileInfo.extname`-Feld, das im vorherigen Schritt zurückgegeben wurde
    > * path: Standardmäßig leer
    > * size: Das `fileInfo.size`-Feld, das im vorherigen Schritt zurückgegeben wurde
    > * url: Standardmäßig leer
    > * mimetype: Das `fileInfo.mimetype`-Feld, das im vorherigen Schritt zurückgegeben wurde
    > * meta: Das `fileInfo.meta`-Feld, das im vorherigen Schritt zurückgegeben wurde
    > * storageId: Das `id`-Feld, das im ersten Schritt zurückgegeben wurde
    > 
    > Beispiel für Anfragedaten:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Datei-Sammlung

Die ersten drei Schritte sind identisch mit dem Upload für Anhangsfelder. Im vierten Schritt müssen Sie jedoch einen Dateieintrag erstellen, indem Sie eine `create`-Aktion für die Ressource der Datei-Sammlung ausführen, eine POST-Anfrage senden und die Dateiinformationen über den Body hochladen.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Erläuterung der abhängigen Daten in data-raw:
> * title: Das `fileInfo.title`-Feld, das im vorherigen Schritt zurückgegeben wurde
> * filename: Das `fileInfo.key`-Feld, das im vorherigen Schritt zurückgegeben wurde
> * extname: Das `fileInfo.extname`-Feld, das im vorherigen Schritt zurückgegeben wurde
> * path: Standardmäßig leer
> * size: Das `fileInfo.size`-Feld, das im vorherigen Schritt zurückgegeben wurde
> * url: Standardmäßig leer
> * mimetype: Das `fileInfo.mimetype`-Feld, das im vorherigen Schritt zurückgegeben wurde
> * meta: Das `fileInfo.meta`-Feld, das im vorherigen Schritt zurückgegeben wurde
> * storageId: Das `id`-Feld, das im ersten Schritt zurückgegeben wurde
> 
> Beispiel für Anfragedaten:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```