:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# مفتاح API

## مقدمة

## التثبيت

## تعليمات الاستخدام

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### إضافة مفتاح API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**ملاحظات**

- مفتاح API الذي تضيفه يخص المستخدم الحالي ويرث دور المستخدم الحالي.
- تأكد من إعداد متغير البيئة `APP_KEY` والحفاظ على سريته. إذا تغير `APP_KEY`، ستصبح جميع مفاتيح API المضافة سابقًا غير صالحة.

### كيفية إعداد APP_KEY

لإصدار Docker، عدّل ملف `docker-compose.yml`.

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

بالنسبة لتثبيت الكود المصدري أو `create-nocobase-app`، يمكنك تعديل `APP_KEY` مباشرة في ملف `.env`.

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```