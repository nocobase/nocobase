---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::


# محرك التخزين: S3 (احترافي)

## مقدمة

بناءً على إضافة إدارة الملفات، تمت إضافة دعم لأنواع تخزين الملفات المتوافقة مع بروتوكول S3. يمكن دمج أي خدمة تخزين كائنات تدعم بروتوكول S3 بسهولة، مثل Amazon S3، وAliyun OSS، وTencent COS، وMinIO، وCloudflare R2، وغيرها، مما يعزز توافق خدمات التخزين ومرونتها بشكل أكبر.

## الميزات

1. الرفع من جانب العميل: لا تمر عملية رفع الملفات عبر خادم NocoBase، بل تتصل مباشرة بخدمة تخزين الملفات، مما يوفر تجربة رفع أكثر كفاءة وسرعة.
    
2. الوصول الخاص: عند الوصول إلى الملفات، تكون جميع عناوين URL عبارة عن عناوين مؤقتة وموقعة ومصرح بها، مما يضمن أمان الوصول إلى الملفات وصلاحيتها.


## حالات الاستخدام

1. **إدارة مجموعة الملفات**: إدارة وتخزين جميع الملفات المرفوعة مركزياً، مع دعم أنواع ملفات وطرق تخزين متنوعة لتسهيل تصنيف الملفات واسترجاعها.
    
2. **تخزين حقول المرفقات**: يُستخدم لتخزين بيانات المرفقات التي يتم رفعها في النماذج أو السجلات، مع دعم الربط بسجلات بيانات محددة.
  

## إعدادات الإضافة

1. قم بتمكين إضافة `plugin-file-storage-s3-pro`.
    
2. انقر على "Setting-> FileManager" للدخول إلى إعدادات مدير الملفات.

3. انقر على زر "Add new" واختر "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. بعد ظهور النافذة المنبثقة، ستجد نموذجاً يحتوي على العديد من الحقول التي تحتاج إلى تعبئتها. يمكنك الرجوع إلى الوثائق اللاحقة للحصول على معلومات المعلمات ذات الصلة لخدمة الملفات المعنية وتعبئتها بشكل صحيح في النموذج.

![](https://static-docs.nocobase.com/20250413190828536.png)


## إعدادات مزود الخدمة

### Amazon S3

#### إنشاء Bucket

1. افتح https://ap-southeast-1.console.aws.amazon.com/s3/home للدخول إلى لوحة تحكم S3.
    
2. انقر على زر "Create bucket" على اليمين.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. املأ حقل اسم الـ Bucket (Bucket Name). يمكن ترك الحقول الأخرى على إعداداتها الافتراضية. مرّر لأسفل الصفحة وانقر على زر **"**Create**"** لإكمال عملية الإنشاء.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### إعدادات CORS

1. انتقل إلى قائمة الـ Buckets، ثم ابحث عن الـ Bucket الذي أنشأته للتو وانقر عليه للدخول إلى صفحة التفاصيل الخاصة به.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. انقر على علامة التبويب "Permission"، ثم مرّر لأسفل للعثور على قسم إعدادات CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. أدخل الإعدادات التالية (يمكنك تخصيصها بشكل أكبر) ثم احفظها.
    
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

#### الحصول على AccessKey و SecretAccessKey

1. انقر على زر "Security credentials" في الزاوية العلوية اليمنى من الصفحة.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. مرّر لأسفل، وابحث عن قسم "Access Keys"، ثم انقر على زر "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. انقر للموافقة (هذا عرض توضيحي باستخدام الحساب الرئيسي؛ يُنصح باستخدام IAM في بيئة الإنتاج).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. احفظ Access key و Secret access key المعروضين في الصفحة.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### الحصول على المعلمات وإعدادها

1. AccessKey ID و AccessKey Secret هما القيمتان اللتان حصلت عليهما في الخطوة السابقة. يرجى تعبئتهما بدقة.
    
2. انتقل إلى لوحة الخصائص (properties) في صفحة تفاصيل الـ Bucket، حيث يمكنك الحصول على اسم الـ Bucket ومعلومات المنطقة (Region).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### الوصول العام (اختياري)

هذا إعداد اختياري. قم بتكوينه عندما تحتاج إلى جعل الملفات المرفوعة عامة بالكامل.

1. انتقل إلى لوحة الأذونات (Permissions)، مرّر لأسفل إلى Object Ownership، انقر على "Edit"، وقم بتمكين ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. مرّر إلى Block public access، انقر على "Edit"، واضبطه للسماح بتحكم ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. في NocoBase، حدد "Public access".

#### إعدادات الصور المصغرة (اختياري)

هذا الإعداد اختياري ويُستخدم لتحسين حجم أو تأثير معاينة الصور. **يرجى ملاحظة أن حل النشر هذا قد يترتب عليه تكاليف إضافية. للحصول على الرسوم المحددة، يرجى الرجوع إلى شروط AWS ذات الصلة.**

1. قم بزيارة [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. انقر على زر `Launch in the AWS Console` في أسفل الصفحة لبدء نشر الحل.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. اتبع التعليمات لإكمال الإعدادات. انتبه بشكل خاص للخيارات التالية:
   1. عند إنشاء المكدس (stack)، تحتاج إلى تحديد اسم Bucket في Amazon S3 يحتوي على الصور المصدر. يرجى إدخال اسم الـ Bucket الذي أنشأته مسبقاً.
   2. إذا اخترت نشر واجهة المستخدم التجريبية (demo UI)، يمكنك اختبار ميزات معالجة الصور من خلال هذه الواجهة بعد النشر. في لوحة تحكم AWS CloudFormation، حدد المكدس الخاص بك، انتقل إلى علامة التبويب "Outputs"، ابحث عن القيمة المقابلة لمفتاح DemoUrl، وانقر على الرابط لفتح واجهة العرض التوضيحي.
   3. يستخدم هذا الحل مكتبة `sharp` Node.js لمعالجة الصور بكفاءة. يمكنك تنزيل الكود المصدري من مستودع GitHub وتخصيصه حسب الحاجة.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. بعد اكتمال الإعدادات، انتظر حتى يتغير حالة النشر إلى `CREATE_COMPLETE`.

5. في إعدادات NocoBase، هناك عدة نقاط يجب ملاحظتها:
   1. `Thumbnail rule`: املأ المعلمات المتعلقة بمعالجة الصور، على سبيل المثال، `?width=100`. للحصول على التفاصيل، ارجع إلى [وثائق AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: املأ قيمة Outputs -> ApiEndpoint بعد النشر.
   3. `Full access URL style`: يجب تحديد **Ignore** (تجاهل) (لأن اسم الـ Bucket قد تم تعبئته بالفعل أثناء الإعداد، ولم يعد مطلوباً عند الوصول).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### مثال على الإعدادات

![](https://static-docs.nocobase.com/20250414152344959.png)


### Aliyun OSS

#### إنشاء Bucket

1. افتح لوحة تحكم OSS على https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. انقر على "Buckets" في القائمة اليسرى، ثم انقر على زر "Create Bucket" لبدء إنشاء Bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. املأ المعلومات المتعلقة بالـ Bucket، ثم انقر أخيراً على زر "Create".
    
    1. يجب أن يتناسب اسم الـ Bucket مع احتياجات عملك؛ يمكن أن يكون الاسم عشوائياً.
        
    2. اختر المنطقة (Region) الأقرب لمستخدميك.
        
    3. يمكن ترك الإعدادات الأخرى كافتراضية أو تكوينها بناءً على متطلباتك.    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### إعدادات CORS

1. انتقل إلى صفحة تفاصيل الـ Bucket الذي أنشأته في الخطوة السابقة.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. انقر على "Content Security -> CORS" في القائمة الوسطى.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. انقر على زر "Create Rule"، واملأ المحتوى ذي الصلة، ثم مرّر لأسفل وانقر على "OK". يمكنك الرجوع إلى لقطة الشاشة أدناه أو إجراء إعدادات أكثر تفصيلاً.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### الحصول على AccessKey و SecretAccessKey

1. انقر على "AccessKey" أسفل صورة ملفك الشخصي في الزاوية العلوية اليمنى.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. لأغراض العرض التوضيحي، نستخدم الحساب الرئيسي لإنشاء AccessKey. في بيئة الإنتاج، يُنصح باستخدام RAM لإنشائه. يمكنك الرجوع إلى https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair
    
3. انقر على زر "Create AccessKey". 

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. قم بإجراء التحقق من الحساب.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. احفظ Access key و Secret access key المعروضين في الصفحة.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### الحصول على المعلمات وإعدادها

1. AccessKey ID و AccessKey Secret هما القيمتان اللتان تم الحصول عليهما في الخطوة السابقة.
    
2. انتقل إلى صفحة تفاصيل الـ Bucket للحصول على اسم الـ Bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. مرّر لأسفل للحصول على المنطقة (Region) (الجزء ".aliyuncs.com" اللاحق غير مطلوب).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. احصل على عنوان نقطة النهاية (endpoint)، وأضف البادئة `https://` عند تعبئته في NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### إعدادات الصور المصغرة (اختياري)

هذا الإعداد اختياري ويجب استخدامه فقط عندما تحتاج إلى تحسين حجم أو تأثير معاينة الصور.

1. املأ المعلمات المتعلقة بـ `Thumbnail rule`. للحصول على إعدادات المعلمات المحددة، ارجع إلى [معلمات معالجة الصور](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images).

2. يمكن أن يظل `Full upload URL style` و `Full access URL style` متطابقين.

#### مثال على الإعدادات

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### إنشاء Bucket

1. انقر على قائمة Buckets على اليسار -> انقر على Create Bucket للدخول إلى صفحة الإنشاء.
2. بعد تعبئة اسم الـ Bucket، انقر على زر الحفظ.
#### الحصول على AccessKey و SecretAccessKey

1. انتقل إلى Access Keys -> انقر على زر Create access key للدخول إلى صفحة الإنشاء.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. انقر على زر الحفظ.

![](https://static-docs.nocobase.com/20250106111850639.png)

1. احفظ Access Key و Secret Key من النافذة المنبثقة لاستخدامهما في الإعدادات اللاحقة.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### إعدادات المعلمات

1. انتقل إلى صفحة NocoBase -> File manager.

2. انقر على زر Add new واختر S3 Pro.

3. املأ النموذج:
   - **AccessKey ID** و **AccessKey Secret** هما النص الذي تم حفظه في الخطوة السابقة.
   - **Region**: لا يحتوي MinIO المنشور ذاتياً على مفهوم المنطقة (Region)، لذا يمكن تكوينه كـ "auto".
   - **Endpoint**: املأ اسم النطاق أو عنوان IP لخدمة النشر الخاصة بك.
   - يجب تعيين `Full access URL style` إلى `Path-Style`.

#### مثال على الإعدادات

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

يمكنك الرجوع إلى إعدادات خدمات الملفات المذكورة أعلاه، فالمنطق متشابه.

#### مثال على الإعدادات

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

يمكنك الرجوع إلى إعدادات خدمات الملفات المذكورة أعلاه، فالمنطق متشابه.

#### مثال على الإعدادات

![](https://static-docs.nocobase.com/20250414154500264.png)