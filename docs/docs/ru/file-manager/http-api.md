# Интерфейс HTTP API

Загрузка файлов как для полей вложений, так и для коллекций файлов поддерживается через HTTP API. Способ вызова отличается в зависимости от движка хранения, используемого полем вложения или коллекцией файлов.

## Серверная загрузка

Для встроенных open-source движков хранения в проекте, таких как S3, OSS и COS, вызов HTTP API аналогичен загрузке через пользовательский интерфейс — файлы загружаются через сервер. Для вызова API требуется передать JWT-токен (основанный на входе пользователя) через заголовок запроса `Authorization`, иначе доступ будет запрещён.

### Поле вложения

Инициируйте действие `create` ресурса вложений (`attachments`), отправьте POST-запрос и загрузите бинарное содержимое через поле `file`. После вызова файл будет загружен в движок хранения по умолчанию.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Чтобы загрузить файл в другой движок хранения, используйте параметр `attachmentField`, чтобы указать движок хранения, настроенный для поля коллекции (если не настроено — файл будет загружен в движок по умолчанию).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Коллекция файлов

При загрузке в коллекцию файлов автоматически создаётся запись о файле. Инициируйте действие `create` ресурса коллекции файлов, отправьте POST-запрос и загрузите бинарное содержимое через поле `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

При загрузке в коллекцию файлов указывать движок хранения не требуется — файл будет загружен в движок хранения, настроенный для этой коллекции.

## Клиентская загрузка

Для S3-совместимых движков хранения, предоставляемых коммерческим плагином S3-Pro, загрузка через HTTP API выполняется в несколько шагов.

### Поле вложения

1.  Получить информацию о движке хранения

    Инициируйте действие `getBasicInfo` коллекции хранилищ (`storages`), передав имя хранилища, чтобы запросить конфигурацию движка хранения.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Пример возвращаемой конфигурации движка хранения:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Получить предварительно подписанные данные у провайдера

    Инициируйте действие `createPresignedUrl` ресурса `fileStorageS3`, отправьте POST-запрос и передайте в body информацию о файле, чтобы получить предварительно подписанные данные для загрузки.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Примечание:
    > 
    > * name: имя файла
    > * size: размер файла (в байтах)
    > * type: MIME-тип файла. Можно использовать справочник: [Распространённые MIME-типы](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: идентификатор движка хранения (поле `id`, возвращённое на первом шаге)
    > * storageType: тип движка хранения (поле `type`, возвращённое на первом шаге)
    > 
    > Пример данных запроса:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Структура полученных presigned-данных:

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

3.  Загрузить файл

    Используйте возвращённый `putUrl`, чтобы отправить `PUT`-запрос и передать файл в body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Примечание:
    > * putUrl: поле `putUrl`, возвращённое на предыдущем шаге
    > * file_path: локальный путь к загружаемому файлу
    > 
    > Пример данных запроса:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Создать запись о файле

    После успешной загрузки инициируйте действие `create` ресурса вложений (`attachments`) — отправьте POST-запрос, чтобы создать запись о файле.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Описание зависимых данных в `data-raw`:
    > * title: поле `fileInfo.title`, возвращённое на предыдущем шаге
    > * filename: поле `fileInfo.key`, возвращённое на предыдущем шаге
    > * extname: поле `fileInfo.extname`, возвращённое на предыдущем шаге
    > * path: по умолчанию пустое
    > * size: поле `fileInfo.size`, возвращённое на предыдущем шаге
    > * url: по умолчанию пустое
    > * mimetype: поле `fileInfo.mimetype`, возвращённое на предыдущем шаге
    > * meta: поле `fileInfo.meta`, возвращённое на предыдущем шаге
    > * storageId: поле `id`, возвращённое на первом шаге
    > 
    > Пример данных запроса:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Коллекция файлов

Первые три шага такие же, как при загрузке в поле вложения. На четвёртом шаге нужно создать запись о файле, инициировав действие create ресурса коллекции файлов: отправьте POST-запрос и передайте информацию о файле в body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Описание зависимых данных в `data-raw`:
> * title: поле `fileInfo.title`, возвращённое на предыдущем шаге
> * filename: поле `fileInfo.key`, возвращённое на предыдущем шаге
> * extname: поле `fileInfo.extname`, возвращённое на предыдущем шаге
> * path: по умолчанию пустое
> * size: поле `fileInfo.size`, возвращённое на предыдущем шаге
> * url: по умолчанию пустое
> * mimetype: поле `fileInfo.mimetype`, возвращённое на предыдущем шаге
> * meta: поле `fileInfo.meta`, возвращённое на предыдущем шаге
> * storageId: поле `id`, возвращённое на первом шаге
> 
> Пример данных запроса:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```