:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# واجهة برمجة تطبيقات HTTP

يمكن التعامل مع عمليات رفع الملفات لكل من حقول المرفقات و مجموعات الملفات عبر واجهة برمجة تطبيقات HTTP. تختلف طريقة الاستدعاء بناءً على محرك التخزين المستخدم للمرفق أو مجموعة الملفات.

## الرفع من جانب الخادم

بالنسبة لمحركات التخزين مفتوحة المصدر المدمجة مثل S3 و OSS و COS، فإن استدعاء واجهة برمجة تطبيقات HTTP هو نفسه المستخدم في ميزة الرفع من واجهة المستخدم، حيث يتم رفع الملفات عبر الخادم. تتطلب استدعاءات API تمرير رمز JWT المميز المستند إلى تسجيل دخول المستخدم في ترويسة طلب `Authorization`؛ وإلا فسيتم رفض الوصول.

### حقل المرفق

ابدأ عملية `create` على مورد المرفقات (`attachments`) عن طريق إرسال طلب POST ورفع المحتوى الثنائي عبر حقل `file`. بعد الاستدعاء، سيتم رفع الملف إلى محرك التخزين الافتراضي.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

لرفع الملفات إلى محرك تخزين مختلف، يمكنك استخدام المعامل `attachmentField` لتحديد محرك التخزين المُكوّن لحقل الـ مجموعة. إذا لم يتم تكوينه، فسيتم رفع الملف إلى محرك التخزين الافتراضي.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### مجموعة الملفات

سيؤدي الرفع إلى مجموعة الملفات إلى إنشاء سجل ملف تلقائيًا. ابدأ عملية `create` على مورد مجموعة الملفات عن طريق إرسال طلب POST ورفع المحتوى الثنائي عبر حقل `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

عند الرفع إلى مجموعة الملفات، لا داعي لتحديد محرك تخزين؛ سيتم رفع الملف إلى محرك التخزين المُكوّن لتلك الـ مجموعة.

## الرفع من جانب العميل

بالنسبة لمحركات التخزين المتوافقة مع S3 والمقدمة عبر إضافة S3-Pro التجارية، يتطلب الرفع عبر واجهة برمجة تطبيقات HTTP عدة خطوات.

### حقل المرفق

1.  الحصول على معلومات محرك التخزين

    ابدأ عملية `getBasicInfo` على مجموعة التخزينات (`storages`)، مع تضمين اسم التخزين (`storage name`)، لطلب معلومات تكوين محرك التخزين.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    مثال على معلومات تكوين محرك التخزين المُرجعة:

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

    ابدأ عملية `createPresignedUrl` على مورد `fileStorageS3` عن طريق إرسال طلب POST مع معلومات الملف ذات الصلة في الجسم (body) للحصول على معلومات الرفع الموقعة مسبقًا.

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
    > *   `name`: اسم الملف
    > *   `size`: حجم الملف (بالبايت)
    > *   `type`: نوع MIME للملف. يمكنك الرجوع إلى: [أنواع MIME الشائعة](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: معرف محرك التخزين (حقل `id` المُرجع في الخطوة 1).
    > *   `storageType`: نوع محرك التخزين (حقل `type` المُرجع في الخطوة 1).
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

    استخدم `putUrl` المُرجع لإجراء طلب `PUT`، مع رفع الملف كجسم (body) للطلب.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > ملاحظة:
    > *   `putUrl`: حقل `putUrl` المُرجع في الخطوة السابقة.
    > *   `file_path`: المسار المحلي للملف المراد رفعه.
    >
    > مثال على بيانات الطلب:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  إنشاء سجل الملف

    بعد الرفع بنجاح، أنشئ سجل الملف عن طريق بدء عملية `create` على مورد المرفقات (`attachments`) بطلب POST.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > شرح البيانات التابعة في `data-raw`:
    > *   `title`: حقل `fileInfo.title` المُرجع في الخطوة السابقة.
    > *   `filename`: حقل `fileInfo.key` المُرجع في الخطوة السابقة.
    > *   `extname`: حقل `fileInfo.extname` المُرجع في الخطوة السابقة.
    > *   `path`: فارغ افتراضيًا.
    > *   `size`: حقل `fileInfo.size` المُرجع في الخطوة السابقة.
    > *   `url`: فارغ افتراضيًا.
    > *   `mimetype`: حقل `fileInfo.mimetype` المُرجع في الخطوة السابقة.
    > *   `meta`: حقل `fileInfo.meta` المُرجع في الخطوة السابقة.
    > *   `storageId`: حقل `id` المُرجع في الخطوة 1.
    >
    > مثال على بيانات الطلب:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### مجموعة الملفات

الخطوات الثلاث الأولى هي نفسها لرفع الملفات إلى حقل المرفق. ومع ذلك، في الخطوة الرابعة، تحتاج إلى إنشاء سجل الملف عن طريق بدء عملية `create` على مورد مجموعة الملفات بطلب POST، مع رفع معلومات الملف في الجسم (body).

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> شرح البيانات التابعة في `data-raw`:
> *   `title`: حقل `fileInfo.title` المُرجع في الخطوة السابقة.
> *   `filename`: حقل `fileInfo.key` المُرجع في الخطوة السابقة.
> *   `extname`: حقل `fileInfo.extname` المُرجع في الخطوة السابقة.
> *   `path`: فارغ افتراضيًا.
> *   `size`: حقل `fileInfo.size` المُرجع في الخطوة السابقة.
> *   `url`: فارغ افتراضيًا.
> *   `mimetype`: حقل `fileInfo.mimetype` المُرجع في الخطوة السابقة.
> *   `meta`: حقل `fileInfo.meta` المُرجع في الخطوة السابقة.
> *   `storageId`: حقل `id` المُرجع في الخطوة 1.
>
> مثال على بيانات الطلب:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```