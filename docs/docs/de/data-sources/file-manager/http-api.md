---
title: "Dateimanager HTTP API"
description: "Dateien über HTTP API mittels Anhangsfeldern und Dateitabellen hochladen, serverseitiger Upload (S3/OSS/COS), direkter Client-Upload, mit JWT-Authentifizierung und Angabe der Speicher-Engine."
keywords: "Datei-Upload HTTP API,attachments create,serverseitiger Upload,direkter Client-Upload,NocoBase"
---

# HTTP API

Datei-Uploads für Anhangsfelder und Dateitabellen können über die HTTP API verarbeitet werden. Je nach Speicher-Engine, die vom Anhang oder der Dateitabelle verwendet wird, gibt es unterschiedliche Aufrufmethoden.

## Serverseitiger Upload

Für integrierte Open-Source-Speicher-Engines wie S3, OSS und COS wird für die HTTP API dieselbe Upload-Funktion wie in der Benutzeroberfläche verwendet; alle Dateien werden über den Server hochgeladen. Beim Aufruf der Schnittstelle muss ein JWT-Token basierend auf der Benutzeranmeldung über den Anfrage-Header `Authorization` übergeben werden, andernfalls wird der Zugriff verweigert.

### Anhangsfeld

Führen Sie für die Anhangstabelle (`attachments`) die Operation `create` aus, senden Sie die Anfrage als POST und laden Sie den Binärinhalt über das Feld `file` hoch. Nach dem Aufruf wird die Datei in die Standard-Speicher-Engine hochgeladen.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Wenn Sie die Datei in eine andere Speicher-Engine hochladen möchten, können Sie mit dem Parameter `attachmentField` die Speicher-Engine angeben, die für das Datenbankfeld konfiguriert ist (falls keine konfiguriert wurde, erfolgt der Upload in die Standard-Speicher-Engine).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Dateitabelle

Beim Upload in eine Dateitabelle wird automatisch ein Dateidatensatz erstellt. Führen Sie für die Ressource der Dateitabelle die Operation `create` aus, senden Sie die Anfrage als POST und laden Sie den Binärinhalt über das Feld `file` hoch.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Für Uploads in eine Dateitabelle muss keine Speicher-Engine angegeben werden; die Datei wird in die für diese Tabelle konfigurierte Speicher-Engine hochgeladen.

## Clientseitiger Upload

Für S3-kompatible Speicher-Engines, die über das kommerzielle Plugin S3-Pro bereitgestellt werden, muss der Upload über die HTTP API in mehreren Schritten erfolgen.

### Anhangsfeld

1.  Informationen zur Speicher-Engine abrufen

    Führen Sie für die Speichertabelle (`storages`) die Operation `getBasicInfo` aus und übergeben Sie zugleich die Speicherkennung (storage name), um die Konfigurationsinformationen der Speicher-Engine anzufordern.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Beispiel für die zurückgegebenen Konfigurationsinformationen der Speicher-Engine:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Vorab signierte Informationen des Anbieters abrufen

    Führen Sie für die Ressource `fileStorageS3` die Operation `createPresignedUrl` aus, senden Sie die Anfrage als POST und übergeben Sie die dateibezogenen Informationen im Body, um Informationen für den vorab signierten Upload abzurufen.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Hinweise:
    >
    > * name: Dateiname
    > * size: Dateigröße (in Bytes)
    > * type: MIME-Typ der Datei, siehe: [Gängige MIME-Typen](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: ID der Speicher-Engine (das im ersten Schritt zurückgegebene Feld `id`)
    > * storageType: Typ der Speicher-Engine (das im ersten Schritt zurückgegebene Feld `type`)
    >
    > Beispiel-Anfragedaten:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Die Datenstruktur der erhaltenen vorab signierten Informationen lautet wie folgt:

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

    Verwenden Sie die zurückgegebene `putUrl`, um eine `PUT`-Anfrage zu senden und die Datei als Body hochzuladen.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Hinweise:
    > * putUrl: Das im vorherigen Schritt zurückgegebene Feld `putUrl`
    > * file_path: Lokaler Pfad der hochzuladenden Datei
    >
    > Beispiel-Anfragedaten:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Dateidatensatz erstellen

    Nach erfolgreichem Upload führen Sie für die Anhangstabelle (`attachments`) die Operation `create` aus, senden Sie die Anfrage als POST und erstellen Sie den Dateidatensatz.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Erläuterung der abhängigen Daten in data-raw:
    > * title: Das im vorherigen Schritt zurückgegebene Feld `fileInfo.title`
    > * filename: Das im vorherigen Schritt zurückgegebene Feld `fileInfo.key`
    > * extname: Das im vorherigen Schritt zurückgegebene Feld `fileInfo.extname`
    > * path: Standardmäßig leer
    > * size: Das im vorherigen Schritt zurückgegebene Feld `fileInfo.size`
    > * url: Standardmäßig leer
    > * mimetype: Das im vorherigen Schritt zurückgegebene Feld `fileInfo.mimetype`
    > * meta: Das im vorherigen Schritt zurückgegebene Feld `fileInfo.meta`
    > * storageId: Das im ersten Schritt zurückgegebene Feld `id`
    >
    > Beispiel-Anfragedaten:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Dateitabelle

Die ersten drei Schritte entsprechen dem Upload für Anhangsfelder. Im vierten Schritt muss jedoch ein Dateidatensatz erstellt werden: Führen Sie für die Ressource der Dateitabelle die Operation create aus, senden Sie die Anfrage als POST und übergeben Sie die Dateiinformationen im Body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Erläuterung der abhängigen Daten in data-raw:
> * title: Das im vorherigen Schritt zurückgegebene Feld `fileInfo.title`
> * filename: Das im vorherigen Schritt zurückgegebene Feld `fileInfo.key`
> * extname: Das im vorherigen Schritt zurückgegebene Feld `fileInfo.extname`
> * path: Standardmäßig leer
> * size: Das im vorherigen Schritt zurückgegebene Feld `fileInfo.size`
> * url: Standardmäßig leer
> * mimetype: Das im vorherigen Schritt zurückgegebene Feld `fileInfo.mimetype`
> * meta: Das im vorherigen Schritt zurückgegebene Feld `fileInfo.meta`
> * storageId: Das im ersten Schritt zurückgegebene Feld `id`
>
> Beispiel-Anfragedaten:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```