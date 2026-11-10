# HTTP API

يتم دعم رفع الملفات لكل من حقول المرفقات (Attachment) ومجموعات الملفات (File Collection) عبر واجهة HTTP API. تختلف طريقة الاستدعاء حسب محرك التخزين المستخدم.

## الرفع من جهة الخادم

بالنسبة لمحركات التخزين المفتوحة المصدر المدمجة مثل S3 وOSS وCOS، فإن استدعاء HTTP API يكون مماثلًا لعملية الرفع من الواجهة، حيث يتم رفع الملفات عبر الخادم.  
يتطلب استدعاء API تمرير رمز JWT الخاص بالمستخدم عبر ترويسة `Authorization`، وإلا سيتم رفض الطلب.

### حقل المرفقات

قم بتنفيذ عملية `create` على مورد `attachments` عبر طلب POST، وإرسال الملف عبر الحقل `file`. سيتم رفع الملف إلى محرك التخزين الافتراضي.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

لرفع الملف إلى محرك تخزين آخر، يمكنك استخدام المعامل `attachmentField` لتحديد الحقل المرتبط بمحرك تخزين معين:

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### مجموعة الملفات

عند الرفع إلى مجموعة ملفات، يتم إنشاء سجل ملف تلقائيًا.  
قم بتنفيذ عملية `create` على مورد مجموعة الملفات:

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

لا حاجة لتحديد محرك التخزين، حيث سيتم استخدام المحرك المرتبط بالمجموعة.

---

## الرفع من جهة العميل

بالنسبة لمحركات S3 المتقدمة (S3-Pro)، تتم عملية الرفع عبر عدة خطوات.

### حقل المرفقات

#### 1. الحصول على معلومات محرك التخزين

```shell
curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
  -H 'Authorization: Bearer <JWT>'
```

مثال على البيانات:

```json
{
  "id": 2,
  "title": "xxx",
  "name": "xxx",
  "type": "s3-compatible",
  "rules": { ... }
}
```

---

#### 2. الحصول على رابط رفع موقّع (Presigned URL)

```shell
curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
  -X POST \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
```

> ملاحظات:
> - name: اسم الملف  
> - size: حجم الملف (بايت)  
> - type: نوع MIME  
> - storageId: معرف محرك التخزين  
> - storageType: نوع محرك التخزين  

---

#### 3. رفع الملف

```shell
curl '<putUrl>' \
  -X 'PUT' \
  -T <file_path>
```

---

#### 4. إنشاء سجل الملف

```shell
curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
  -X POST \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

---

### مجموعة الملفات

نفس الخطوات السابقة، لكن في الخطوة الأخيرة:

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```