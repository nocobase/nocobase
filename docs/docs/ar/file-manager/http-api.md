:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# واجهة برمجة تطبيقات HTTP (API)

تدعم واجهة برمجة تطبيقات HTTP (API) رفع الملفات لكل من حقول المرفقات و مجموعات الملفات. تختلف طريقة الاستدعاء بناءً على محرك التخزين المستخدم لحقل المرفق أو مجموعة الملفات.

## الرفع من جانب الخادم

بالنسبة لمحركات التخزين مفتوحة المصدر المدمجة في المشروع، مثل S3 و OSS و COS، فإن استدعاء واجهة برمجة تطبيقات HTTP (API) هو نفسه وظيفة الرفع من واجهة المستخدم، ويتم رفع الملفات جميعها عبر الخادم. يتطلب استدعاء الواجهة تمرير رمز JWT المميز المستند إلى تسجيل دخول المستخدم عبر رأس طلب `Authorization`؛ وإلا فسيتم رفض الوصول.

### حقل المرفق

لبدء عملية `create` على مورد المرفقات (`attachments`)، أرسل طلب `POST`، وقم برفع المحتوى الثنائي عبر حقل `file`. بعد الاستدعاء، سيتم رفع الملف إلى محرك التخزين الافتراضي.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

لرفع ملف إلى محرك تخزين مختلف، يمكنك استخدام المعامل `attachmentField` لتحديد محرك التخزين الذي تم تكوينه لحقل المجموعة (إذا لم يتم تكوينه، فسيتم رفعه إلى محرك التخزين الافتراضي).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### مجموعة الملفات

سيؤدي الرفع إلى مجموعة الملفات إلى إنشاء سجل ملف تلقائيًا. لبدء عملية `create` على مورد مجموعة الملفات، أرسل طلب `POST`، وقم برفع المحتوى الثنائي عبر حقل `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

عند الرفع إلى مجموعة الملفات، لا داعي لتحديد محرك تخزين؛ سيتم رفع الملف إلى محرك التخزين المكون لتلك المجموعة.

## الرفع من جانب العميل

بالنسبة لمحركات التخزين المتوافقة مع S3 التي توفرها إضافة S3-Pro التجارية، يتطلب الرفع عبر واجهة برمجة تطبيقات HTTP (API) استدعاءها في عدة خطوات.

### حقل المرفق

1.  الحصول على معلومات محرك التخزين

    لبدء عملية `getBasicInfo` على مجموعة التخزينات (`storages`)، مع تمرير اسم التخزين (`storage name`)، لطلب معلومات تكوين محرك التخزين.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    مثال على معلومات تكوين محرك التخزين المعادة:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  الحصول على معلومات التوقيع المسبق من مزود الخدمة

    لبدء عملية `createPresignedUrl` على مورد `fileStorageS3`، أرسل طلب `POST`، وقم بتضمين المعلومات المتعلقة بالملف في نص الطلب للحصول على معلومات الرفع الموقعة مسبقًا.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > ملاحظة:
    > 
    > * name: اسم الملف
    > * size: حجم الملف (بالبايت)
    > * type: نوع MIME للملف. يمكنك الرجوع إلى: [أنواع MIME الشائعة](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: معرف محرك التخزين (حقل `id` الذي تم إرجاعه في الخطوة الأولى)
    > * storageType: نوع محرك التخزين (حقل `type` الذي تم إرجاعه في الخطوة الأولى)
    > 
    > مثال على بيانات الطلب:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    هيكل بيانات معلومات التوقيع المسبق التي تم الحصول عليها هو كما يلي:

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

3.  رفع الملف

    استخدم `putUrl` المعادة لبدء طلب `PUT` ورفع الملف كنص للطلب.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > ملاحظة:
    > * putUrl: حقل `putUrl` الذي تم إرجاعه في الخطوة السابقة
    > * file_path: المسار المحلي للملف المراد رفعه
    > 
    > مثال على بيانات الطلب:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  إنشاء سجل ملف

    بعد الرفع بنجاح، ابدأ عملية `create` على مورد المرفقات (`attachments`) عن طريق إرسال طلب `POST` لإنشاء سجل الملف.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > وصف البيانات التابعة في `data-raw`:
    > * title: حقل `fileInfo.title` الذي تم إرجاعه في الخطوة السابقة
    > * filename: حقل `fileInfo.key` الذي تم إرجاعه في الخطوة السابقة
    > * extname: حقل `fileInfo.extname` الذي تم إرجاعه في الخطوة السابقة
    > * path: فارغ افتراضيًا
    > * size: حقل `fileInfo.size` الذي تم إرجاعه في الخطوة السابقة
    > * url: فارغ افتراضيًا
    > * mimetype: حقل `fileInfo.mimetype` الذي تم إرجاعه في الخطوة السابقة
    > * meta: حقل `fileInfo.meta` الذي تم إرجاعه في الخطوة السابقة
    > * storageId: حقل `id` الذي تم إرجاعه في الخطوة الأولى
    > 
    > مثال على بيانات الطلب:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### مجموعة الملفات

الخطوات الثلاث الأولى هي نفسها لرفع حقل المرفق، ولكن في الخطوة الرابعة، تحتاج إلى إنشاء سجل ملف عن طريق بدء عملية `create` على مورد مجموعة الملفات، وإرسال طلب `POST`، ورفع معلومات الملف عبر نص الطلب.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> وصف البيانات التابعة في `data-raw`:
> * title: حقل `fileInfo.title` الذي تم إرجاعه في الخطوة السابقة
> * filename: حقل `fileInfo.key` الذي تم إرجاعه في الخطوة السابقة
> * extname: حقل `fileInfo.extname` الذي تم إرجاعه في الخطوة السابقة
> * path: فارغ افتراضيًا
> * size: حقل `fileInfo.size` الذي تم إرجاعه في الخطوة السابقة
> * url: فارغ افتراضيًا
> * mimetype: حقل `fileInfo.mimetype` الذي تم إرجاعه في الخطوة السابقة
> * meta: حقل `fileInfo.meta` الذي تم إرجاعه في الخطوة السابقة
> * storageId: حقل `id` الذي تم إرجاعه في الخطوة الأولى
> 
> مثال على بيانات الطلب:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```