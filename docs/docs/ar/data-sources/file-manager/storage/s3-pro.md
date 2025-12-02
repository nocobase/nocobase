---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::



pkg: "@nocobase/plugin-file-storage-s3-pro"
---

# تخزين الملفات: S3 (Pro)

## مقدمة

بناءً على إضافة إدارة الملفات، يضيف هذا الإصدار دعمًا لأنواع تخزين الملفات المتوافقة مع بروتوكول S3. يمكن دمج أي خدمة تخزين كائنات تدعم بروتوكول S3 بسهولة، مثل Amazon S3 و Alibaba Cloud OSS و Tencent Cloud COS و MinIO و Cloudflare R2 وغيرها، مما يعزز توافق ومرونة خدمات التخزين.

## الميزات

1. **الرفع من جانب العميل:** تُرفع الملفات مباشرة إلى خدمة التخزين دون المرور بخادم NocoBase، مما يوفر تجربة رفع أكثر كفاءة وسرعة.
2. **الوصول الخاص:** جميع عناوين URL للملفات هي عناوين مؤقتة وموقعة للتخويل، مما يضمن أمان الوصول إلى الملفات ومحدودية صلاحيتها.

## حالات الاستخدام

1. **إدارة جداول الملفات:** إدارة وتخزين جميع الملفات المرفوعة مركزيًا، مع دعم أنواع ملفات وطرق تخزين متعددة لتسهيل تصنيف الملفات واسترجاعها.
2. **تخزين حقول المرفقات:** يُستخدم لتخزين المرفقات التي تُرفع عبر النماذج أو السجلات، ويدعم ربطها بسجلات بيانات محددة.

## إعدادات الإضافة

1. قم بتمكين إضافة `plugin-file-storage-s3-pro`.
2. انتقل إلى "Setting -> FileManager" للوصول إلى إعدادات إدارة الملفات.
3. انقر على زر "Add new" واختر "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. في النافذة المنبثقة، ستجد نموذجًا مفصلاً لملئه. ارجع إلى الوثائق التالية للحصول على المعلمات ذات الصلة بخدمة الملفات الخاصة بك وإدخالها بشكل صحيح في النموذج.

![](https://static-docs.nocobase.com/20250413190828536.png)

## إعدادات مزود الخدمة

### Amazon S3

#### إنشاء Bucket

1. انتقل إلى [وحدة تحكم Amazon S3](https://ap-southeast-1.console.aws.amazon.com/s3/home).
2. انقر على زر "Create bucket" في الجانب الأيمن.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3. املأ `Bucket Name` (اسم الحاوية)، واترك الحقول الأخرى كإعدادات افتراضية، ثم مرر إلى الأسفل، وانقر على زر **"Create"** لإكمال العملية.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### إعدادات CORS

1. في قائمة الحاويات (buckets)، ابحث عن الحاوية التي أنشأتها للتو وانقر عليها للوصول إلى تفاصيلها.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. انتقل إلى علامة التبويب "Permission" ومرر إلى الأسفل للعثور على قسم إعدادات CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. أدخل الإعدادات التالية (يمكن تخصيصها حسب الحاجة) ثم احفظها.

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### استرجاع AccessKey و SecretAccessKey

1. انقر على زر "Security credentials" في الزاوية العلوية اليمنى من الصفحة.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. مرر إلى الأسفل، وابحث عن قسم "Access Keys"، ثم انقر على زر "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. وافق على الشروط (يُنصح باستخدام IAM لبيئات الإنتاج).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. احفظ Access Key و Secret Access Key المعروضين في الصفحة.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### استرجاع المعلمات وإعدادها

1. استخدم `AccessKey ID` و `AccessKey Secret` التي حصلت عليها في الخطوة السابقة، وتأكد من إدخالها بدقة.
2. انتقل إلى لوحة الخصائص (properties) في صفحة تفاصيل الحاوية (bucket)، حيث يمكنك الحصول على اسم الحاوية (Bucket Name) ومعلومات المنطقة (Region).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### الوصول العام (اختياري)

هذا إعداد اختياري. قم بتكوينه عندما تحتاج إلى جعل الملفات المرفوعة عامة بالكامل.

1. في لوحة الأذونات (Permissions)، مرر إلى "Object Ownership"، انقر على "Edit"، ثم قم بتمكين ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. مرر إلى "Block public access"، انقر على "Edit"، ثم اضبطه للسماح بتحكم ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. حدد "Public access" في NocoBase.

#### إعدادات الصور المصغرة (اختياري)

هذا الإعداد اختياري ويُستخدم عند الحاجة إلى تحسين حجم أو تأثير معاينة الصورة. **يرجى ملاحظة أن هذا النشر قد يتسبب في تكاليف إضافية. للحصول على تفاصيل، يرجى الرجوع إلى شروط وأسعار AWS.**

1. انتقل إلى [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. انقر على زر `Launch in the AWS Console` في أسفل الصفحة لبدء النشر.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. اتبع التعليمات لإكمال الإعدادات. تتطلب الخيارات التالية اهتمامًا خاصًا:
   1. عند إنشاء المكدس (stack)، تحتاج إلى تحديد اسم حاوية Amazon S3 التي تحتوي على الصور المصدر. يرجى إدخال اسم الحاوية الذي أنشأته سابقًا.
   2. إذا اخترت نشر واجهة المستخدم التجريبية (demo UI)، فبعد النشر، يمكنك استخدام الواجهة لاختبار وظيفة معالجة الصور. في وحدة تحكم AWS CloudFormation، حدد المكدس الخاص بك، انتقل إلى علامة التبويب "Outputs"، ابحث عن القيمة المقابلة لمفتاح `DemoUrl`، وانقر على الرابط لفتح واجهة العرض التوضيحي.
   3. يستخدم هذا الحل مكتبة `sharp` Node.js لمعالجة الصور بكفاءة. يمكنك تنزيل الكود المصدري من مستودع GitHub وتخصيصه حسب الحاجة.

   ![](https://static-docs.nocobase.com/20250221164315472.png)

   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. بعد اكتمال الإعدادات، انتظر حتى يتغير حالة النشر إلى `CREATE_COMPLETE`.

5. في إعدادات NocoBase، يرجى ملاحظة ما يلي:
   1. `Thumbnail rule`: املأ معلمات معالجة الصور ذات الصلة، مثل `?width=100`. للحصول على التفاصيل، ارجع إلى [وثائق AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: أدخل القيمة من Outputs -> ApiEndpoint بعد النشر.
   3. `Full access URL style`: يجب تحديد **Ignore** (لأن اسم الحاوية قد تم ملؤه بالفعل في الإعدادات، ولن تكون هناك حاجة إليه عند الوصول).

   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### مثال على الإعدادات

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### إنشاء Bucket

1. افتح [وحدة تحكم OSS](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. حدد "Buckets" من القائمة اليسرى وانقر على زر "Create Bucket" لبدء إنشاء الحاوية.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. املأ تفاصيل الحاوية ثم انقر على زر "Create".
   - `Bucket Name`: اختر اسمًا يناسب احتياجات عملك.
   - `Region`: حدد المنطقة الأقرب لمستخدميك.
   - يمكن أن تظل الإعدادات الأخرى افتراضية أو تُخصص حسب الحاجة.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### إعدادات CORS

1. انتقل إلى صفحة تفاصيل الحاوية (bucket) التي أنشأتها في الخطوة السابقة.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. انقر على "Content Security -> CORS" في القائمة الوسطى.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. انقر على زر "Create Rule"، املأ الحقول ذات الصلة، مرر إلى الأسفل ثم انقر على "OK". يمكنك الرجوع إلى لقطة الشاشة أدناه أو إجراء إعدادات أكثر تفصيلاً.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### استرجاع AccessKey و SecretAccessKey

1. انقر على "AccessKey" أسفل صورة ملفك الشخصي في الزاوية العلوية اليمنى.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. لأغراض العرض التوضيحي، سنقوم بإنشاء AccessKey باستخدام الحساب الرئيسي. في بيئة الإنتاج، يُنصح باستخدام RAM لإنشاء AccessKey. للحصول على التعليمات، يرجى الرجوع إلى [وثائق Alibaba Cloud](https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair).

3. انقر على زر "Create AccessKey".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. أكمل عملية التحقق من الحساب.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. احفظ Access Key و Secret Access Key المعروضين في الصفحة.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### استرجاع المعلمات وإعدادها

1. استخدم `AccessKey ID` و `AccessKey Secret` التي حصلت عليها في الخطوة السابقة.
2. انتقل إلى صفحة تفاصيل الحاوية (bucket) للحصول على اسم `Bucket`.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. مرر إلى الأسفل للحصول على `Region` (لا يلزم الجزء ".aliyuncs.com" اللاحق).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. احصل على عنوان نقطة النهاية (endpoint)، وعند إدخاله في NocoBase، ستحتاج إلى إضافة البادئة `https://`.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### إعدادات الصور المصغرة (اختياري)

هذا الإعداد اختياري ويُستخدم فقط عند الحاجة إلى تحسين حجم أو تأثير معاينة الصورة.

1. املأ المعلمات ذات الصلة لـ `Thumbnail rule`. للحصول على إعدادات المعلمات المحددة، ارجع إلى وثائق Alibaba Cloud حول [معالجة الصور](https://www.alibabacloud.com/help/en/oss/user-guide/image-processing).

2. اجعل إعدادات `Full upload URL style` و `Full access URL style` متطابقة.

#### مثال على الإعدادات

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### إنشاء Bucket

1. انقر على قائمة **Buckets** في الجانب الأيسر -> انقر على **Create Bucket** لفتح صفحة الإنشاء.
2. بعد إدخال اسم Bucket، انقر على زر **Save**.

#### استرجاع AccessKey و SecretAccessKey

1. انتقل إلى **Access Keys** -> انقر على زر **Create access key** لفتح صفحة الإنشاء.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. انقر على زر **Save**.

![](https://static-docs.nocobase.com/20250106111850639.png)

3. احفظ **Access Key** و **Secret Key** من النافذة المنبثقة لاستخدامهما في الإعدادات اللاحقة.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### إعدادات المعلمات

1. انتقل إلى صفحة **File manager** في NocoBase.
2. انقر على زر **Add new** واختر **S3 Pro**.
3. املأ النموذج:
   - **AccessKey ID** و **AccessKey Secret**: استخدم القيم المحفوظة من الخطوة السابقة.
   - **Region**: لا يمتلك MinIO المنشور بشكل خاص مفهوم المنطقة (Region)؛ يمكنك ضبطه على `"auto"`.
   - **Endpoint**: أدخل اسم النطاق أو عنوان IP لخدمتك المنشورة.
   - يجب تعيين **Full access URL style** إلى **Path-Style**.

#### مثال على الإعدادات

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

يمكنك الرجوع إلى إعدادات خدمات الملفات المذكورة أعلاه. المنطق متشابه.

#### مثال على الإعدادات

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

يمكنك الرجوع إلى إعدادات خدمات الملفات المذكورة أعلاه. المنطق متشابه.

#### مثال على الإعدادات

![](https://static-docs.nocobase.com/20250414154500264.png)

## دليل المستخدم

ارجع إلى [وثائق إضافة إدارة الملفات](/data-sources/file-manager).