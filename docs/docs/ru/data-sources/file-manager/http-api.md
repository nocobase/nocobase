:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# HTTP API

Загрузка файлов как для полей вложений, так и для файловых коллекций может быть выполнена через HTTP API. Способ вызова отличается в зависимости от используемого движка хранения для вложения или файловой коллекции.

## Загрузка на стороне сервера

Для встроенных открытых движков хранения, таких как S3, OSS и COS, вызов HTTP API аналогичен функции загрузки через пользовательский интерфейс: файлы всегда загружаются через сервер. Вызовы API требуют передачи JWT-токена, полученного при входе пользователя, в заголовке запроса `Authorization`; в противном случае доступ будет отклонен.

### Поле вложения

Выполните операцию `create` для ресурса вложений (`attachments`), отправив POST-запрос и загрузив бинарное содержимое через поле `file`. После этого файл будет загружен в движок хранения по умолчанию.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Чтобы загрузить файлы в другой движок хранения, вы можете использовать параметр `attachmentField` для указания движка хранения, настроенного для поля коллекции. Если движок не указан, файл будет загружен в движок по умолчанию.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Файловая коллекция

Загрузка в файловую коллекцию автоматически создает запись файла. Выполните операцию `create` для ресурса файловой коллекции, отправив POST-запрос и загрузив бинарное содержимое через поле `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

При загрузке в файловую коллекцию нет необходимости указывать движок хранения; файл будет загружен в движок, настроенный для этой коллекции.

## Загрузка на стороне клиента

Для S3-совместимых движков хранения, предоставляемых коммерческим плагином S3-Pro, загрузка через HTTP API требует выполнения нескольких шагов.

### Поле вложения

1.  Получение информации о движке хранения

    Выполните операцию `getBasicInfo` для коллекции хранилищ (`storages`), указав имя хранилища, чтобы запросить информацию о конфигурации движка хранения.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Пример возвращаемой информации о конфигурации движка хранения:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Получение предварительно подписанной ссылки от поставщика услуг

    Выполните операцию `createPresignedUrl` для ресурса `fileStorageS3`, отправив POST-запрос с информацией о файле в теле запроса, чтобы получить предварительно подписанную информацию для загрузки.

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
    > *   `type`: MIME-тип файла. Вы можете ознакомиться с [Общими MIME-типами](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: Идентификатор движка хранения (поле `id`, возвращенное на шаге 1)
    > *   `storageType`: Тип движка хранения (поле `type`, возвращенное на шаге 1)
    >
    > Пример данных запроса:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Структура полученной предварительно подписанной информации выглядит следующим образом:

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

3.  Загрузка файла

    Используйте возвращенный `putUrl` для выполнения `PUT`-запроса, загружая файл в качестве тела запроса.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Примечание:
    > *   `putUrl`: Поле `putUrl`, возвращенное на предыдущем шаге.
    > *   `file_path`: Локальный путь к загружаемому файлу.
    >
    > Пример данных запроса:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Создание записи файла

    После успешной загрузки создайте запись файла, выполнив операцию `create` для ресурса вложений (`attachments`) с помощью POST-запроса.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Пояснение к зависимым данным в `data-raw`:
    >
    > *   `title`: Поле `fileInfo.title`, возвращенное на предыдущем шаге.
    > *   `filename`: Поле `fileInfo.key`, возвращенное на предыдущем шаге.
    > *   `extname`: Поле `fileInfo.extname`, возвращенное на предыдущем шаге.
    > *   `path`: По умолчанию пусто.
    > *   `size`: Поле `fileInfo.size`, возвращенное на предыдущем шаге.
    > *   `url`: По умолчанию пусто.
    > *   `mimetype`: Поле `fileInfo.mimetype`, возвращенное на предыдущем шаге.
    > *   `meta`: Поле `fileInfo.meta`, возвращенное на предыдущем шаге.
    > *   `storageId`: Поле `id`, возвращенное на шаге 1.
    >
    > Пример данных запроса:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Файловая коллекция

Первые три шага аналогичны загрузке для поля вложения. Однако на четвертом шаге вам необходимо создать запись файла, выполнив операцию `create` для ресурса файловой коллекции с помощью POST-запроса и передав информацию о файле в теле запроса.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Пояснение к зависимым данным в `data-raw`:
>
> *   `title`: Поле `fileInfo.title`, возвращенное на предыдущем шаге.
> *   `filename`: Поле `fileInfo.key`, возвращенное на предыдущем шаге.
> *   `extname`: Поле `fileInfo.extname`, возвращенное на предыдущем шаге.
> *   `path`: По умолчанию пусто.
> *   `size`: Поле `fileInfo.size`, возвращенное на предыдущем шаге.
> *   `url`: По умолчанию пусто.
> *   `mimetype`: Поле `fileInfo.mimetype`, возвращенное на предыдущем шаге.
> *   `meta`: Поле `fileInfo.meta`, возвращенное на предыдущем шаге.
> *   `storageId`: Поле `id`, возвращенное на шаге 1.
>
> Пример данных запроса:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```