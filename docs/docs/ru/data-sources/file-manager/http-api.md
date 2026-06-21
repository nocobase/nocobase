# HTTP API

Загрузка файлов для полей вложений и для коллекций файлов может выполняться через HTTP API. Способ вызова отличается в зависимости от движка хранения, который используется для поля вложений или коллекции файлов.

## Серверная загрузка

Для встроенных открытых движков хранения вроде S3, OSS и COS вызов HTTP API такой же, как и в функции загрузки через пользовательский интерфейс: файлы загружаются через сервер. Вызовы API требуют передавать пользовательский JWT-токен в заголовке запроса `Authorization`; в противном случае доступ будет отклонен.

### Поле вложений

Инициируйте действие `create` для ресурса вложений (`attachments`), отправив запрос POST, и загрузите двоичное содержимое через поле `file`. После вызова файл будет загружен в движок хранения по умолчанию.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Чтобы загружать файлы в другой движок хранения, используйте параметр `attachmentField`: он указывает движок хранения, настроенный для поля коллекции. Если этот параметр не настроен, файл будет загружен в движок хранения по умолчанию.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Коллекция файлов

Загрузка в коллекцию файлов автоматически создаст запись файла. Инициируйте действие `create` для ресурса коллекции файлов: отправьте POST-запрос и загрузите двоичное содержимое через поле `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

При загрузке в коллекцию файлов не требуется указывать движок хранения: файл будет загружен в движок хранения, настроенный для этой коллекции.

## Клиентская загрузка

Для движков хранения, совместимых с S3, которые предоставляются коммерческим плагином S3 Pro, загрузка через HTTP API требует нескольких шагов.

### Поле вложения

1.  Получите информацию о движке хранения

    Запустите действие `getBasicInfo` для коллекции хранилища (`storages`), передав имя хранилища, чтобы запросить информацию о конфигурации движка хранения.

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

2.  Получите предварительно подписанный URL у поставщика сервиса

    Запустите действие `createPresignedUrl` для ресурса `fileStorageS3`, отправив POST-запрос с информацией о файле в теле, чтобы получить данные presigned загрузки.

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
    > *   `name`: Имя файла
    > *   `size`: Размер файла (в байтах)
    > *   `type`: MIME-тип файла. См. [MIME типы](https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: ID движка хранения (поле `id`, возвращаемое на шаге 1).
    > *   `storageType`: Тип движка хранения (поле `type`, возвращаемое на шаге 1).
    >
    > Пример данных запроса:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Структура данных полученной предварительно подписанной информации выглядит следующим образом:

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

3.  Загрузите файл

    Используйте возвращенный `putUrl` для выполнения запроса `PUT`, передав файл в теле запроса.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Примечание:
    > *   `putUrl`: поле `putUrl`, возвращенное на предыдущем шаге.
    > *   `file_path`: локальный путь файла, который нужно загрузить.
    >
    > Пример данных запроса:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Создайте запись файла

    После успешной загрузки создайте запись файла: инициируйте действие `create` для ресурса вложений (`attachments`) с POST-запросом.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Пояснение зависимых данных в `data-raw`:
    >
    > *   `title`: поле `fileInfo.title`, возвращенное на предыдущем шаге.
    > *   `filename`: поле `fileInfo.key`, возвращенное на предыдущем шаге.
    > *   `extname`: поле `fileInfo.extname`, возвращенное на предыдущем шаге.
    > *   `path`: пусто по умолчанию.
    > *   `size`: поле `fileInfo.size`, возвращенное на предыдущем шаге.
    > *   `url`: пусто по умолчанию.
    > *   `mimetype`: поле `fileInfo.mimetype`, возвращенное на предыдущем шаге.
    > *   `meta`: поле `fileInfo.meta`, возвращенное на предыдущем шаге.
    > *   `storageId`: поле `id`, возвращенное на шаге 1.
    >
    > Пример данных запроса:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Файловая коллекция

Первые три шага аналогичны загрузке в поле вложений. Однако на четвертом шаге вам нужно создать запись файла: инициируйте действие `create` для ресурса коллекции файлов с POST-запросом, передав информацию о файле в теле запроса.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Пояснение зависимых данных в `data-raw`:
>
> *   `title`: поле `fileInfo.title`, возвращенное на предыдущем шаге.
> *   `filename`: поле `fileInfo.key`, возвращенное на предыдущем шаге.
> *   `extname`: поле `fileInfo.extname`, возвращенное на предыдущем шаге.
> *   `path`: пусто по умолчанию.
> *   `size`: поле `fileInfo.size`, возвращенное на предыдущем шаге.
> *   `url`: пусто по умолчанию.
> *   `mimetype`: поле `fileInfo.mimetype`, возвращенное на предыдущем шаге.
> *   `meta`: поле `fileInfo.meta`, возвращенное на предыдущем шаге.
> *   `storageId`: поле `id`, возвращенное на шаге 1.
>
> Пример данных запроса:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```