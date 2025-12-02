---
pkg: "@nocobase/plugin-api-doc"
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::



# توثيق API



## مقدمة

تُنشئ هذه الإضافة توثيق NocoBase HTTP API بالاعتماد على Swagger.

## التثبيت

هذه إضافة مدمجة، لا تتطلب التثبيت. ما عليك سوى تفعيلها للبدء في استخدامها.

## تعليمات الاستخدام

### الوصول إلى صفحة توثيق API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### نظرة عامة على التوثيق

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- توثيق API الكلي: `/api/swagger:get`
- توثيق API الأساسي: `/api/swagger:get?ns=core`
- توثيق API لجميع الإضافات: `/api/swagger:get?ns=plugins`
- توثيق كل إضافة: `/api/swagger:get?ns=plugins/{name}`
- توثيق API للمجموعات المخصصة من قبل المستخدم: `/api/swagger:get?ns=collections`
- الموارد المحددة `${collection}` والموارد المرتبطة بها `${collection}.${association}`: `/api/swagger:get?ns=collections/{name}`

## دليل المطور

### كيفية كتابة توثيق Swagger للإضافات

أضف ملف `swagger/index.ts` في مجلد `src` الخاص بالإضافة بالمحتوى التالي:

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

للاطلاع على قواعد الكتابة التفصيلية، يرجى الرجوع إلى [توثيق Swagger الرسمي](https://swagger.io/docs/specification/about/).