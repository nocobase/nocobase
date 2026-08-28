---
title: "HTTP API менеджера файлов"
description: "Загрузка файлов для полей вложений и таблиц файлов через HTTP API: загрузка на сервер (S3/OSS/COS), прямая загрузка с клиента, поддержка JWT-аутентификации и указания хранилища."
keywords: "HTTP API загрузки файлов,attachments create,загрузка на сервер,прямая загрузка с клиента,NocoBase"
---

# HTTP API

Загрузка файлов для полей вложений и таблиц файлов поддерживает обработку через HTTP API. В зависимости от используемого хранилища для вложений или таблицы файлов применяются разные способы вызова.

## Загрузка на сервер

Для встроенных в проект хранилищ с открытым исходным кодом, таких как S3, OSS и COS, HTTP API использует тот же механизм, что и загрузка через пользовательский интерфейс: все файлы загружаются через сервер. Для вызова API необходимо передать JWT-токен, основанный на входе пользователя, в заголовке `Authorization`, иначе доступ будет отклонён.

### Поле вложений

Для ресурса таблицы вложений (`attachments`) выполняется операция `create`, запрос отправляется методом POST, а двоичное содержимое загружается через поле `file`. После вызова файл будет загружен в хранилище по умолчанию.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Чтобы загрузить файл в другое хранилище, можно указать хранилище, настроенное для поля соответствующей таблицы, с помощью параметра `attachmentField` (если оно не настроено, файл будет загружен в хранилище по умолчанию).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Таблица файлов

При загрузке в таблицу файлов запись о файле создаётся автоматически. Для ресурса таблицы файлов выполняется операция `create`, запрос отправляется методом POST, а двоичное содержимое загружается через поле `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

При загрузке в таблицу файлов указывать хранилище не требуется: файл будет загружен в хранилище, настроенное для этой таблицы.

## Загрузка с клиента

Для хранилищ, совместимых с S3 и предоставляемых коммерческим плагином S3-Pro, загрузка через HTTP API выполняется в несколько этапов.

### Поле вложений

1.  Получение информации о хранилище

    Для таблицы хранилищ (`storages`) выполняется операция `getBasicInfo` с указанием идентификатора пространства хранения (storage name), чтобы получить сведения о конфигурации хранилища.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Пример возвращаемых сведений о конфигурации хранилища:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Получение предварительно подписанных данных поставщика

    Для ресурса `fileStorageS3` выполняется операция `createPresignedUrl`. Запрос отправляется методом POST, в body передаются сведения о файле, после чего возвращаются данные для предварительно подписанной загрузки.

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
    > * type: MIME-тип файла, см. [Распространённые MIME-типы](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: идентификатор хранилища (поле `id`, возвращённое на первом шаге)
    > * storageType: тип хранилища (поле `type`, возвращённое на первом шаге)
    >
    > Пример данных запроса:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Структура полученных предварительно подписанных данных выглядит следующим образом:

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

    Используйте возвращённый `putUrl` для отправки запроса `PUT` и загрузите файл в body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Примечание:
    > * putUrl: поле `putUrl`, возвращённое на предыдущем шаге
    > * file_path: путь к локальному файлу, который необходимо загрузить
    >
    > Пример данных запроса:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Создание записи о файле

    После успешной загрузки для ресурса таблицы вложений (`attachments`) выполняется операция `create`. Запрос отправляется методом POST для создания записи о файле.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Описание зависимостей данных в data-raw:
    > * title: поле `fileInfo.title`, возвращённое на предыдущем шаге
    > * filename: поле `fileInfo.key`, возвращённое на предыдущем шаге
    > * extname: поле `fileInfo.extname`, возвращённое на предыдущем шаге
    > * path: по умолчанию пустое значение
    > * size: поле `fileInfo.size`, возвращённое на предыдущем шаге
    > * url: по умолчанию пустое значение
    > * mimetype: поле `fileInfo.mimetype`, возвращённое на предыдущем шаге
    > * meta: поле `fileInfo.meta`, возвращённое на предыдущем шаге
    > * storageId: поле `id`, возвращённое на первом шаге
    >
    > Пример данных запроса:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Таблица файлов

Первые три шага аналогичны загрузке для поля вложений, но на четвёртом шаге необходимо создать запись о файле. Для ресурса таблицы файлов выполняется операция create, запрос отправляется методом POST, а сведения о файле передаются в body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Описание зависимостей данных в data-raw:
> * title: поле `fileInfo.title`, возвращённое на предыдущем шаге
> * filename: поле `fileInfo.key`, возвращённое на предыдущем шаге
> * extname: поле `fileInfo.extname`, возвращённое на предыдущем шаге
> * path: по умолчанию пустое значение
> * size: поле `fileInfo.size`, возвращённое на предыдущем шаге
> * url: по умолчанию пустое значение
> * mimetype: поле `fileInfo.mimetype`, возвращённое на предыдущем шаге
> * meta: поле `fileInfo.meta`, возвращённое на предыдущем шаге
> * storageId: поле `id`, возвращённое на первом шаге
>
> Пример данных запроса:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```