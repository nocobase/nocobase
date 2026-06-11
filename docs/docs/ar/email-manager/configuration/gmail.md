---
pkg: "@nocobase/plugin-email-manager"
---

# إعداد Google

### المتطلبات المسبقة

لكي يتمكن المستخدمون من دمج Gmail الخاص بـ Google في NocoBase، يجب نشر النظام على خادم يدعم الوصول إلى خدمات Google، حيث سيقوم الخادم الخلفي باستدعاء واجهة Google API.

### تسجيل الحساب

1. افتح الرابط التالي للدخول إلى Google Cloud:  
   https://console.cloud.google.com/welcome

2. عند الدخول لأول مرة، يجب الموافقة على الشروط ذات الصلة

![](https://static-docs.nocobase.com/mail-1733818617807.png)

### إنشاء تطبيق

1. انقر على "Select a project" في الأعلى

![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. انقر على زر "NEW PROJECT" في النافذة المنبثقة

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. قم بإدخال معلومات المشروع

![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. بعد إنشاء المشروع، قم بتحديده

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### تفعيل Gmail API

1. انقر على زر "APIs & Services"

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. الدخول إلى لوحة APIs & Services

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. ابحث عن **mail**

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. انقر على زر **ENABLE** لتفعيل Gmail API

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### إعداد شاشة موافقة OAuth

1. انقر على قائمة "OAuth consent screen" في الجهة اليسرى

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. اختر **External**

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. أدخل معلومات المشروع (سيتم عرضها في صفحة التفويض لاحقًا) ثم انقر على حفظ

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. أدخل معلومات التواصل الخاصة بالمطور ثم انقر على متابعة

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. انقر على متابعة

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. أضف مستخدمين للاختبار قبل نشر التطبيق

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. انقر على متابعة

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. راجع المعلومات ثم عد إلى لوحة التحكم

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### إنشاء بيانات الاعتماد (Credentials)

1. انقر على قائمة **Credentials** في الجهة اليسرى

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. انقر على زر "CREATE CREDENTIALS" واختر "OAuth client ID"

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. اختر "Web application"

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. أدخل معلومات التطبيق

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. أدخل النطاق (Domain) الذي سيتم نشر التطبيق عليه

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. أضف عنوان إعادة التوجيه (Callback)، ويجب أن يكون بالشكل التالي:  
   `domain + "/admin/settings/mail/oauth2"`  
   مثال:  
   `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. انقر على إنشاء لعرض معلومات OAuth

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. انسخ Client ID وClient Secret وأدخلها في صفحة إعداد البريد الإلكتروني

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. انقر على حفظ لإكمال الإعداد

### نشر التطبيق

بعد إتمام الخطوات السابقة واختبار تسجيل الدخول وإرسال البريد، يمكن المتابعة إلى نشر التطبيق.

1. انقر على قائمة "OAuth consent screen"

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. انقر على "EDIT APP" ثم "SAVE AND CONTINUE"

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. انقر على "ADD OR REMOVE SCOPES" لاختيار صلاحيات المستخدم

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. ابحث عن "Gmail API" وحدده (تأكد أن القيمة هي "https://mail.google.com/")

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. انقر على زر **UPDATE** للحفظ

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. انقر على "SAVE AND CONTINUE" في كل صفحة، ثم "BACK TO DASHBOARD"

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. انقر على زر **PUBLISH APP** ثم على **CONFIRM**

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. ستظهر حالة النشر "In production"

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. انقر على "PREPARE FOR VERIFICATION" وأدخل المعلومات المطلوبة

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. أكمل إدخال البيانات

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. انقر على "SAVE AND CONTINUE"

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. انقر على "SUBMIT FOR VERIFICATION"

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. انتظر نتيجة المراجعة

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. في حال لم تتم الموافقة بعد، يمكن استخدام الرابط غير الآمن لتسجيل الدخول

![](https://static-docs.nocobase.com/mail-1735633689645.png)