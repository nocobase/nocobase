:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## إضافة مُصادِق في NocoBase

أولاً، أضف مُصادِقًا جديدًا في NocoBase: إعدادات الإضافات - مصادقة المستخدم - إضافة - OIDC.

انسخ عنوان URL الخاص بالاستدعاء المرتد.

![](https://static-docs.nocobase.com/202412021504114.png)

## تسجيل التطبيق

افتح مركز إدارة Microsoft Entra وسجل تطبيقًا جديدًا.

![](https://static-docs.nocobase.com/202412021506837.png)

الصق عنوان URL الخاص بالاستدعاء المرتد الذي نسخته للتو هنا.

![](https://static-docs.nocobase.com/202412021520696.png)

## الحصول على المعلومات المطلوبة وتعبئتها

انقر للدخول إلى التطبيق الذي سجلته للتو، ثم انسخ **معرف التطبيق (العميل) (Application (client) ID)** و **معرف الدليل (المستأجر) (Directory (tenant) ID)** من صفحة النظرة العامة.

![](https://static-docs.nocobase.com/202412021522063.png)

انقر على `Certificates & secrets`، ثم أنشئ سر عميل جديدًا (Client secret)، وانسخ **القيمة (Value)**.

![](https://static-docs.nocobase.com/202412021522846.png)

فيما يلي مطابقة المعلومات من Microsoft Entra مع إعدادات المُصادِق في NocoBase:

| معلومات Microsoft Entra                 | حقل مُصادِق NocoBase                                                                                                                                                           |
| :-------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| معرف التطبيق (العميل) (Application (client) ID) | معرف العميل (Client ID)                                                                                                                                                        |
| أسرار العميل - القيمة (Client secrets - Value) | سر العميل (Client secret)                                                                                                                                                      |
| معرف الدليل (المستأجر) (Directory (tenant) ID) | المُصدر (Issuer):<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration، استبدل `{tenant}` بمعرف الدليل (المستأجر) (Directory (tenant) ID) المناسب. |