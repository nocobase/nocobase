---
pkg: '@nocobase/plugin-logger'
---

:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/log-and-monitor/logger/index).
:::

# السجلات (Logging)

## مقدمة

تعد السجلات وسيلة هامة لمساعدتنا في تحديد مشكلات النظام. تشمل سجلات خادم NocoBase بشكل أساسي سجلات طلبات الواجهة وسجلات تشغيل النظام، وهي تدعم تكوين مستوى السجل، وإستراتيجية التدوير، والحجم، وتنسيق الطباعة، والمزيد. يقدم هذا المستند بشكل أساسي المحتوى المتعلق بسجلات خادم NocoBase، بالإضافة إلى كيفية استخدام ميزات حزم وتنزيل سجلات الخادم التي توفرها إضافة السجلات.

## تكوين السجلات

يمكن تكوين المعلمات المتعلقة بالسجلات مثل مستوى السجل، وطريقة الإخراج، وتنسيق الطباعة من خلال [متغيرات البيئة](/get-started/installation/env.md#logger_transport).

## تنسيقات السجلات

يدعم NocoBase تكوين 4 تنسيقات مختلفة للسجلات.

### `console`

التنسيق الافتراضي لبيئة التطوير، حيث يتم عرض الرسائل بألوان مميزة.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

التنسيق الافتراضي لبيئة الإنتاج.

```json
{
  "level": "info",
  "timestamp": "2023-12-26 22:04:56",
  "reqId": "7612ef42-58e8-4c35-bac2-2e6c9d8ec96e",
  "message": "response",
  "method": "POST",
  "path": "/api/authenticators:publicList",
  "res": { "status": 200 },
  "action": {
    "actionName": "publicList",
    "resourceName": "authenticators",
    "params": { "resourceName": "authenticators", "actionName": "publicList" }
  },
  "status": 200,
  "cost": 16
}
```

### `logfmt`

> https://brandur.org/logfmt.

```
level=info timestamp=2023-12-21 14:18:02 reqId=8b59a40d-68ee-4c97-8001-71a47a92805a
message=response method=POST path=/api/authenticators:publicList res={"status":200}
action={"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}
userId=undefined status=200 cost=14
```

### `delimiter`

مفصولة بالمحدد `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## مجلد السجلات

هيكل المجلدات الرئيسي لملفات سجلات NocoBase هو:

- `storage/logs` - مجلد إخراج السجلات
  - `main` - اسم التطبيق الرئيسي
    - `request_YYYY-MM-DD.log` - سجل الطلبات
    - `system_YYYY-MM-DD.log` - سجل النظام
    - `system_error_YYYY-MM-DD.log` - سجل أخطاء النظام
    - `sql_YYYY-MM-DD.log` - سجل تنفيذ SQL
    - ...
  - `sub-app` - اسم التطبيق الفرعي
    - `request_YYYY-MM-DD.log`
    - ...

## ملفات السجل

### سجل الطلبات (Request Log)

`request_YYYY-MM-DD.log` هو سجل طلبات واستجابات الواجهة.

| الحقل | الوصف |
| ------------- | ---------------------------------- |
| `level` | مستوى السجل |
| `timestamp` | وقت طباعة السجل `YYYY-MM-DD hh:mm:ss` |
| `message` | `request` أو `response` |
| `userId` | موجود في `response` فقط |
| `method` | طريقة الطلب |
| `path` | مسار الطلب |
| `req` / `res` | محتوى الطلب/الاستجابة |
| `action` | الموارد والمعلمات المطلوبة |
| `status` | رمز حالة الاستجابة |
| `cost` | مدة الطلب |
| `app` | اسم التطبيق الحالي |
| `reqId` | معرف الطلب |

:::info{title=ملاحظة}
سيتم نقل `reqId` إلى الواجهة الأمامية عبر رأس الاستجابة `X-Request-Id`.
:::

### سجل النظام (System Log)

`system_YYYY-MM-DD.log` هو سجل تشغيل النظام للتطبيقات، والبرمجيات الوسيطة، والإضافات، وما إلى ذلك. ستتم طباعة سجلات مستوى `error` بشكل منفصل في `system_error_YYYY-MM-DD.log`.

| الحقل | الوصف |
| ----------- | ---------------------------------- |
| `level` | مستوى السجل |
| `timestamp` | وقت طباعة السجل `YYYY-MM-DD hh:mm:ss` |
| `message` | رسالة السجل |
| `module` | الوحدة |
| `submodule` | الوحدة الفرعية |
| `method` | الطريقة المستدعاة |
| `meta` | معلومات أخرى ذات صلة، بتنسيق JSON |
| `app` | اسم التطبيق الحالي |
| `reqId` | معرف الطلب |

### سجل تنفيذ SQL

`sql_YYYY-MM-DD.log` هو سجل تنفيذ SQL لقاعدة البيانات. تقتصر جمل `INSERT INTO` على أول 2000 حرف فقط.

| الحقل | الوصف |
| ----------- | ---------------------------------- |
| `level` | مستوى السجل |
| `timestamp` | وقت طباعة السجل `YYYY-MM-DD hh:mm:ss` |
| `sql` | جملة SQL |
| `app` | اسم التطبيق الحالي |
| `reqId` | معرف الطلب |

## حزم وتنزيل السجلات

1. انتقل إلى صفحة إدارة السجلات.
2. اختر ملفات السجل التي ترغب في تنزيلها.
3. انقر فوق زر التنزيل (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## وثائق ذات صلة

- [تطوير الإضافات - الخادم - السجلات](/plugin-development/server/logger)
- [مرجع API - @nocobase/logger](/api/logger/logger)