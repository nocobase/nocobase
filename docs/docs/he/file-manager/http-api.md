:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# API HTTP

העלאת קבצים, הן עבור שדות קבצים מצורפים והן עבור אוספי קבצים, נתמכת דרך ה-API HTTP. שיטת ההפעלה משתנה בהתאם למנוע האחסון שבו משתמשים שדה הקובץ המצורף או אוסף הקבצים.

## העלאה בצד השרת

עבור מנועי אחסון קוד פתוח מובנים בפרויקט, כגון S3, OSS ו-COS, קריאת ה-API HTTP זהה לפונקציית העלאת הקבצים בממשק המשתמש, והקבצים מועלים דרך השרת. קריאה ל-API דורשת העברת אסימון JWT מבוסס התחברות משתמש דרך כותרת הבקשה `Authorization`; אחרת, הגישה תידחה.

### שדה קובץ מצורף

בצעו פעולת `create` על משאב הקבצים המצורפים (`attachments`), שלחו בקשת POST, והעלו את התוכן הבינארי דרך השדה `file`. לאחר הקריאה, הקובץ יועלה למנוע האחסון ברירת המחדל.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

כדי להעלות קובץ למנוע אחסון אחר, תוכלו להשתמש בפרמטר `attachmentField` כדי לציין את מנוע האחסון שהוגדר עבור שדה ה**אוסף** (אם לא הוגדר, הוא יועלה למנוע האחסון ברירת המחדל).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### אוסף קבצים

העלאה ל**אוסף קבצים** תיצור באופן אוטומטי רשומת קובץ. בצעו פעולת `create` על משאב **אוסף הקבצים**, שלחו בקשת POST, והעלו את התוכן הבינארי דרך השדה `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

בעת העלאה ל**אוסף קבצים**, אין צורך לציין מנוע אחסון; הקובץ יועלה למנוע האחסון שהוגדר עבור **אוסף** זה.

## העלאה בצד הלקוח

עבור מנועי אחסון תואמי S3 המסופקים באמצעות ה**תוסף** המסחרי S3-Pro, העלאת קבצים דרך ה-API HTTP דורשת מספר שלבים.

### שדה קובץ מצורף

1.  קבלת מידע על מנוע האחסון

    בצעו פעולת `getBasicInfo` על **אוסף** האחסונים (`storages`), יחד עם מזהה שם האחסון (storage name), כדי לבקש את פרטי התצורה של מנוע האחסון.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    דוגמה למידע תצורת מנוע אחסון שמוחזר:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  קבלת מידע חתום מראש (Presigned) מספק השירות

    בצעו פעולת `createPresignedUrl` על משאב `fileStorageS3`, שלחו בקשת POST, וכללו מידע הקשור לקובץ בגוף הבקשה כדי לקבל את פרטי ההעלאה החתומים מראש.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > שימו לב:
    >
    > *   `name`: שם הקובץ
    > *   `size`: גודל הקובץ (בבתים)
    > *   `type`: סוג ה-MIME של הקובץ. תוכלו לעיין ב: [סוגי MIME נפוצים](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: מזהה מנוע האחסון (השדה `id` שהוחזר בשלב הראשון)
    > *   `storageType`: סוג מנוע האחסון (השדה `type` שהוחזר בשלב הראשון)
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

3.  העלאת קובץ

    השתמשו ב-`putUrl` שהוחזר כדי לבצע בקשת `PUT` ולהעלות את הקובץ כגוף הבקשה.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > שימו לב:
    > *   `putUrl`: השדה `putUrl` שהוחזר בשלב הקודם
    > *   `file_path`: הנתיב המקומי של הקובץ להעלאה
    >
    > דוגמה לנתוני בקשה:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  יצירת רשומת קובץ

    לאחר העלאה מוצלחת, בצעו פעולת `create` על משאב הקבצים המצורפים (`attachments`) על ידי שליחת בקשת POST, כדי ליצור את רשומת הקובץ.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > הסבר על הנתונים התלויים ב-`data-raw`:
    > *   `title`: השדה `fileInfo.title` שהוחזר בשלב הקודם
    > *   `filename`: השדה `fileInfo.key` שהוחזר בשלב הקודם
    > *   `extname`: השדה `fileInfo.extname` שהוחזר בשלב הקודם
    > *   `path`: ריק כברירת מחדל
    > *   `size`: השדה `fileInfo.size` שהוחזר בשלב הקודם
    > *   `url`: ריק כברירת מחדל
    > *   `mimetype`: השדה `fileInfo.mimetype` שהוחזר בשלב הקודם
    > *   `meta`: השדה `fileInfo.meta` שהוחזר בשלב הקודם
    > *   `storageId`: השדה `id` שהוחזר בשלב הראשון
    >
    > דוגמה לנתוני בקשה:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### אוסף קבצים

שלושת השלבים הראשונים זהים לאלו של העלאת קבצים לשדה קובץ מצורף, אך בשלב הרביעי עליכם ליצור רשומת קובץ על ידי ביצוע פעולת `create` על משאב **אוסף הקבצים**, שליחת בקשת POST, והעלאת פרטי הקובץ דרך גוף הבקשה.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> הסבר על הנתונים התלויים ב-`data-raw`:
> *   `title`: השדה `fileInfo.title` שהוחזר בשלב הקודם
> *   `filename`: השדה `fileInfo.key` שהוחזר בשלב הקודם
> *   `extname`: השדה `fileInfo.extname` שהוחזר בשלב הקודם
> *   `path`: ריק כברירת מחדל
> *   `size`: השדה `fileInfo.size` שהוחזר בשלב הקודם
> *   `url`: ריק כברירת מחדל
> *   `mimetype`: השדה `fileInfo.mimetype` שהוחזר בשלב הקודם
> *   `meta`: השדה `fileInfo.meta` שהוחזר בשלב הקודם
> *   `storageId`: השדה `id` שהוחזר בשלב הראשון
>
> דוגמה לנתוני בקשה:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```