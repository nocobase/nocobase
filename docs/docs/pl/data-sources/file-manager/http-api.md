:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# HTTP API

Przesyłanie plików zarówno dla pól załączników, jak i dla kolekcji plików, może być obsługiwane za pośrednictwem HTTP API. Sposób wywołania różni się w zależności od silnika przechowywania danych używanego przez załącznik lub kolekcję plików.

## Przesyłanie po stronie serwera

W przypadku wbudowanych otwartych silników przechowywania danych, takich jak S3, OSS i COS, wywołanie HTTP API jest takie samo jak to używane przez funkcję przesyłania w interfejsie użytkownika, gdzie pliki są przesyłane przez serwer. Wywołania API wymagają przekazania tokenu JWT opartego na logowaniu użytkownika w nagłówku żądania `Authorization`; w przeciwnym razie dostęp zostanie odrzucony.

### Pole załącznika

Proszę zainicjować akcję `create` na zasobie `attachments` (tabela `attachments`), wysyłając żądanie POST i przesyłając zawartość binarną za pośrednictwem pola `file`. Po wywołaniu plik zostanie przesłany do domyślnego silnika przechowywania danych.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Aby przesłać pliki do innego silnika przechowywania danych, mogą Państwo użyć parametru `attachmentField` w celu określenia silnika przechowywania danych skonfigurowanego dla pola kolekcji. Jeśli nie jest skonfigurowany, plik zostanie przesłany do domyślnego silnika przechowywania danych.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Kolekcja plików

Przesyłanie do kolekcji plików automatycznie wygeneruje rekord pliku. Proszę zainicjować akcję `create` na zasobie kolekcji plików, wysyłając żądanie POST i przesyłając zawartość binarną za pośrednictwem pola `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Podczas przesyłania do kolekcji plików nie ma potrzeby określania silnika przechowywania danych; plik zostanie przesłany do silnika przechowywania danych skonfigurowanego dla tej kolekcji.

## Przesyłanie po stronie klienta

W przypadku silników przechowywania danych kompatybilnych z S3, dostarczanych za pośrednictwem komercyjnej wtyczki S3-Pro, przesyłanie za pomocą HTTP API wymaga kilku kroków.

### Pole załącznika

1.  Pobieranie informacji o silniku przechowywania danych

    Proszę zainicjować akcję `getBasicInfo` na kolekcji `storages`, uwzględniając nazwę przechowywania danych, aby zażądać informacji konfiguracyjnych silnika przechowywania danych.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Przykład zwróconych informacji konfiguracyjnych silnika przechowywania danych:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Pobieranie wstępnie podpisanego adresu URL od dostawcy usługi

    Proszę zainicjować akcję `createPresignedUrl` na zasobie `fileStorageS3`, wysyłając żądanie POST z informacjami związanymi z plikiem w treści żądania, aby uzyskać informacje o wstępnie podpisanym przesyłaniu.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Uwaga:
    >
    > *   `name`: Nazwa pliku
    > *   `size`: Rozmiar pliku (w bajtach)
    > *   `type`: Typ MIME pliku. Mogą Państwo zapoznać się z: [Typowe typy MIME](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: ID silnika przechowywania danych (pole `id` zwrócone w kroku 1).
    > *   `storageType`: Typ silnika przechowywania danych (pole `type` zwrócone w kroku 1).
    >
    > Przykładowe dane żądania:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Struktura danych uzyskanych informacji o wstępnie podpisanym adresie URL jest następująca:

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

3.  Przesyłanie pliku

    Proszę użyć zwróconego `putUrl` do wykonania żądania `PUT`, przesyłając plik jako treść żądania.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```

    > Uwaga:
    >
    > *   `putUrl`: Pole `putUrl` zwrócone w poprzednim kroku.
    > *   `file_path`: Lokalna ścieżka pliku do przesłania.
    >
    > Przykładowe dane żądania:
    >
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Tworzenie rekordu pliku

    Po pomyślnym przesłaniu, proszę utworzyć rekord pliku, inicjując akcję `create` na zasobie `attachments` (tabela `attachments`) za pomocą żądania POST.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Wyjaśnienie danych zależnych w `data-raw`:
    >
    > *   `title`: Pole `fileInfo.title` zwrócone w poprzednim kroku.
    > *   `filename`: Pole `fileInfo.key` zwrócone w poprzednim kroku.
    > *   `extname`: Pole `fileInfo.extname` zwrócone w poprzednim kroku.
    > *   `path`: Domyślnie puste.
    > *   `size`: Pole `fileInfo.size` zwrócone w poprzednim kroku.
    > *   `url`: Domyślnie puste.
    > *   `mimetype`: Pole `fileInfo.mimetype` zwrócone w poprzednim kroku.
    > *   `meta`: Pole `fileInfo.meta` zwrócone w poprzednim kroku.
    > *   `storageId`: Pole `id` zwrócone w kroku 1.
    >
    > Przykładowe dane żądania:
    >
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Kolekcja plików

Pierwsze trzy kroki są takie same jak w przypadku przesyłania do pola załącznika. Jednak w czwartym kroku muszą Państwo utworzyć rekord pliku, inicjując akcję `create` na zasobie kolekcji plików za pomocą żądania POST i przesyłając informacje o pliku w treści żądania.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Wyjaśnienie danych zależnych w `data-raw`:
>
> *   `title`: Pole `fileInfo.title` zwrócone w poprzednim kroku.
> *   `filename`: Pole `fileInfo.key` zwrócone w poprzednim kroku.
> *   `extname`: Pole `fileInfo.extname` zwrócone w poprzednim kroku.
> *   `path`: Domyślnie puste.
> *   `size`: Pole `fileInfo.size` zwrócone w poprzednim kroku.
> *   `url`: Domyślnie puste.
> *   `mimetype`: Pole `fileInfo.mimetype` zwrócone w poprzednim kroku.
> *   `meta`: Pole `fileInfo.meta` zwrócone w poprzednim kroku.
> *   `storageId`: Pole `id` zwrócone w kroku 1.
>
> Przykładowe dane żądania:
>
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```