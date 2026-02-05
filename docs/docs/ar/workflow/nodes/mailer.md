---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::


# إرسال بريد إلكتروني

## مقدمة

تُستخدم هذه الإضافة لإرسال رسائل البريد الإلكتروني، وتدعم محتوى الرسائل بتنسيقات نصية و HTML.

## إنشاء عقدة

في واجهة إعدادات سير العمل، انقر على زر الزائد ("+") في المسار لإضافة عقدة "إرسال بريد إلكتروني":

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## إعدادات العقدة

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

يمكن لكل خيار استخدام المتغيرات من سياق سير العمل. بالنسبة للمعلومات الحساسة، يمكن استخدام المتغيرات العامة والمفاتيح السرية أيضًا.

## الأسئلة الشائعة

### قيود تكرار إرسال Gmail

عند إرسال بعض رسائل البريد الإلكتروني، قد تواجه الخطأ التالي:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

يحدث هذا لأن Gmail يفرض قيودًا على معدل إرسال الطلبات من النطاقات غير المحددة. عند نشر التطبيق، تحتاج إلى تكوين اسم مضيف الخادم ليكون هو النطاق الذي قمت بتكوينه في Gmail. على سبيل المثال، عند النشر باستخدام Docker:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # عيّنه إلى نطاق الإرسال الذي قمت بتكوينه
```

مرجع: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)