# تسجيل الدخول باستخدام Google
> https://developers.google.com/identity/openid-connect/openid-connect

## الحصول على بيانات اعتماد Google OAuth 2.0

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) - إنشاء بيانات اعتماد - معرف عميل OAuth

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

انتقل إلى واجهة التهيئة وأدخل رابط إعادة التوجيه المعتمد. يمكن الحصول على رابط إعادة التوجيه عند إضافة أداة مصادقة في NocoBase، وعادةً يكون `http(s)://host:port/api/oidc:redirect`. راجع قسم [دليل المستخدم - التهيئة](../index.md#configuration).

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## إضافة أداة مصادقة جديدة في NocoBase

إعدادات الإضافات - مصادقة المستخدم - إضافة - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

ارجع إلى المعاملات المقدمة في [دليل المستخدم - التهيئة](../index.md#configuration) لإكمال تهيئة أداة المصادقة.
