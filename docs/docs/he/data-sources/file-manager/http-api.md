:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# API HTTP

העלאת קבצים, הן עבור שדות קבצים מצורפים והן עבור אוספי קבצים, נתמכת דרך API HTTP. שיטת ההפעלה משתנה בהתאם למנוע האחסון שבו משתמשים הקבצים המצורפים או אוסף הקבצים.

## העלאה בצד השרת

עבור מנועי אחסון קוד פתוח מובנים כמו S3, OSS ו-COS, קריאת ה-API HTTP זהה לזו המשמשת את תכונת העלאת הקבצים בממשק המשתמש, כאשר הקבצים מועלים דרך השרת. קריאות API דורשות העברת אסימון JWT מבוסס משתמש בכותרת הבקשה `Authorization`; אחרת, הגישה תידחה.

### שדה קובץ מצורף

בצעו פעולת `create` על משאב הקבצים המצורפים (`attachments`) על ידי שליחת בקשת POST, והעלו את התוכן הבינארי דרך השדה `file`. לאחר הקריאה, הקובץ יועלה למנוע האחסון המוגדר כברירת מחדל.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

כדי להעלות קבצים למנוע אחסון אחר, תוכלו להשתמש בפרמטר `attachmentField` כדי לציין את מנוע האחסון שהוגדר עבור שדה ה**אוסף**. אם לא הוגדר, הקובץ יועלה למנוע האחסון המוגדר כברירת מחדל.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### אוסף קבצים

העלאה ל**אוסף** קבצים תיצור באופן אוטומטי רשומת קובץ. בצעו פעולת `create` על משאב ה**אוסף** קבצים על ידי שליחת בקשת POST, והעלו את התוכן הבינארי דרך השדה `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

בעת העלאה ל**אוסף** קבצים, אין צורך לציין מנוע אחסון; הקובץ יועלה למנוע האחסון שהוגדר עבור אותו **אוסף**.

## העלאה בצד הלקוח

עבור מנועי אחסון תואמי S3 המסופקים באמצעות ה**תוסף** המסחרי S3-Pro, העלאת קבצים באמצעות API HTTP דורשת מספר שלבים.

### שדה קובץ מצורף

1.  קבלת מידע על מנוע האחסון

    בצעו פעולת `getBasicInfo` על **אוסף** האחסונים (`storages`), כולל שם האחסון, כדי לבקש את פרטי התצורה של מנוע האחסון.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    דוגמה לפרטי תצורה של מנוע אחסון שמוחזרים:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  קבלת מידע חתום מראש (presigned) מספק השירות

    בצעו פעולת `createPresignedUrl` על משאב `fileStorageS3` על ידי שליחת בקשת POST עם מידע הקשור לקובץ בגוף הבקשה, כדי לקבל את פרטי ההעלאה החתומים מראש.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > הערה:
    >
    > * `name`: שם הקובץ
    > * `size`: גודל הקובץ (בבתים)
    > * `type`: סוג ה-MIME של הקובץ. ניתן לעיין ב: [סוגי MIME נפוצים](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * `storageId`: מזהה מנוע האחסון (השדה `id` שהוחזר בשלב 1).
    > * `storageType`: סוג מנוע האחסון (השדה `type` שהוחזר בשלב 1).
    >
    > דוגמה לנתוני בקשה:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    מבנה הנתונים של המידע החתום מראש שהתקבל הוא כדלקמן:

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

3.  העלאת הקובץ

    השתמשו ב-`putUrl` שהוחזר כדי לבצע בקשת `PUT`, והעלו את הקובץ כגוף הבקשה.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > הערה:
    > * `putUrl`: השדה `putUrl` שהוחזר בשלב הקודם.
    > * `file_path`: הנתיב המקומי של הקובץ להעלאה.
    >
    > דוגמה לנתוני בקשה:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  יצירת רשומת קובץ

    לאחר העלאה מוצלחת, צרו את רשומת הקובץ על ידי ביצוע פעולת `create` על משאב הקבצים המצורפים (`attachments`) עם בקשת POST.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > הסבר על הנתונים התלויים ב-`data-raw`:
    > * `title`: השדה `fileInfo.title` שהוחזר בשלב הקודם.
    > * `filename`: השדה `fileInfo.key` שהוחזר בשלב הקודם.
    > * `extname`: השדה `fileInfo.extname` שהוחזר בשלב הקודם.
    > * `path`: ריק כברירת מחדל.
    > * `size`: השדה `fileInfo.size` שהוחזר בשלב הקודם.
    > * `url`: ריק כברירת מחדל.
    > * `mimetype`: השדה `fileInfo.mimetype` שהוחזר בשלב הקודם.
    > * `meta`: השדה `fileInfo.meta` שהוחזר בשלב הקודם.
    > * `storageId`: השדה `id` שהוחזר בשלב 1.
    >
    > דוגמה לנתוני בקשה:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### אוסף קבצים

שלושת השלבים הראשונים זהים לאלו של העלאה לשדה קובץ מצורף. עם זאת, בשלב הרביעי, עליכם ליצור את רשומת הקובץ על ידי ביצוע פעולת `create` על משאב ה**אוסף** קבצים עם בקשת POST, והעלאת פרטי הקובץ בגוף הבקשה.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> הסבר על הנתונים התלויים ב-`data-raw`:
> * `title`: השדה `fileInfo.title` שהוחזר בשלב הקודם.
> * `filename`: השדה `fileInfo.key` שהוחזר בשלב הקודם.
> * `extname`: השדה `fileInfo.extname` שהוחזר בשלב הקודם.
> * `path`: ריק כברירת מחדל.
> * `size`: השדה `fileInfo.size` שהוחזר בשלב הקודם.
> * `url`: ריק כברירת מחדל.
> * `mimetype`: השדה `fileInfo.mimetype` שהוחזר בשלב הקודם.
> * `meta`: השדה `fileInfo.meta` שהוחזר בשלב הקודם.
> * `storageId`: השדה `id` שהוחזר בשלב 1.
>
> דוגמה לנתוני בקשה:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```