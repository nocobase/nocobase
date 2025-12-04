:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# HTTP API

Nahrávání souborů pro pole příloh i pro kolekce souborů lze zpracovat pomocí HTTP API. Způsob volání se liší v závislosti na úložném enginu, který příloha nebo kolekce souborů používá.

## Nahrávání na straně serveru

Pro vestavěné open-source úložné enginy, jako jsou S3, OSS a COS, je volání HTTP API stejné jako funkce nahrávání v uživatelském rozhraní, přičemž soubory jsou nahrávány prostřednictvím serveru. Volání API vyžadují předání JWT tokenu založeného na přihlášení uživatele v hlavičce požadavku `Authorization`; v opačném případě bude přístup zamítnut.

### Pole příloh

Spusťte akci `create` na zdroji příloh (`attachments`) odesláním požadavku POST a nahrajte binární obsah prostřednictvím pole `file`. Po volání bude soubor nahrán do výchozího úložného enginu.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Chcete-li nahrát soubory do jiného úložného enginu, můžete použít parametr `attachmentField` k určení úložného enginu nakonfigurovaného pro pole kolekce. Pokud není nakonfigurován, soubor bude nahrán do výchozího úložného enginu.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Kolekce souborů

Nahrávání do kolekce souborů automaticky vygeneruje záznam souboru. Spusťte akci `create` na zdroji kolekce souborů odesláním požadavku POST a nahrajte binární obsah prostřednictvím pole `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Při nahrávání do kolekce souborů není třeba specifikovat úložný engine; soubor bude nahrán do úložného enginu nakonfigurovaného pro danou kolekci.

## Nahrávání na straně klienta

Pro úložné enginy kompatibilní se S3, poskytované prostřednictvím komerčního pluginu S3-Pro, vyžaduje nahrávání přes HTTP API několik kroků.

### Pole příloh

1.  Získání informací o úložném enginu

    Spusťte akci `getBasicInfo` na kolekci úložišť (`storages`), včetně názvu úložiště, abyste si vyžádali konfigurační informace úložného enginu.

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

2.  Získání předpodepsané URL od poskytovatele služby

    Spusťte akci `createPresignedUrl` na zdroji `fileStorageS3` odesláním požadavku POST s informacemi souvisejícími se souborem v těle požadavku, abyste získali předpodepsané informace pro nahrávání.

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
    > *   `name`: Název souboru
    > *   `size`: Velikost souboru (v bajtech)
    > *   `type`: MIME typ souboru. Můžete se podívat na [Běžné MIME typy](https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: ID úložného enginu (pole `id` vrácené v kroku 1).
    > *   `storageType`: Typ úložného enginu (pole `type` vrácené v kroku 1).
    >
    > Příklad dat požadavku:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Datová struktura získaných předpodepsaných informací je následující:

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

3.  Nahrání souboru

    Použijte vrácenou `putUrl` k odeslání požadavku `PUT` a nahrajte soubor jako tělo požadavku.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Poznámka:
    > *   `putUrl`: Pole `putUrl` vrácené v předchozím kroku.
    > *   `file_path`: Lokální cesta k souboru, který má být nahrán.
    >
    > Příklad dat požadavku:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Vytvoření záznamu souboru

    Po úspěšném nahrání vytvořte záznam souboru spuštěním akce `create` na zdroji příloh (`attachments`) pomocí požadavku POST.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Vysvětlení závislých dat v `data-raw`:
    > *   `title`: Pole `fileInfo.title` vrácené v předchozím kroku.
    > *   `filename`: Pole `fileInfo.key` vrácené v předchozím kroku.
    > *   `extname`: Pole `fileInfo.extname` vrácené v předchozím kroku.
    > *   `path`: Ve výchozím nastavení prázdné.
    > *   `size`: Pole `fileInfo.size` vrácené v předchozím kroku.
    > *   `url`: Ve výchozím nastavení prázdné.
    > *   `mimetype`: Pole `fileInfo.mimetype` vrácené v předchozím kroku.
    > *   `meta`: Pole `fileInfo.meta` vrácené v předchozím kroku.
    > *   `storageId`: Pole `id` vrácené v kroku 1.
    >
    > Příklad dat požadavku:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Kolekce souborů

První tři kroky jsou stejné jako pro nahrávání do pole příloh. Ve čtvrtém kroku však musíte vytvořit záznam souboru spuštěním akce `create` na zdroji kolekce souborů pomocí požadavku POST a nahráním informací o souboru v těle požadavku.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Vysvětlení závislých dat v `data-raw`:
> *   `title`: Pole `fileInfo.title` vrácené v předchozím kroku.
> *   `filename`: Pole `fileInfo.key` vrácené v předchozím kroku.
> *   `extname`: Pole `fileInfo.extname` vrácené v předchozím kroku.
> *   `path`: Ve výchozím nastavení prázdné.
> *   `size`: Pole `fileInfo.size` vrácené v předchozím kroku.
> *   `url`: Ve výchozím nastavení prázdné.
> *   `mimetype`: Pole `fileInfo.mimetype` vrácené v předchozím kroku.
> *   `meta`: Pole `fileInfo.meta` vrácené v předchozím kroku.
> *   `storageId`: Pole `id` vrácené v kroku 1.
>
> Příklad dat požadavku:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```