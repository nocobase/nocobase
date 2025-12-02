:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# Google Workspace

## تعيين Google كمزود هوية (IdP)

[وحدة تحكم مشرف Google](https://admin.google.com/) - التطبيقات - تطبيقات الويب والجوال

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

بعد إعداد التطبيق، انسخ **عنوان URL لتسجيل الدخول الموحد (SSO)** و**معرف الكيان (Entity ID)** و**الشهادة (Certificate)**.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## إضافة مُصادِق جديد في NocoBase

إعدادات الإضافة - مصادقة المستخدم - إضافة - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

أدخل المعلومات التي نسختها للتو، على النحو التالي:

-   `SSO URL`: عنوان URL لتسجيل الدخول الموحد (SSO)
-   `Public Certificate`: الشهادة العامة
-   `idP Issuer`: معرف الكيان (Entity ID)
-   `http`: حدد هذا الخيار إذا كنت تختبر محليًا باستخدام http

ثم انسخ `SP Issuer/EntityID` و`ACS URL` من قسم الاستخدام.

## ملء معلومات مزود الخدمة (SP) في Google

ارجع إلى وحدة تحكم Google، وفي صفحة **تفاصيل مزود الخدمة (Service Provider Details)**، أدخل عنوان URL لـ ACS ومعرف الكيان اللذين نسختهما سابقًا، وحدد مربع **الاستجابة الموقعة (Signed Response)**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84df4a5ebc72384317172191.png)

تحت قسم **تعيين السمات (Attribute Mapping)**، أضف تعيينات للسمات المقابلة.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)