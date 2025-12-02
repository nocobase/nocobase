:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# API HTTP

I caricamenti di file sia per i campi allegato che per le collezioni di file possono essere gestiti tramite l'API HTTP. Il metodo di invocazione varia a seconda del motore di archiviazione utilizzato dal campo allegato o dalla collezione di file.

## Caricamento lato server

Per i motori di archiviazione open-source integrati come S3, OSS e COS, la chiamata API HTTP è la stessa utilizzata dalla funzionalità di caricamento dell'interfaccia utente, dove i file vengono caricati tramite il server. Le chiamate API richiedono il passaggio di un token JWT basato sull'utente nell'header di richiesta `Authorization`; in caso contrario, l'accesso verrà negato.

### Campo allegato

Avvii un'operazione `create` sulla risorsa degli allegati (`attachments`) inviando una richiesta POST e carichi il contenuto binario tramite il campo `file`. Dopo la chiamata, il file verrà caricato nel motore di archiviazione predefinito.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Se desidera caricare i file su un motore di archiviazione diverso, può utilizzare il parametro `attachmentField` per specificare il motore di archiviazione configurato per il campo della collezione. Se non configurato, il file verrà caricato nel motore di archiviazione predefinito.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Collezione di file

Il caricamento in una collezione di file genererà automaticamente un record di file. Avvii un'operazione `create` sulla risorsa della collezione di file inviando una richiesta POST e carichi il contenuto binario tramite il campo `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Quando carica in una collezione di file, non è necessario specificare un motore di archiviazione; il file verrà caricato nel motore di archiviazione configurato per quella collezione.

## Caricamento lato client

Per i motori di archiviazione compatibili con S3 forniti tramite il plugin commerciale S3-Pro, il caricamento tramite API HTTP richiede diversi passaggi.

### Campo allegato

1.  Ottenere le informazioni sul motore di archiviazione

    Avvii un'operazione `getBasicInfo` sulla collezione `storages`, includendo il nome dello spazio di archiviazione (`storage name`), per richiedere le informazioni di configurazione del motore di archiviazione.

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

2.  Ottenere l'URL pre-firmato dal fornitore di servizi

    Avvii un'operazione `createPresignedUrl` sulla risorsa `fileStorageS3` inviando una richiesta POST con le informazioni relative al file nel corpo della richiesta per ottenere le informazioni di caricamento pre-firmate.

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
    > *   `name`: Nome del file
    > *   `size`: Dimensione del file (in byte)
    > *   `type`: Il tipo MIME del file. Può fare riferimento a: [Tipi MIME comuni](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: L'ID del motore di archiviazione (il campo `id` restituito nel passaggio 1).
    > *   `storageType`: Il tipo del motore di archiviazione (il campo `type` restituito nel passaggio 1).
    >
    > Dati di richiesta di esempio:
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

    Utilizzi il `putUrl` restituito per effettuare una richiesta `PUT`, caricando il file come corpo della richiesta.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```

    > Nota:
    >
    > *   `putUrl`: Il campo `putUrl` restituito nel passaggio precedente.
    > *   `file_path`: Il percorso locale del file da caricare.
    >
    > Dati di richiesta di esempio:
    >
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Creare il record del file

    Dopo un caricamento riuscito, crei il record del file avviando un'operazione `create` sulla risorsa degli allegati (`attachments`) con una richiesta POST.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Spiegazione dei dati dipendenti in `data-raw`:
    >
    > *   `title`: Il campo `fileInfo.title` restituito nel passaggio precedente.
    > *   `filename`: Il campo `fileInfo.key` restituito nel passaggio precedente.
    > *   `extname`: Il campo `fileInfo.extname` restituito nel passaggio precedente.
    > *   `path`: Vuoto per impostazione predefinita.
    > *   `size`: Il campo `fileInfo.size` restituito nel passaggio precedente.
    > *   `url`: Vuoto per impostazione predefinita.
    > *   `mimetype`: Il campo `fileInfo.mimetype` restituito nel passaggio precedente.
    > *   `meta`: Il campo `fileInfo.meta` restituito nel passaggio precedente.
    > *   `storageId`: Il campo `id` restituito nel passaggio 1.
    >
    > Dati di richiesta di esempio:
    >
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Collezione di file

I primi tre passaggi sono gli stessi del caricamento in un campo allegato. Tuttavia, nel quarto passaggio, è necessario creare il record del file avviando un'operazione `create` sulla risorsa della collezione di file con una richiesta POST, caricando le informazioni del file nel corpo della richiesta.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Spiegazione dei dati dipendenti in `data-raw`:
>
> *   `title`: Il campo `fileInfo.title` restituito nel passaggio precedente.
> *   `filename`: Il campo `fileInfo.key` restituito nel passaggio precedente.
> *   `extname`: Il campo `fileInfo.extname` restituito nel passaggio precedente.
> *   `path`: Vuoto per impostazione predefinita.
> *   `size`: Il campo `fileInfo.size` restituito nel passaggio precedente.
> *   `url`: Vuoto per impostazione predefinita.
> *   `mimetype`: Il campo `fileInfo.mimetype` restituito nel passaggio precedente.
> *   `meta`: Il campo `fileInfo.meta` restituito nel passaggio precedente.
> *   `storageId`: Il campo `id` restituito nel passaggio 1.
>
> Dati di richiesta di esempio:
>
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```