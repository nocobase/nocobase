:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# HTTP API
Завантаження файлів як для полів вкладень, так і для файлових колекцій підтримується через HTTP API. Спосіб виклику відрізняється залежно від рушія зберігання, який використовується полем вкладення або файловою колекцією.

## Завантаження на стороні сервера
Для вбудованих у проєкт рушіїв зберігання з відкритим кодом, таких як S3, OSS та COS, виклик HTTP API ідентичний функції завантаження через користувацький інтерфейс, і файли завантажуються через сервер. Для виклику API необхідно передати JWT-токен, отриманий після входу користувача, через заголовок запиту `Authorization`; в іншому випадку доступ буде відхилено.

### Поле вкладення
Виконайте операцію `create` для ресурсу вкладень (`attachments`), надішліть POST-запит та завантажте бінарний вміст через поле `file`. Після виклику файл буде завантажено до рушія зберігання за замовчуванням.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Щоб завантажити файл до іншого рушія зберігання, ви можете використати параметр `attachmentField` для вказівки рушія зберігання, налаштованого для поля колекції (якщо не налаштовано, файл буде завантажено до рушія зберігання за замовчуванням).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Файлова колекція
Завантаження до файлової колекції автоматично створить запис файлу. Виконайте операцію `create` для ресурсу файлової колекції, надішліть POST-запит та завантажте бінарний вміст через поле `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

При завантаженні до файлової колекції немає потреби вказувати рушій зберігання; файл буде завантажено до рушія зберігання, налаштованого для цієї колекції.

## Завантаження на стороні клієнта
Для S3-сумісних рушіїв зберігання, що надаються через комерційний плагін S3-Pro, завантаження через HTTP API необхідно виконувати в кілька кроків.

### Поле вкладення
1.  Отримання інформації про рушій зберігання

    Виконайте операцію `getBasicInfo` для колекції сховищ (`storages`), передаючи ім'я сховища (`storage name`), щоб запросити конфігураційну інформацію рушія зберігання.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Приклад повернутої конфігураційної інформації рушія зберігання:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Отримання попередньо підписаної інформації від постачальника послуг

    Виконайте операцію `createPresignedUrl` для ресурсу `fileStorageS3`, надішліть POST-запит та включіть інформацію, пов'язану з файлом, у тіло запиту, щоб отримати попередньо підписану інформацію для завантаження.

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
    > * name: Ім'я файлу
    > * size: Розмір файлу (у байтах)
    > * type: MIME-тип файлу. Ви можете звернутися до: [Поширені MIME-типи](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: Ідентифікатор рушія зберігання (поле `id`, повернуте на першому кроці)
    > * storageType: Тип рушія зберігання (поле `type`, повернуте на першому кроці)
    > 
    > Приклад даних запиту:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Структура отриманої попередньо підписаної інформації виглядає так:

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

3.  Завантаження файлу

    Використайте повернутий `putUrl` для виконання `PUT`-запиту та завантажте файл як тіло запиту.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Примітка:
    > * putUrl: Поле `putUrl`, повернуте на попередньому кроці
    > * file_path: Локальний шлях до файлу, який потрібно завантажити
    > 
    > Приклад даних запиту:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Створення запису файлу

    Після успішного завантаження виконайте операцію `create` для ресурсу вкладень (`attachments`), надіславши POST-запит для створення запису файлу.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Опис залежних даних у `data-raw`:
    > * title: Поле `fileInfo.title`, повернуте на попередньому кроці
    > * filename: Поле `fileInfo.key`, повернуте на попередньому кроці
    > * extname: Поле `fileInfo.extname`, повернуте на попередньому кроці
    > * path: За замовчуванням порожнє
    > * size: Поле `fileInfo.size`, повернуте на попередньому кроці
    > * url: За замовчуванням порожнє
    > * mimetype: Поле `fileInfo.mimetype`, повернуте на попередньому кроці
    > * meta: Поле `fileInfo.meta`, повернуте на попередньому кроці
    > * storageId: Поле `id`, повернуте на першому кроці
    > 
    > Приклад даних запиту:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Файлова колекція
Перші три кроки ідентичні завантаженню для поля вкладення, але на четвертому кроці вам потрібно створити запис файлу, виконавши операцію `create` для ресурсу файлової колекції, надіславши POST-запит та завантаживши інформацію про файл через тіло запиту.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Опис залежних даних у `data-raw`:
> * title: Поле `fileInfo.title`, повернуте на попередньому кроці
> * filename: Поле `fileInfo.key`, повернуте на попередньому кроці
> * extname: Поле `fileInfo.extname`, повернуте на попередньому кроці
> * path: За замовчуванням порожнє
> * size: Поле `fileInfo.size`, повернуте на попередньому кроці
> * url: За замовчуванням порожнє
> * mimetype: Поле `fileInfo.mimetype`, повернуте на попередньому кроці
> * meta: Поле `fileInfo.meta`, повернуте на попередньому кроці
> * storageId: Поле `id`, повернуте на першому кроці
> 
> Приклад даних запиту:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```