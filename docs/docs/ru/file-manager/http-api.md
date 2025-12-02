:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# HTTP API

Загрузка файлов для полей вложений и файловых коллекций поддерживается через HTTP API. Способ вызова отличается в зависимости от используемого движка хранения.

## Загрузка на стороне сервера

Для встроенных в проект открытых движков хранения (например, S3, OSS, COS) вызов HTTP API аналогичен загрузке через пользовательский интерфейс: файлы загружаются на стороне сервера. Для вызова API необходимо передать JWT-токен, полученный при входе пользователя, в заголовке запроса `Authorization`. В противном случае доступ будет отклонен.

### Поле вложения

Чтобы загрузить файл, выполните операцию `create` для ресурса вложений (`attachments`), отправив POST-запрос. Бинарное содержимое файла передайте через поле `file`. После вызова файл будет загружен в движок хранения по умолчанию.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Если вам нужно загрузить файл в другой движок хранения, используйте параметр `attachmentField`. Он позволяет указать движок, настроенный для поля коллекции. Если движок не указан, файл будет загружен в движок хранения по умолчанию.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Файловая коллекция

При загрузке в файловую коллекцию автоматически создается запись файла. Для этого выполните операцию `create` для ресурса файловой коллекции, отправив POST-запрос и передав бинарное содержимое через поле `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

При загрузке в файловую коллекцию указывать движок хранения не требуется; файл будет загружен в движок, настроенный для этой коллекции.

## Загрузка на стороне клиента

Для S3-совместимых движков хранения, которые предоставляет коммерческий плагин S3-Pro, загрузка через HTTP API выполняется в несколько этапов.

### Поле вложения

1.  Получение информации о движке хранения

    Выполните операцию `getBasicInfo` для коллекции хранилищ (`storages`), указав имя хранилища, чтобы получить информацию о конфигурации движка хранения.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Пример конфигурации движка хранения, которая будет возвращена:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Получение предварительно подписанных данных от поставщика услуг

    Выполните операцию `createPresignedUrl` для ресурса `fileStorageS3`, отправив POST-запрос. Включите в тело запроса информацию о файле, чтобы получить предварительно подписанные данные для загрузки.

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
    > *   `type`: MIME-тип файла. Вы можете ознакомиться с ним здесь: [Распространенные MIME-типы](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: ID движка хранения (поле `id`, возвращенное на первом шаге)
    > *   `storageType`: Тип движка хранения (поле `type`, возвращенное на первом шаге)
    > 
    > Пример данных запроса:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Структура полученных предварительно подписанных данных:

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

    Используйте полученный `putUrl` для выполнения PUT-запроса, загрузив файл в качестве тела запроса.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Примечание:
    > *   `putUrl`: Поле `putUrl`, возвращенное на предыдущем шаге
    > *   `file_path`: Локальный путь к загружаемому файлу
    > 
    > Пример данных запроса:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Создание записи файла

    После успешной загрузки файла создайте запись о нем, выполнив операцию `create` для ресурса вложений (`attachments`) и отправив POST-запрос.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Описание данных, используемых в `data-raw`:
    > *   `title`: Поле `fileInfo.title`, возвращенное на предыдущем шаге
    > *   `filename`: Поле `fileInfo.key`, возвращенное на предыдущем шаге
    > *   `extname`: Поле `fileInfo.extname`, возвращенное на предыдущем шаге
    > *   `path`: По умолчанию пусто
    > *   `size`: Поле `fileInfo.size`, возвращенное на предыдущем шаге
    > *   `url`: По умолчанию пусто
    > *   `mimetype`: Поле `fileInfo.mimetype`, возвращенное на предыдущем шаге
    > *   `meta`: Поле `fileInfo.meta`, возвращенное на предыдущем шаге
    > *   `storageId`: Поле `id`, возвращенное на первом шаге
    > 
    > Пример данных запроса:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Файловая коллекция

Первые три шага аналогичны загрузке для полей вложений. На четвертом шаге вам нужно создать запись файла, выполнив операцию `create` для ресурса файловой коллекции, отправив POST-запрос и передав информацию о файле в теле запроса.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Описание данных, используемых в `data-raw`:
> *   `title`: Поле `fileInfo.title`, возвращенное на предыдущем шаге
> *   `filename`: Поле `fileInfo.key`, возвращенное на предыдущем шаге
> *   `extname`: Поле `fileInfo.extname`, возвращенное на предыдущем шаге
> *   `path`: По умолчанию пусто
> *   `size`: Поле `fileInfo.size`, возвращенное на предыдущем шаге
> *   `url`: По умолчанию пусто
> *   `mimetype`: Поле `fileInfo.mimetype`, возвращенное на предыдущем шаге
> *   `meta`: Поле `fileInfo.meta`, возвращенное на предыдущем шаге
> *   `storageId`: Поле `id`, возвращенное на первом шаге
> 
> Пример данных запроса:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```