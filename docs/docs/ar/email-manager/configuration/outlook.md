---
pkg: "@nocobase/plugin-email-manager"
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::



# إعدادات مايكروسوفت

### المتطلبات الأساسية
للسماح للمستخدمين بربط صناديق بريد Outlook الخاصة بهم بـ NocoBase، يجب عليك نشر NocoBase على خادم يدعم الوصول إلى خدمات مايكروسوفت. سيقوم الواجهة الخلفية (backend) باستدعاء واجهات برمجة تطبيقات مايكروسوفت (Microsoft APIs).

### تسجيل حساب

1. انتقل إلى https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
2. سجل الدخول إلى حساب مايكروسوفت الخاص بك.

![](https://static-docs.nocobase.com/mail-1733818625779.png)

### إنشاء مستأجر

1. انتقل إلى https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount وسجل الدخول إلى حسابك.
2. املأ المعلومات الأساسية واحصل على رمز التحقق.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. املأ المعلومات الأخرى وتابع.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. املأ معلومات بطاقتك الائتمانية (يمكنك تخطي هذه الخطوة حاليًا).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### الحصول على معرف العميل (Client ID)

1. انقر على القائمة العلوية واختر "Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. اختر "App registrations" (تسجيلات التطبيقات) من القائمة اليسرى.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. انقر على "New registration" (تسجيل جديد) في الأعلى.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. املأ المعلومات وقدمها.

يمكن أن يكون الاسم أي شيء. بالنسبة لأنواع الحسابات (account types)، اختر الخيار الموضح في الصورة أدناه. يمكنك ترك "Redirect URI" (عنوان URI لإعادة التوجيه) فارغًا في الوقت الحالي.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. احصل على معرف العميل (Client ID).

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### تفويض واجهة برمجة التطبيقات (API Authorization)

1. افتح قائمة "API permissions" (أذونات واجهة برمجة التطبيقات) على اليسار.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. انقر على زر "Add a permission" (إضافة إذن).

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. انقر على "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. ابحث عن الأذونات التالية وأضفها. يجب أن تكون النتيجة النهائية كما هو موضح في الصورة أدناه.

    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"User.Read"` (افتراضيًا)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### الحصول على المفتاح السري (Secret)

1. انقر على "Certificates & secrets" (الشهادات والأسرار) على اليسار.

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. انقر على زر "New client secret" (مفتاح سري جديد للعميل).

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. املأ الوصف ووقت انتهاء الصلاحية، ثم انقر على "إضافة".

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. احصل على معرف المفتاح السري (Secret ID).

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. انسخ معرف العميل (Client ID) والمفتاح السري للعميل (Client secret) والصقهما في صفحة إعدادات البريد الإلكتروني.

![](https://static-docs.nocobase.com/mail-1733818630710.png)