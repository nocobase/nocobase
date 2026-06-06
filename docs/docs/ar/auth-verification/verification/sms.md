---
pkg: '@nocobase/plugin-verification'
---
# التحقق: SMS

## مقدمة

رمز التحقق عبر SMS هو نوع تحقق مدمج يُستخدم لتوليد كلمة مرور ديناميكية لمرة واحدة (OTP) وإرسالها إلى المستخدم عبر SMS.

## إضافة أداة تحقق SMS

انتقل إلى صفحة إدارة التحقق.

![](https://static-docs.nocobase.com/202502271726791.png)

إضافة - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## تهيئة المسؤول

![](https://static-docs.nocobase.com/202502271727711.png)

حاليًا، مزودو خدمة SMS المدعومون هم:
- <a href="https://www.aliyun.com/product/sms" target="_blank">Aliyun SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

عند تهيئة قالب SMS في لوحة تحكم المسؤول لمزود الخدمة، تحتاج إلى حجز معامل لرمز التحقق.

- مثال تهيئة Aliyun: `رمز التحقق الخاص بك هو: ${code}`
- مثال تهيئة Tencent Cloud: `رمز التحقق الخاص بك هو: {1}`

يمكن للمطورين أيضًا توسيع دعم مزودي خدمة SMS الآخرين في شكل إضافات. راجع: [توسيع مزودي خدمة SMS](./dev/sms-type)

## ربط المستخدم

بعد إضافة أداة التحقق، يمكن للمستخدمين ربط رقم هاتف في إدارة التحقق الشخصية.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

بمجرد نجاح الربط، يمكن إجراء التحقق من الهوية في أي سيناريو يستخدم أداة التحقق هذه.

![](https://static-docs.nocobase.com/202502271739607.png)

## إلغاء ربط المستخدم

يتطلب إلغاء ربط رقم الهاتف التحقق من خلال طريقة ربط موجودة.

![](https://static-docs.nocobase.com/202502282103205.png)
