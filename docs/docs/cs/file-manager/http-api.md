:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# HTTP API

Nahrávání souborů pro pole příloh i pro **kolekce** souborů je podporováno prostřednictvím HTTP API. Způsob volání se liší v závislosti na úložném enginu, který pole příloh nebo **kolekce** souborů používá.

## Nahrávání na straně serveru

Pro vestavěné open-source úložné enginy v projektu, jako jsou S3, OSS a COS, je volání HTTP API stejné jako funkce nahrávání v uživatelském rozhraní a soubory se nahrávají prostřednictvím serveru. Volání API vyžaduje předání JWT tokenu založeného na přihlášení uživatele v hlavičce požadavku `Authorization`; v opačném případě bude přístup zamítnut.

### Pole příloh

Spusťte akci `create` na zdroji `attachments` (`attachments`), odešlete POST požadavek a nahrajte binární obsah prostřednictvím pole `file`. Po volání bude soubor nahrán do výchozího úložného enginu.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Chcete-li nahrát soubor do jiného úložného enginu, můžete použít parametr `attachmentField` k určení úložného enginu nakonfigurovaného pro pole dané **kolekce** (pokud není nakonfigurován, bude nahrán do výchozího úložného enginu).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Kolekce souborů

Nahrávání do **kolekce** souborů automaticky vygeneruje záznam souboru. Spusťte akci `create` na zdroji **kolekce** souborů, odešlete POST požadavek a nahrajte binární obsah prostřednictvím pole `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Při nahrávání do **kolekce** souborů není třeba specifikovat úložný engine; soubor bude nahrán do úložného enginu nakonfigurovaného pro tuto **kolekci**.

## Nahrávání na straně klienta

Pro S3-kompatibilní úložné enginy poskytované prostřednictvím komerčního **pluginu** S3-Pro je třeba volání HTTP API rozdělit do několika kroků.

### Pole příloh

1.  Získání informací o úložném enginu

    Spusťte akci `getBasicInfo` na **kolekci** `storages` (`storages`), přičemž předejte název úložiště (`storage name`), abyste si vyžádali konfigurační informace úložného enginu.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Příklad vrácených konfiguračních informací úložného enginu:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Získání předpodepsaných informací od poskytovatele služby

    Spusťte akci `createPresignedUrl` na zdroji `fileStorageS3`, odešlete POST požadavek a do těla (`body`) zahrňte informace související se souborem, abyste získali předpodepsané informace pro nahrávání.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Poznámka:
    >
    > * `name`: Název souboru
    > * `size`: Velikost souboru (v bajtech)
    > * `type`: MIME typ souboru. Můžete se podívat na: [Běžné MIME typy](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * `storageId`: ID úložného enginu (pole `id` vrácené v prvním kroku)
    > * `storageType`: Typ úložného enginu (pole `type` vrácené v prvním kroku)
    >
    > Příklad dat požadavku:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Struktura dat získaných předpodepsaných informací je následující:

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

3.  Nahrávání souboru

    Použijte vrácené `putUrl` k zahájení `PUT` požadavku a nahrajte soubor jako tělo (`body`).

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Poznámka:
    > * `putUrl`: Pole `putUrl` vrácené v předchozím kroku
    > * `file_path`: Lokální cesta k souboru, který má být nahrán
    >
    > Příklad dat požadavku:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Vytvoření záznamu souboru

    Po úspěšném nahrání spusťte akci `create` na zdroji `attachments` (`attachments`) odesláním POST požadavku, abyste vytvořili záznam souboru.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Popis závislých dat v `data-raw`:
    > * `title`: Pole `fileInfo.title` vrácené v předchozím kroku
    > * `filename`: Pole `fileInfo.key` vrácené v předchozím kroku
    > * `extname`: Pole `fileInfo.extname` vrácené v předchozím kroku
    > * `path`: Ve výchozím nastavení prázdné
    > * `size`: Pole `fileInfo.size` vrácené v předchozím kroku
    > * `url`: Ve výchozím nastavení prázdné
    > * `mimetype`: Pole `fileInfo.mimetype` vrácené v předchozím kroku
    > * `meta`: Pole `fileInfo.meta` vrácené v předchozím kroku
    > * `storageId`: Pole `id` vrácené v prvním kroku
    >
    > Příklad dat požadavku:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Kolekce souborů

První tři kroky jsou stejné jako pro nahrávání do pole příloh, ale ve čtvrtém kroku je třeba vytvořit záznam souboru. To provedete spuštěním akce `create` na zdroji **kolekce** souborů, odesláním POST požadavku a nahráním informací o souboru prostřednictvím těla (`body`).

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Popis závislých dat v `data-raw`:
> * `title`: Pole `fileInfo.title` vrácené v předchozím kroku
> * `filename`: Pole `fileInfo.key` vrácené v předchozím kroku
> * `extname`: Pole `fileInfo.extname` vrácené v předchozím kroku
> * `path`: Ve výchozím nastavení prázdné
> * `size`: Pole `fileInfo.size` vrácené v předchozím kroku
> * `url`: Ve výchozím nastavení prázdné
> * `mimetype`: Pole `fileInfo.mimetype` vrácené v předchozím kroku
> * `meta`: Pole `fileInfo.meta` vrácené v předchozím kroku
> * `storageId`: Pole `id` vrácené v prvním kroku
>
> Příklad dat požadavku:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```