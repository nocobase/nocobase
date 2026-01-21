:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# HTTP API

Завантаження файлів як для полів вкладень, так і для колекцій файлів можна обробляти через HTTP API. Спосіб виклику відрізняється залежно від рушія зберігання, який використовується для вкладення або колекції файлів.

## Завантаження на стороні сервера

Для вбудованих відкритих рушіїв зберігання, таких як S3, OSS та COS, виклик HTTP API такий самий, як і функція завантаження через користувацький інтерфейс, де файли завантажуються через сервер. Виклики API вимагають передачі токена JWT, заснованого на вході користувача, у заголовку запиту `Authorization`; інакше доступ буде відхилено.

### Поле вкладення

Ініціюйте дію `create` для ресурсу вкладень (`attachments`), надіславши POST-запит та завантаживши бінарний вміст через поле `file`. Після виклику файл буде завантажено до рушія зберігання за замовчуванням.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Щоб завантажити файли до іншого рушія зберігання, ви можете використати параметр `attachmentField` для вказівки рушія зберігання, налаштованого для поля колекції. Якщо він не налаштований, файл буде завантажено до рушія зберігання за замовчуванням.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Колекція файлів

Завантаження до колекції файлів автоматично створить запис файлу. Ініціюйте дію `create` для ресурсу колекції файлів, надіславши POST-запит та завантаживши бінарний вміст через поле `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

При завантаженні до колекції файлів не потрібно вказувати рушій зберігання; файл буде завантажено до рушія зберігання, налаштованого для цієї колекції.

## Завантаження на стороні клієнта

Для S3-сумісних рушіїв зберігання, що надаються через комерційний плагін S3-Pro, завантаження через HTTP API вимагає кількох кроків.

### Поле вкладення

1.  Отримайте інформацію про рушій зберігання

    Ініціюйте дію `getBasicInfo` для колекції сховищ (`storages`), включивши ім'я сховища, щоб запросити інформацію про конфігурацію рушія зберігання.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Приклад повернутої інформації про конфігурацію рушія зберігання:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Отримайте попередньо підписану URL-адресу від постачальника послуг

    Ініціюйте дію `createPresignedUrl` для ресурсу `fileStorageS3`, надіславши POST-запит з інформацією, пов'язаною з файлом, у тілі запиту, щоб отримати інформацію для попередньо підписаного завантаження.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Примітка:
    >
    > *   `name`: Ім'я файлу
    > *   `size`: Розмір файлу (у байтах)
    > *   `type`: MIME-тип файлу. Ви можете звернутися до [Поширені MIME-типи](https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: Ідентифікатор рушія зберігання (поле `id`, повернуте на кроці 1)
    > *   `storageType`: Тип рушія зберігання (поле `type`, повернуте на кроці 1)
    >
    > Приклад даних запиту:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Структура даних отриманої попередньо підписаної інформації виглядає так:

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

3.  Завантажте файл

    Використайте повернуту `putUrl` для виконання `PUT`-запиту, завантажуючи файл як тіло запиту.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Примітка:
    > *   `putUrl`: Поле `putUrl`, повернуте на попередньому кроці.
    > *   `file_path`: Локальний шлях до файлу, який потрібно завантажити.
    >
    > Приклад даних запиту:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Створіть запис файлу

    Після успішного завантаження створіть запис файлу, ініціювавши дію `create` для ресурсу вкладень (`attachments`) за допомогою POST-запиту.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Пояснення залежних даних у `data-raw`:
    > *   `title`: Поле `fileInfo.title`, повернуте на попередньому кроці.
    > *   `filename`: Поле `fileInfo.key`, повернуте на попередньому кроці.
    > *   `extname`: Поле `fileInfo.extname`, повернуте на попередньому кроці.
    > *   `path`: За замовчуванням порожнє.
    > *   `size`: Поле `fileInfo.size`, повернуте на попередньому кроці.
    > *   `url`: За замовчуванням порожнє.
    > *   `mimetype`: Поле `fileInfo.mimetype`, повернуте на попередньому кроці.
    > *   `meta`: Поле `fileInfo.meta`, повернуте на попередньому кроці.
    > *   `storageId`: Поле `id`, повернуте на кроці 1.
    >
    > Приклад даних запиту:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Колекція файлів

Перші три кроки такі ж, як і для завантаження до поля вкладення. Однак на четвертому кроці вам потрібно створити запис файлу, ініціювавши дію `create` для ресурсу колекції файлів за допомогою POST-запиту, завантаживши інформацію про файл у тілі запиту.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Пояснення залежних даних у `data-raw`:
> *   `title`: Поле `fileInfo.title`, повернуте на попередньому кроці.
> *   `filename`: Поле `fileInfo.key`, повернуте на попередньому кроці.
> *   `extname`: Поле `fileInfo.extname`, повернуте на попередньому кроці.
> *   `path`: За замовчуванням порожнє.
> *   `size`: Поле `fileInfo.size`, повернуте на попередньому кроці.
> *   `url`: За замовчуванням порожнє.
> *   `mimetype`: Поле `fileInfo.mimetype`, повернуте на попередньому кроці.
> *   `meta`: Поле `fileInfo.meta`, повернуте на попередньому кроці.
> *   `storageId`: Поле `id`, повернуте на кроці 1.
>
> Приклад даних запиту:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```