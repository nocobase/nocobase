---
pkg: '@nocobase/plugin-file-previewer-office'
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::


# معاينة ملفات Office <Badge>v1.8.11+</Badge>

تُستخدم إضافة معاينة ملفات Office لمعاينة الملفات بصيغة Office، مثل Word و Excel و PowerPoint، مباشرةً ضمن تطبيق NocoBase.  
تعتمد هذه الإضافة على خدمة مايكروسوفت العامة عبر الإنترنت، والتي تتيح تضمين الملفات التي يمكن الوصول إليها عبر رابط URL عام في واجهة المعاينة، مما يمكّن المستخدمين من عرض هذه الملفات في المتصفح دون الحاجة إلى تنزيلها أو استخدام تطبيقات Office.

## دليل الاستخدام

بشكل افتراضي، تكون هذه الإضافة **غير مُفعّلة**. يمكن تفعيلها من مدير الإضافات، ولا تتطلب أي إعدادات إضافية.

![Plugin activation interface](https://static-docs.nocobase.com/20250731140048.png)

بعد رفع ملف Office (Word / Excel / PowerPoint) بنجاح في حقل الملفات بجدول البيانات، يمكنك النقر على أيقونة الملف أو الرابط المقابل لمعاينة محتواه في واجهة معاينة منبثقة أو مضمنة.

![Preview usage example](https://static-docs.nocobase.com/20250731143231.png)

## آلية العمل

تعتمد المعاينة المضمنة في هذه الإضافة على خدمة مايكروسوفت العامة عبر الإنترنت (Office Web Viewer)، وتتمثل العملية الرئيسية فيما يلي:

- يقوم الواجهة الأمامية (Frontend) بإنشاء رابط URL عام للملف الذي رفعه المستخدم (بما في ذلك روابط URL الموقعة من S3).
- تقوم الإضافة بتحميل معاينة الملف ضمن إطار iframe باستخدام العنوان التالي:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<public file URL>
  ```

- تطلب خدمة مايكروسوفت محتوى الملف من رابط URL هذا، ثم تقوم بمعالجته وعرضه، وتعيد صفحة قابلة للمعاينة.

## ملاحظات هامة

- بما أن هذه الإضافة تعتمد على خدمة مايكروسوفت عبر الإنترنت، يجب التأكد من أن اتصال الشبكة يعمل بشكل صحيح وأن خدمات مايكروسوفت متاحة.
- ستصل مايكروسوفت إلى رابط URL للملف الذي تقدمه، وقد يتم تخزين محتوى الملف مؤقتًا على خوادمها لغرض عرض صفحة المعاينة. هذا يثير بعض المخاوف المتعلقة بالخصوصية، وإذا كانت لديك تحفظات بشأن ذلك، يُنصح بعدم استخدام هذه الإضافة لتوفير ميزة المعاينة[^1].
- يجب أن يكون الملف المراد معاينته متاحًا عبر رابط URL عام. في العادة، يتم إنشاء روابط عامة للملفات التي تُرفع إلى NocoBase تلقائيًا (بما في ذلك روابط URL الموقعة التي تنشئها إضافة S3-Pro). ومع ذلك، إذا كانت الملفات تحتوي على قيود وصول أو مخزنة في شبكة داخلية، فلن تتمكن من معاينتها[^2].
- لا تدعم هذه الخدمة المصادقة عبر تسجيل الدخول أو الموارد المخزنة بشكل خاص. على سبيل المثال، لا يمكن استخدام ميزة المعاينة للملفات التي لا يمكن الوصول إليها إلا ضمن شبكة داخلية أو التي تتطلب تسجيل الدخول.
- بعد أن تقوم خدمة مايكروسوفت بجلب محتوى الملف، قد يبقى مخزنًا مؤقتًا لفترة قصيرة. حتى لو تم حذف الملف الأصلي، قد يظل محتوى المعاينة متاحًا لبعض الوقت.
- توجد قيود موصى بها لحجم الملفات: يُنصح ألا يتجاوز حجم ملفات Word و PowerPoint 10 ميجابايت، وملفات Excel 5 ميجابايت، لضمان استقرار المعاينة[^3].
- لا يوجد حاليًا بيان رسمي واضح بخصوص ترخيص الاستخدام التجاري لهذه الخدمة. يرجى تقييم المخاطر بنفسك عند استخدامها[^4].

## صيغ الملفات المدعومة

تدعم هذه الإضافة معاينة صيغ ملفات Office التالية فقط، ويتم تحديد ذلك بناءً على نوع MIME للملف:

- مستندات Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- جداول بيانات Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- عروض PowerPoint التقديمية:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation`

لن يتم تفعيل ميزة المعاينة لهذه الإضافة لملفات الصيغ الأخرى.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)