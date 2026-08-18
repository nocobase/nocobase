---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---

# محرك التخزين: S3 (Pro)

## المقدمة

استنادًا إلى إضافة إدارة الملفات، يضيف هذا المحرك دعمًا لأنواع تخزين الملفات المتوافقة مع بروتوكول S3. يمكن دمج أي خدمة تخزين كائنات تدعم بروتوكول S3 بسهولة، مثل Amazon S3 وAliyun OSS وTencent COS وMinIO وCloudflare R2 وغيرها، مما يعزز توافق ومرونة خدمات التخزين.

## الميزات

1. **رفع من جهة العميل**: لا تمر عملية رفع الملفات عبر خادم NocoBase، بل يتم الاتصال مباشرة بخدمة التخزين، مما يوفر تجربة رفع أسرع وأكثر كفاءة.

2. **وصول خاص**: عند الوصول إلى الملفات، تكون جميع الروابط عبارة عن عناوين موقعة ومؤقتة، مما يضمن أمان وسرعة الوصول.

## حالات الاستخدام

1. **إدارة مجموعات الملفات**: إدارة مركزية لجميع الملفات المرفوعة، مع دعم أنواع وطرق تخزين متعددة لتسهيل التصنيف والاسترجاع.

2. **تخزين حقول المرفقات**: يُستخدم لتخزين المرفقات المرتبطة بالنماذج أو السجلات، مع دعم الربط بسجلات بيانات محددة.

## إعداد الإضافة

1. قم بتفعيل إضافة `plugin-file-storage-s3-pro`.

2. انتقل إلى "Setting -> FileManager".

3. اضغط على زر "Add new" واختر "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. بعد ظهور النافذة، ستجد نموذجًا يحتوي على عدة حقول. يمكنك الرجوع إلى الأقسام التالية للحصول على معلومات المعلمات وملئها بشكل صحيح.

![](https://static-docs.nocobase.com/20250413190828536.png)

---

## إعداد مزوّد الخدمة

### Amazon S3

#### إنشاء Bucket

1. افتح لوحة التحكم: https://ap-southeast-1.console.aws.amazon.com/s3/home  
2. اضغط على "Create bucket"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3. أدخل اسم الـ Bucket واترك باقي الإعدادات افتراضية، ثم اضغط "Create"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### إعداد CORS

1. ادخل إلى تفاصيل الـ Bucket  
2. انتقل إلى تبويب "Permission"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

3. أضف الإعداد التالي:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["POST", "PUT"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### الحصول على Access Keys

1. انتقل إلى "Security credentials"  
2. اضغط "Create Access Key"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

3. احفظ القيم المعروضة

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### إعداد المعلمات

- استخدم القيم التي حصلت عليها لـ AccessKey  
- استخرج اسم الـ Bucket والمنطقة (Region)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

---

### Aliyun OSS

#### إنشاء Bucket

1. افتح: https://oss.console.aliyun.com/overview  
2. اضغط "Create Bucket"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. أدخل البيانات المطلوبة (الاسم + المنطقة)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### إعداد CORS

1. ادخل إلى تفاصيل الـ Bucket  
2. انتقل إلى "CORS"  
3. أضف Rule جديد

![](https://static-docs.nocobase.com/20250219171042784.png)

#### الحصول على AccessKey

1. اضغط على "AccessKey"  
2. أنشئ مفتاح جديد واحفظه

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

#### إعداد المعلمات

- AccessKey: من الخطوات السابقة  
- Bucket name  
- Region (بدون ".aliyuncs.com")  
- Endpoint (مع https://)

---

### MinIO

#### إنشاء Bucket

1. Buckets → Create Bucket  
2. أدخل الاسم واحفظ

#### Access Keys

1. Access Keys → Create  
2. احفظ القيم

![](https://static-docs.nocobase.com/20250106111922957.png)

#### إعداد المعلمات

- Region: `auto`  
- Endpoint: عنوان السيرفر  
- Full access URL style: Path-Style  

---

### Tencent COS

يمكنك اتباع نفس منطق الإعداد الخاص بـ S3 أو Aliyun.

![](https://static-docs.nocobase.com/20250414153252872.png)

---

### Cloudflare R2

نفس طريقة الإعداد مثل الخدمات السابقة.

![](https://static-docs.nocobase.com/20250414154500264.png)