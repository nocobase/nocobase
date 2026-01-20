---
pkg: "@nocobase/إضافة-إدارة-البريد-الإلكتروني"
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::


# إعدادات جوجل

### المتطلبات الأساسية

لتمكين المستخدمين من ربط حسابات بريد جوجل الخاصة بهم بـ NocoBase، يجب نشر NocoBase على خادم يدعم الوصول إلى خدمات جوجل، حيث ستقوم الواجهة الخلفية (backend) باستدعاء Google API.
    
### تسجيل حساب

1. افتح https://console.cloud.google.com/welcome للانتقال إلى Google Cloud.  
2. عند دخولك للمرة الأولى، ستحتاج إلى الموافقة على الشروط والأحكام ذات الصلة.
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### إنشاء تطبيق

1. انقر على "Select a project" في الأعلى.
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. انقر على زر "NEW PROJECT" في النافذة المنبثقة.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. املأ معلومات المشروع.
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. بعد إنشاء المشروع، قم بتحديده.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### تمكين Gmail API

1. انقر على زر "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. انتقل إلى لوحة تحكم APIs & Services.

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. ابحث عن "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. انقر على زر "ENABLE" لتمكين Gmail API.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### تهيئة شاشة موافقة OAuth

1. انقر على قائمة "OAuth consent screen" على اليسار.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. اختر "External".

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. املأ معلومات المشروع (ستظهر هذه المعلومات في صفحة التفويض لاحقًا) ثم انقر على حفظ.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. املأ معلومات الاتصال بالمطور (Developer contact information) وانقر على متابعة.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. انقر على متابعة.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. أضف مستخدمين اختباريين للاختبار قبل نشر التطبيق.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. انقر على متابعة.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. راجع معلومات الملخص ثم عد إلى لوحة التحكم.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### إنشاء بيانات الاعتماد (Credentials)

1. انقر على قائمة "Credentials" على اليسار.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. انقر على زر "CREATE CREDENTIALS" واختر "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. اختر "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. املأ معلومات التطبيق.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. أدخل نطاق النشر النهائي للمشروع (المثال هنا هو عنوان اختبار NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. أضف عنوان URI لإعادة التوجيه المعتمد. يجب أن يكون على الشكل التالي: `النطاق + "/admin/settings/mail/oauth2"`. مثال: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. انقر على إنشاء لعرض معلومات OAuth.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. انسخ كلاً من Client ID و Client secret والصقهما في صفحة إعدادات البريد الإلكتروني.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. انقر على حفظ لإكمال الإعدادات.

### نشر التطبيق

بعد إكمال العملية المذكورة أعلاه واختبار الميزات مثل تسجيل دخول المستخدم التجريبي وتفويض إرسال البريد الإلكتروني، يمكنك نشر التطبيق.

1. انقر على قائمة "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. انقر على زر "EDIT APP"، ثم انقر على زر "SAVE AND CONTINUE" في الأسفل.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. انقر على زر "ADD OR REMOVE SCOPES" لتحديد نطاقات أذونات المستخدم.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. ابحث عن "Gmail API"، ثم حدد "Gmail API" (تأكد أن قيمة النطاق (Scope) هي "https://mail.google.com/" لـ Gmail API).

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. انقر على زر "UPDATE" في الأسفل للحفظ.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. انقر على زر "SAVE AND CONTINUE" في أسفل كل صفحة، وأخيرًا انقر على زر "BACK TO DASHBOARD" للعودة إلى صفحة لوحة التحكم.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. بعد النقر على زر "PUBLISH APP"، ستظهر صفحة تأكيد النشر، والتي تسرد المعلومات المطلوبة للنشر. ثم انقر على زر "CONFIRM".

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. عد إلى صفحة وحدة التحكم، وسترى أن حالة النشر هي "In production".

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. انقر على زر "PREPARE FOR VERIFICATION"، املأ المعلومات المطلوبة، ثم انقر على زر "SAVE AND CONTINUE" (البيانات في الصورة هي لأغراض توضيحية فقط).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. استمر في ملء المعلومات الضرورية ذات الصلة (البيانات في الصورة هي لأغراض توضيحية فقط).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. انقر على زر "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. انقر على زر "SUBMIT FOR VERIFICATION" لتقديم طلب التحقق (Verification).

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. انتظر نتيجة الموافقة.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. في حال لم تتم الموافقة بعد، يمكن للمستخدمين النقر على الرابط غير الآمن (unsafe link) لتفويض وتسجيل الدخول.
