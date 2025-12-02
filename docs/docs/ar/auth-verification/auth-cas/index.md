---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::



# المصادقة: CAS

## مقدمة

تتبع إضافة المصادقة: CAS معيار بروتوكول CAS (Central Authentication Service)، مما يتيح للمستخدمين تسجيل الدخول إلى NocoBase باستخدام حسابات مقدمة من موفري خدمة مصادقة الهوية الخارجيين (IdP).

## التثبيت

## دليل المستخدم

### تفعيل الإضافة

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### إضافة مصادقة CAS

انتقل إلى صفحة إدارة مصادقة المستخدم

http://localhost:13000/admin/settings/auth/authenticators

أضف طريقة مصادقة CAS

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

قم بتكوين CAS وتفعيله

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### زيارة صفحة تسجيل الدخول

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)