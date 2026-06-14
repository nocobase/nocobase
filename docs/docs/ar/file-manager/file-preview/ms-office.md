---
pkg: '@nocobase/plugin-file-previewer-office'
---

# معاينة ملفات Office <Badge>v1.8.11+</Badge>

تتيح إضافة معاينة ملفات Office للمستخدمين معاينة ملفات بصيغ Office مثل Word وExcel وPowerPoint مباشرة داخل تطبيق NocoBase.  
تعتمد هذه الإضافة على خدمة مايكروسوفت العامة عبر الإنترنت لعرض محتوى الملف داخل واجهة معاينة، مما يتيح للمستخدمين عرض المستندات مباشرة في المتصفح دون الحاجة إلى تنزيلها أو استخدام تطبيقات Office.

## دليل الاستخدام

بشكل افتراضي، تكون هذه الإضافة **معطّلة**. يمكن تفعيلها من خلال مدير الإضافات ولا تتطلب أي إعدادات إضافية.

![واجهة تفعيل الإضافة](https://static-docs.nocobase.com/20250731140048.png)

بعد رفع ملف Office (Word / Excel / PowerPoint) بنجاح داخل حقل ملفات في جدول بيانات، يمكنك النقر على أيقونة الملف أو الرابط لمعاينة محتواه في نافذة منبثقة أو واجهة مدمجة.

![مثال على استخدام المعاينة](https://static-docs.nocobase.com/20250731143231.png)

## كيف تعمل

تستخدم هذه الإضافة خدمة مايكروسوفت العامة عبر الإنترنت (Office Web Viewer) لعرض المعاينات. سير العمل الأساسي كالتالي:

- يقوم الواجهة الأمامية بإنشاء رابط URL عام يمكن الوصول إليه للملف المرفوع (بما في ذلك الروابط الموقعة مثل تلك الخاصة بإضافة S3-Pro)؛
- تقوم الإضافة بعرض المعاينة داخل iframe باستخدام الصيغة التالية:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<public file URL>
  ```

- تقوم خدمة مايكروسوفت بجلب الملف من الرابط، ثم عرضه وإرجاع صفحة قابلة للمعاينة.

## ملاحظات

- نظرًا لأن هذه الإضافة تعتمد على خدمة مايكروسوفت عبر الإنترنت، تأكد من استقرار الاتصال بالإنترنت وإمكانية الوصول إلى خدمات مايكروسوفت.
- ستقوم مايكروسوفت بالوصول إلى رابط الملف الذي توفره، وقد يتم تخزين محتوى الملف مؤقتًا على خوادمها لأغراض العرض. قد يسبب ذلك بعض المخاوف المتعلقة بالخصوصية — إذا كان هذا الأمر مهمًا بالنسبة لك، يُنصح بعدم استخدام هذه الإضافة للملفات الحساسة[^1].
- يجب أن تكون الملفات متاحة عبر رابط URL عام حتى يمكن معاينتها. عادةً، الملفات المرفوعة إلى NocoBase تحتوي تلقائيًا على روابط عامة (بما في ذلك الروابط الموقعة من إضافة S3-Pro). ومع ذلك، إذا كانت صلاحيات الوصول مقيّدة أو كان الملف مخزنًا داخل شبكة داخلية، فلن تتمكن من معاينته[^2].
- هذه الخدمة لا تدعم المصادقة أو التخزين الخاص. على سبيل المثال، الملفات التي تتطلب تسجيل دخول أو المتاحة فقط داخل شبكة داخلية لن تعمل مع ميزة المعاينة.
- بعد أن تقوم مايكروسوفت بجلب الملف، قد يظل مخزنًا مؤقتًا لفترة قصيرة. حتى إذا تم حذف الملف الأصلي، قد تظل المعاينة متاحة لبعض الوقت.
- الحدود الموصى بها لحجم الملفات: يجب ألا تتجاوز ملفات Word وPowerPoint حجم 10MB، وملفات Excel حجم 5MB لضمان أداء موثوق للمعاينة[^3].
- لا يوجد تصريح رسمي واضح بخصوص الاستخدام التجاري لهذه الخدمة. يُرجى تقييم المخاطر قبل استخدامها في التطبيقات التجارية[^4].

## أنواع الملفات المدعومة

تدعم هذه الإضافة فقط معاينة صيغ ملفات Office التالية، بناءً على نوع MIME أو امتداد الملف:

- مستند Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) أو `application/msword` (`.doc`)
- جدول بيانات Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) أو `application/vnd.ms-excel` (`.xls`)
- عرض تقديمي PowerPoint:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) أو `application/vnd.ms-powerpoint` (`.ppt`)
- مستند OpenDocument:
  `application/vnd.oasis.opendocument.text` (`.odt`)

لن يتم معاينة أي صيغ ملفات أخرى باستخدام هذه الإضافة.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)