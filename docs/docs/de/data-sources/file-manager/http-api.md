:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# HTTP API

Dateiuploads für Anhangsfelder und Dateisammlungen können über die HTTP API abgewickelt werden. Die Aufrufmethode variiert je nach dem von der Anlage oder Dateisammlung verwendeten Speicher-Engine.

## Serverseitiger Upload

Für integrierte Open-Source-Speicher-Engines wie S3, OSS und COS ist der HTTP API-Aufruf identisch mit dem, der von der Benutzeroberfläche für Uploads verwendet wird. Die Dateien werden dabei serverseitig hochgeladen. API-Aufrufe erfordern die Übergabe eines benutzerbasierten JWT-Tokens im `Authorization`-Request-Header; andernfalls wird der Zugriff verweigert.

### Anhangsfeld

Führen Sie eine `create`-Aktion für die `attachments`-Ressource (Anhangs-Sammlung) aus, indem Sie eine POST-Anfrage senden und den binären Inhalt über das `file`-Feld hochladen. Nach dem Aufruf wird die Datei in die Standard-Speicher-Engine hochgeladen.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Um Dateien in eine andere Speicher-Engine hochzuladen, können Sie den Parameter `attachmentField` verwenden, um die für das Sammlungsfeld konfigurierte Speicher-Engine anzugeben. Ist keine konfiguriert, wird die Datei in die Standard-Speicher-Engine hochgeladen.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Dateisammlung

Beim Hochladen in eine Dateisammlung wird automatisch ein Dateieintrag generiert. Führen Sie eine `create`-Aktion für die Dateisammlungs-Ressource aus, indem Sie eine POST-Anfrage senden und den binären Inhalt über das `file`-Feld hochladen.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Beim Hochladen in eine Dateisammlung müssen Sie keine Speicher-Engine angeben; die Datei wird in die für diese Sammlung konfigurierte Speicher-Engine hochgeladen.

## Clientseitiger Upload

Für S3-kompatible Speicher-Engines, die über das kommerzielle S3-Pro Plugin bereitgestellt werden, erfordert der HTTP API-Upload mehrere Schritte.

### Anhangsfeld

1.  Speicher-Engine-Informationen abrufen

    Führen Sie eine `getBasicInfo`-Aktion für die `storages`-Sammlung aus und übergeben Sie dabei den Speichernamen, um die Konfigurationsinformationen der Speicher-Engine anzufordern.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Beispiel der zurückgegebenen Konfigurationsinformationen der Speicher-Engine:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Vorab signierte URL vom Dienstanbieter abrufen

    Führen Sie eine `createPresignedUrl`-Aktion für die `fileStorageS3`-Ressource aus, indem Sie eine POST-Anfrage mit dateibezogenen Informationen im Body senden, um die vorab signierten Upload-Informationen zu erhalten.

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
    > *   `name`: Dateiname
    > *   `size`: Dateigröße (in Bytes)
    > *   `type`: Der MIME-Typ der Datei. Siehe: [Häufige MIME-Typen](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: Die ID der Speicher-Engine (das `id`-Feld, das in Schritt 1 zurückgegeben wurde).
    > *   `storageType`: Der Typ der Speicher-Engine (das `type`-Feld, das in Schritt 1 zurückgegeben wurde).
    >
    > Beispiel-Anfragedaten:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Die Datenstruktur der erhaltenen vorab signierten Informationen ist wie folgt:

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

3.  Datei hochladen

    Verwenden Sie die zurückgegebene `putUrl`, um eine `PUT`-Anfrage zu stellen und die Datei als Body hochzuladen.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Hinweis:
    > *   `putUrl`: Das in dem vorherigen Schritt zurückgegebene `putUrl`-Feld.
    > *   `file_path`: Der lokale Pfad der hochzuladenden Datei.
    >
    > Beispiel-Anfragedaten:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Dateieintrag erstellen

    Nach einem erfolgreichen Upload erstellen Sie den Dateieintrag, indem Sie eine `create`-Aktion für die `attachments`-Ressource (Anhangs-Sammlung) mit einer POST-Anfrage ausführen.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Erläuterung der abhängigen Daten in `data-raw`:
    > *   `title`: Das `fileInfo.title`-Feld, das im vorherigen Schritt zurückgegeben wurde.
    > *   `filename`: Das `fileInfo.key`-Feld, das im vorherigen Schritt zurückgegeben wurde.
    > *   `extname`: Das `fileInfo.extname`-Feld, das im vorherigen Schritt zurückgegeben wurde.
    > *   `path`: Standardmäßig leer.
    > *   `size`: Das `fileInfo.size`-Feld, das im vorherigen Schritt zurückgegeben wurde.
    > *   `url`: Standardmäßig leer.
    > *   `mimetype`: Das `fileInfo.mimetype`-Feld, das im vorherigen Schritt zurückgegeben wurde.
    > *   `meta`: Das `fileInfo.meta`-Feld, das im vorherigen Schritt zurückgegeben wurde.
    > *   `storageId`: Das `id`-Feld, das in Schritt 1 zurückgegeben wurde.
    >
    > Beispiel-Anfragedaten:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Dateisammlung

Die ersten drei Schritte sind identisch mit dem Upload in ein Anhangsfeld. Im vierten Schritt müssen Sie jedoch den Dateieintrag erstellen, indem Sie eine `create`-Aktion für die Dateisammlungs-Ressource mit einer POST-Anfrage ausführen und die Dateiinformationen im Body hochladen.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Erläuterung der abhängigen Daten in `data-raw`:
> *   `title`: Das `fileInfo.title`-Feld, das im vorherigen Schritt zurückgegeben wurde.
> *   `filename`: Das `fileInfo.key`-Feld, das im vorherigen Schritt zurückgegeben wurde.
> *   `extname`: Das `fileInfo.extname`-Feld, das im vorherigen Schritt zurückgegeben wurde.
> *   `path`: Standardmäßig leer.
> *   `size`: Das `fileInfo.size`-Feld, das im vorherigen Schritt zurückgegeben wurde.
> *   `url`: Standardmäßig leer.
> *   `mimetype`: Das `fileInfo.mimetype`-Feld, das im vorherigen Schritt zurückgegeben wurde.
> *   `meta`: Das `fileInfo.meta`-Feld, das im vorherigen Schritt zurückgegeben wurde.
> *   `storageId`: Das `id`-Feld, das in Schritt 1 zurückgegeben wurde.
>
> Beispiel-Anfragedaten:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```