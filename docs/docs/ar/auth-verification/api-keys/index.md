---
pkg: '@nocobase/plugin-api-keys'
---
# مفاتيح API

## مقدمة

## تعليمات الاستخدام

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### إضافة مفتاح API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**ملاحظات**
- يتم إنشاء مفتاح API للمستخدم الحالي ويرث دور المستخدم.
- يرجى التأكد من تهيئة متغير البيئة `APP_KEY` والحفاظ على سريته. إذا تغير `APP_KEY`، ستصبح جميع مفاتيح API المضافة غير صالحة.

### كيفية تهيئة APP_KEY

بالنسبة لإصدار Docker، قم بتعديل ملف docker-compose.yml

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

بالنسبة لتثبيت الكود المصدري أو create-nocobase-app، يمكنك تعديل APP_KEY مباشرة في ملف .env

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```
