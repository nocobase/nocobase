# Microsoft Entra ID
> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## إضافة أداة مصادقة في NocoBase

أولاً، أضف أداة مصادقة جديدة في NocoBase: إعدادات الإضافات - مصادقة المستخدم - إضافة - OIDC.

انسخ رابط رد الاتصال.

![](https://static-docs.nocobase.com/202412021504114.png)

## تسجيل التطبيق

افتح مركز إدارة Microsoft Entra وسجّل تطبيقًا جديدًا.

![](https://static-docs.nocobase.com/202412021506837.png)

الصق رابط رد الاتصال الذي نسخته للتو هنا.

![](https://static-docs.nocobase.com/202412021520696.png)

## الحصول على المعلومات المناسبة وملؤها

انقر على التطبيق الذي سجلته للتو وانسخ **معرف التطبيق (العميل)** و**معرف الدليل (المستأجر)** من صفحة النظرة العامة.

![](https://static-docs.nocobase.com/202412021522063.png)

انقر على `الشهادات والأسرار`، أنشئ سر عميل جديد، وانسخ **القيمة**.

![](https://static-docs.nocobase.com/202412021522846.png)

التعيين بين معلومات Microsoft Entra وتهيئة أداة المصادقة في NocoBase كما يلي:

| معلومات Microsoft Entra | حقل أداة المصادقة في NocoBase |
| ----------------------- | ----------------------------- |
| معرف التطبيق (العميل) | Client ID |
| أسرار العميل - القيمة | Client Secret |
| معرف الدليل (المستأجر) | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration، استبدل `{tenant}` بمعرف الدليل (المستأجر) |
