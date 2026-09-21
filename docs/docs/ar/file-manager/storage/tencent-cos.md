# Tencent Cloud COS

محرك تخزين يعتمد على Tencent Cloud COS. يجب تجهيز الحساب والصلاحيات اللازمة قبل الاستخدام.

## معلمات الإعداد

![مثال على إعداد محرك تخزين Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=ملاحظة}
يوضح هذا القسم المعلمات الخاصة بمحرك تخزين Tencent Cloud COS فقط. أما المعلمات العامة، فيُرجى الرجوع إلى [معلمات المحرك العامة](./index.md#general-engine-parameters).
:::

### المنطقة (Region)

أدخل منطقة تخزين COS، على سبيل المثال: `ap-chengdu`.

:::info{title=ملاحظة}
يمكنك عرض معلومات المنطقة الخاصة بالحاوية (Bucket) من خلال [لوحة تحكم Tencent Cloud COS](https://console.cloud.tencent.com/cos). يكفي استخدام بادئة المنطقة فقط (وليس اسم النطاق الكامل).
:::

### SecretId

أدخل معرّف مفتاح الوصول (SecretId) الخاص بك في Tencent Cloud.

### SecretKey

أدخل المفتاح السري (SecretKey) الخاص بمفتاح الوصول في Tencent Cloud.

### الحاوية (Bucket)

أدخل اسم حاوية COS، على سبيل المثال: `qing-cdn-1234189398`.