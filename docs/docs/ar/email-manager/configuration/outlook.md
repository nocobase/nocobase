---
pkg: "@nocobase/plugin-email-manager"
---

# إعداد Microsoft

### المتطلبات المسبقة

لكي يتمكن المستخدمون من دمج بريد Outlook في NocoBase، يجب نشر النظام على خادم يدعم الوصول إلى خدمات Microsoft، حيث سيقوم الخادم الخلفي باستدعاء واجهات Microsoft API.

### تسجيل الحساب

1. افتح الرابط التالي:  
   https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account

2. قم بتسجيل الدخول إلى حساب Microsoft الخاص بك

![](https://static-docs.nocobase.com/mail-1733818625779.png)

### إنشاء Tenant

1. افتح الرابط التالي وقم بتسجيل الدخول:  
   https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount

2. أدخل المعلومات الأساسية واحصل على رمز التحقق

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. أكمل إدخال بقية المعلومات ثم تابع

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. أدخل معلومات بطاقة الائتمان (يمكن إتمام هذه الخطوة لاحقًا)

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### الحصول على Client ID

1. انقر على القائمة العلوية واختر **Microsoft Entra ID**

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. من الجهة اليسرى اختر **App registrations**

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. انقر على **New registration**

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. أدخل المعلومات المطلوبة ثم قم بالإرسال

يمكن اختيار أي اسم للتطبيق، وحدد نوع الحساب كما هو موضح في الصورة، ويمكن ترك Redirect URI فارغًا مؤقتًا

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. قم بالحصول على Client ID

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### أذونات API

1. افتح قائمة **API permissions** من الجهة اليمنى

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. انقر على زر **Add a permission**

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. اختر **Microsoft Graph**

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. ابحث وأضف الأذونات التالية (كما هو موضح في الصورة):

   1. `"email"`
   2. `"offline_access"`
   3. `"IMAP.AccessAsUser.All"`
   4. `"SMTP.Send"`
   5. `"offline_access"`
   6. `"User.Read"` (مضاف بشكل افتراضي)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### الحصول على Client Secret

1. انقر على **Certificates & secrets** من الجهة اليسرى

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. انقر على زر **New client secret**

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. أدخل الوصف وحدد مدة الصلاحية ثم قم بالإضافة

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. قم بالحصول على Client Secret

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. انسخ كلًا من Client ID وClient Secret وأدخلهما في صفحة إعداد البريد الإلكتروني

![](https://static-docs.nocobase.com/mail-1733818630710.png)