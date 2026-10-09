---

## pkg: "@nocobase/plugin-wecom"

# مزامنة بيانات المستخدم من WeChat Work

---

## مقدمة

تدعم إضافة **WeChat Work** مزامنة بيانات المستخدمين والأقسام من منصة WeChat Work.

---

## إنشاء وتكوين تطبيق مخصص في WeChat Work

أولاً، يجب إنشاء تطبيق مخصص في لوحة إدارة WeChat Work والحصول على:

* **Corp ID**
* **AgentId**
* **Secret**

راجع: [مصادقة المستخدم - WeChat Work](/auth-verification/auth-wecom/).

---

## إضافة مصدر بيانات المزامنة في NocoBase

اذهب إلى **Users & Permissions → Sync → Add**، ثم أدخل المعلومات التي حصلت عليها.

![](https://static-docs.nocobase.com/202412041251867.png)

---

## إعداد مزامنة جهات الاتصال (Contacts Sync)

اذهب إلى لوحة إدارة WeChat Work → **Security and Management → Management Tools**، ثم اختر **Contacts Sync**.

![](https://static-docs.nocobase.com/202412041249958.png)

قم بالإعداد كما هو موضح في الصورة، ثم قم بتحديد **عنوان IP الموثوق به للشركة**.

![](https://static-docs.nocobase.com/202412041250776.png)

الآن يمكنك بدء عملية مزامنة بيانات المستخدمين.

---

## إعداد خادم استقبال الأحداث (Event Receiving Server)

إذا أردت أن يتم مزامنة التغييرات في بيانات المستخدمين والأقسام من جهة WeChat Work بشكل فوري إلى NocoBase، يمكنك إعداد ذلك عبر الخطوات التالية.

بعد إدخال معلومات الإعداد السابقة، قم بنسخ رابط إشعارات جهات الاتصال (callback URL).

![](https://static-docs.nocobase.com/202412041256547.png)

ثم قم بإضافته في إعدادات WeChat Work، واحصل على:

* Token
* EncodingAESKey

وبذلك يتم إكمال إعداد مصدر بيانات مزامنة المستخدمين في NocoBase.

![](https://static-docs.nocobase.com/202412041257947.png)
