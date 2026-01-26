:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# تسجيل الدخول باستخدام Google

> https://developers.google.com/identity/openid-connect/openid-connect

## الحصول على بيانات اعتماد Google OAuth 2.0

[وحدة تحكم Google Cloud](https://console.cloud.google.com/apis/credentials) - إنشاء بيانات اعتماد - معرّف عميل OAuth

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

انتقل إلى واجهة الإعدادات واملأ عنوان URL لإعادة التوجيه المصرّح به. يمكن الحصول على عنوان URL لإعادة التوجيه عند إضافة مُصادِق جديد في NocoBase، وعادةً ما يكون `http(s)://host:port/api/oidc:redirect`. راجع قسم [دليل المستخدم - الإعدادات](../index.md#configuration).

![](https://static-docs.nocobase.com/24078bf2ec966a16334894cb3d9d126.png)

## إضافة مُصادِق جديد في NocoBase

إعدادات الإضافات - مصادقة المستخدم - إضافة - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

يمكنك إكمال إعداد المُصادِق بالرجوع إلى المعلمات الموضحة في [دليل المستخدم - الإعدادات](../index.md#configuration).