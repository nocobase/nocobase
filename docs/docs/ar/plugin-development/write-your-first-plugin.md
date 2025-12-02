:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# كتابة إضافتك الأولى

سيأخذك هذا الدليل خطوة بخطوة لإنشاء إضافة كتلة (block plugin) يمكن استخدامها في الصفحات، مما يساعدك على فهم البنية الأساسية وسير عمل تطوير إضافات NocoBase.

## المتطلبات المسبقة

قبل البدء، تأكد من تثبيت NocoBase بنجاح. إذا لم تكن قد قمت بذلك بعد، يمكنك الرجوع إلى أدلة التثبيت التالية:

- [التثبيت باستخدام create-nocobase-app](/get-started/installation/create-nocobase-app)
- [التثبيت من كود مصدر Git](/get-started/installation/git)

بعد اكتمال التثبيت، يمكنك البدء رسميًا في رحلة تطوير إضافاتك.

## الخطوة 1: إنشاء هيكل الإضافة عبر واجهة سطر الأوامر (CLI)

نفّذ الأمر التالي في الدليل الجذر للمستودع لإنشاء إضافة فارغة بسرعة:

```bash
yarn pm create @my-project/plugin-hello
```

بعد تنفيذ الأمر بنجاح، سيتم إنشاء الملفات الأساسية في الدليل `packages/plugins/@my-project/plugin-hello`. الهيكل الافتراضي هو كما يلي:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Default export server-side plugin
     ├─ client                   # Client-side code location
     │  ├─ index.tsx             # Default exported client-side plugin class
     │  ├─ plugin.tsx            # Plugin entry (extends @nocobase/client Plugin)
     │  ├─ models                # Optional: frontend models (such as flow nodes)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Server-side code location
     │  ├─ index.ts              # Default exported server-side plugin class
     │  ├─ plugin.ts             # Plugin entry (extends @nocobase/server Plugin)
     │  ├─ collections           # Optional: server-side collections
     │  ├─ migrations            # Optional: data migrations
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Optional: multi-language
        ├─ en-US.json
        └─ zh-CN.json
```

بعد الإنشاء، يمكنك الوصول إلى صفحة مدير الإضافات في متصفحك (العنوان الافتراضي: http://localhost:13000/admin/settings/plugin-manager) للتأكد مما إذا كانت الإضافة قد ظهرت في القائمة.

## الخطوة 2: تنفيذ كتلة عميل بسيطة

بعد ذلك، سنضيف نموذج كتلة مخصصًا إلى الإضافة لعرض رسالة ترحيب.

1. **إنشاء ملف نموذج كتلة جديد** `client/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **تسجيل نموذج الكتلة**. قم بتحرير `client/models/index.ts` لتصدير النموذج الجديد، ليتم تحميله بواسطة وقت تشغيل الواجهة الأمامية:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

بعد حفظ الكود، إذا كنت تقوم بتشغيل سكربت التطوير، فمن المفترض أن ترى سجلات التحديث السريع (hot-reload) في مخرجات الطرفية.

## الخطوة 3: تفعيل الإضافة وتجربتها

يمكنك تفعيل الإضافة عبر سطر الأوامر أو الواجهة الرسومية:

- **سطر الأوامر**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **واجهة الإدارة**: ادخل إلى مدير الإضافات، ابحث عن `@my-project/plugin-hello`، ثم انقر على "تفعيل".

بعد التفعيل، أنشئ صفحة جديدة من نوع "Modern page (v2)". عند إضافة الكتل، ستجد "Hello block". قم بإدراجها في الصفحة لترى محتوى الترحيب الذي كتبته للتو.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## الخطوة 4: البناء والتعبئة

عندما تكون مستعدًا لتوزيع الإضافة على بيئات أخرى، تحتاج أولاً إلى بنائها ثم تعبئتها:

```bash
yarn build @my-project/plugin-hello --tar
# أو نفّذ على خطوتين
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> **ملاحظة**: إذا تم إنشاء الإضافة في مستودع الكود المصدري، فإن عملية البناء الأولى ستؤدي إلى فحص شامل لأنواع الملفات في المستودع بأكمله، مما قد يستغرق وقتًا طويلاً. يُنصح بالتأكد من تثبيت التبعيات وأن المستودع في حالة قابلة للبناء.

بعد اكتمال البناء، يوجد ملف التعبئة افتراضيًا في `storage/tar/@my-project/plugin-hello.tar.gz`.

## الخطوة 5: الرفع إلى تطبيق NocoBase آخر

قم بالرفع والفك إلى دليل `./storage/plugins` الخاص بالتطبيق الهدف. للحصول على التفاصيل، راجع [تثبيت وترقية الإضافات](../get-started/install-upgrade-plugins.mdx).