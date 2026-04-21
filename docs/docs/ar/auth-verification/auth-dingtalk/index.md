---
pkg: '@nocobase/plugin-auth-dingtalk'
---
# المصادقة: DingTalk

## مقدمة

تتيح إضافة المصادقة DingTalk للمستخدمين تسجيل الدخول إلى NocoBase باستخدام حسابات DingTalk الخاصة بهم.

## تفعيل الإضافة

![](https://static-docs.nocobase.com/202406120929356.png)

## طلب أذونات API في لوحة تحكم مطوري DingTalk

راجع <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">منصة DingTalk المفتوحة - تنفيذ تسجيل الدخول إلى مواقع الطرف الثالث</a> لإنشاء تطبيق.

انتقل إلى لوحة تحكم إدارة التطبيقات وفعّل "معلومات رقم الهاتف الشخصي" و"إذن قراءة المعلومات الشخصية لدفتر العناوين".

![](https://static-docs.nocobase.com/202406120006620.png)

## الحصول على بيانات الاعتماد من لوحة تحكم مطوري DingTalk

انسخ Client ID و Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## إضافة مصادقة DingTalk في NocoBase

انتقل إلى صفحة إدارة إضافة مصادقة المستخدم.

![](https://static-docs.nocobase.com/202406112348051.png)

إضافة - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### التهيئة

![](https://static-docs.nocobase.com/202406120016896.png)

- التسجيل التلقائي عند عدم وجود المستخدم - ما إذا كان سيتم إنشاء مستخدم جديد تلقائيًا عند عدم تطابق أي مستخدم موجود برقم الهاتف.
- Client ID و Client Secret - أدخل المعلومات المنسوخة في الخطوة السابقة.
- رابط إعادة التوجيه - رابط رد الاتصال، انسخه وانتقل إلى الخطوة التالية.

## تهيئة رابط رد الاتصال في لوحة تحكم مطوري DingTalk

الصق رابط رد الاتصال المنسوخ في لوحة تحكم مطوري DingTalk.

![](https://static-docs.nocobase.com/202406120012221.png)

## تسجيل الدخول

قم بزيارة صفحة تسجيل الدخول وانقر على الزر أسفل نموذج تسجيل الدخول لبدء تسجيل الدخول عبر طرف ثالث.

![](https://static-docs.nocobase.com/202406120014539.png)
