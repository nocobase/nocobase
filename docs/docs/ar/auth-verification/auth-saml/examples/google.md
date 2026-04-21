# Google Workspace

## إعداد Google كموفر هوية (IdP)

[لوحة تحكم Google الإدارية](https://admin.google.com/) - التطبيقات - تطبيقات الويب والجوال

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

بعد إعداد التطبيق، انسخ **SSO URL** و**Entity ID** و**Certificate**.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## إضافة أداة مصادقة جديدة في NocoBase

إعدادات الإضافات - مصادقة المستخدم - إضافة - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

أدخل المعلومات المنسوخة على التوالي:
- SSO URL: SSO URL
- الشهادة العامة: Certificate
- idP Issuer: Entity ID
- http: حدد إذا كنت تختبر محليًا باستخدام http

ثم انسخ SP Issuer/EntityID و ACS URL من قسم الاستخدام.

## إدخال معلومات SP في Google

ارجع إلى لوحة تحكم Google، في صفحة **تفاصيل مزود الخدمة**، أدخل ACS URL ومعرف الكيان المنسوخين مسبقًا، وحدد **Signed Response**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

تحت **تعيين السمات**، أضف تعيينات للسمات المقابلة.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)
