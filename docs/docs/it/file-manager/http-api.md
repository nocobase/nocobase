:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# API HTTP

Il caricamento di file, sia per i campi di allegato che per le collezioni di file, è supportato tramite l'API HTTP. Le modalità di richiamo variano a seconda del motore di archiviazione utilizzato dal campo di allegato o dalla collezione di file.

## Caricamento lato server

Per i motori di archiviazione open-source integrati nel progetto, come S3, OSS e COS, la chiamata API HTTP è identica alla funzione di caricamento dell'interfaccia utente, e i file vengono caricati tramite il server. Per richiamare l'API, è necessario passare un token JWT basato sull'accesso dell'utente tramite l'header di richiesta `Authorization`; in caso contrario, l'accesso verrà negato.

### Campo di Allegato

Avvii un'operazione `create` sulla risorsa `attachments` (la collezione degli allegati), invii una richiesta POST e carichi il contenuto binario tramite il campo `file`. Dopo la chiamata, il file verrà caricato nel motore di archiviazione predefinito.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Per caricare un file su un motore di archiviazione diverso, può utilizzare il parametro `attachmentField` per specificare il motore di archiviazione configurato per il campo della collezione (se non configurato, verrà caricato nel motore di archiviazione predefinito).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Collezione di File

Il caricamento su una collezione di file genererà automaticamente un record del file. Avvii un'operazione `create` sulla risorsa della collezione di file, invii una richiesta POST e carichi il contenuto binario tramite il campo `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Quando carica su una collezione di file, non è necessario specificare un motore di archiviazione; il file verrà caricato nel motore di archiviazione configurato per quella collezione.

## Caricamento lato client

Per i motori di archiviazione compatibili con S3 forniti tramite il plugin commerciale S3-Pro, il caricamento tramite API HTTP richiede diversi passaggi.

### Campo di Allegato

1.  Ottenere le informazioni sul motore di archiviazione

    Avvii un'operazione `getBasicInfo` sulla collezione `storages` (le archiviazioni), includendo il nome dello spazio di archiviazione (`storage name`), per richiedere le informazioni di configurazione del motore di archiviazione.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Esempio di informazioni di configurazione del motore di archiviazione restituite:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Ottenere le informazioni pre-firmate dal fornitore di servizi

    Avvii un'operazione `createPresignedUrl` sulla risorsa `fileStorageS3`, invii una richiesta POST e includa le informazioni relative al file nel corpo della richiesta per ottenere le informazioni di caricamento pre-firmate.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Nota:
    >
    > * name: Nome del file
    > * size: Dimensione del file (in byte)
    > * type: Tipo MIME del file. Può consultare: [Tipi MIME comuni](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: L'ID del motore di archiviazione (il campo `id` restituito nel primo passaggio)
    > * storageType: Il tipo del motore di archiviazione (il campo `type` restituito nel primo passaggio)
    >
    > Esempio di dati della richiesta:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    La struttura dei dati delle informazioni pre-firmate ottenute è la seguente:

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

3.  Caricamento del file

    Utilizzi la `putUrl` restituita per avviare una richiesta `PUT` e caricare il file come corpo della richiesta.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Nota:
    > * putUrl: Il campo `putUrl` restituito nel passaggio precedente
    > * file_path: Il percorso locale del file da caricare
    >
    > Esempio di dati della richiesta:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Creare un record del file

    Dopo un caricamento riuscito, avvii un'operazione `create` sulla risorsa `attachments` (la collezione degli allegati), inviando una richiesta POST per creare il record del file.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Descrizione dei dati dipendenti in data-raw:
    > * title: Il campo `fileInfo.title` restituito nel passaggio precedente
    > * filename: Il campo `fileInfo.key` restituito nel passaggio precedente
    > * extname: Il campo `fileInfo.extname` restituito nel passaggio precedente
    > * path: Vuoto per impostazione predefinita
    > * size: Il campo `fileInfo.size` restituito nel passaggio precedente
    > * url: Vuoto per impostazione predefinita
    > * mimetype: Il campo `fileInfo.mimetype` restituito nel passaggio precedente
    > * meta: Il campo `fileInfo.meta` restituito nel passaggio precedente
    > * storageId: Il campo `id` restituito nel primo passaggio
    >
    > Esempio di dati della richiesta:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Collezione di File

I primi tre passaggi sono gli stessi del caricamento per i campi di allegato, ma nel quarto passaggio è necessario creare un record del file avviando un'operazione `create` sulla risorsa della collezione di file, inviando una richiesta POST e caricando le informazioni del file tramite il corpo della richiesta.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Descrizione dei dati dipendenti in data-raw:
> * title: Il campo `fileInfo.title` restituito nel passaggio precedente
> * filename: Il campo `fileInfo.key` restituito nel passaggio precedente
> * extname: Il campo `fileInfo.extname` restituito nel passaggio precedente
> * path: Vuoto per impostazione predefinita
> * size: Il campo `fileInfo.size` restituito nel passaggio precedente
> * url: Vuoto per impostazione predefinita
> * mimetype: Il campo `fileInfo.mimetype` restituito nel passaggio precedente
> * meta: Il campo `fileInfo.meta` restituito nel passaggio precedente
> * storageId: Il campo `id` restituito nel primo passaggio
>
> Esempio di dati della richiesta:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```