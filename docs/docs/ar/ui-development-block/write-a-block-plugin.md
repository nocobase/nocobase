:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# إنشاء أول إضافة كتلة لك

قبل البدء، يُنصح بقراءة "[إنشاء أول إضافة لك](../plugin-development/write-your-first-plugin.md)" لمعرفة كيفية إنشاء إضافة أساسية بسرعة. بعد ذلك، سنقوم بتوسيعها بإضافة ميزة كتلة بسيطة.

## الخطوة 1: إنشاء ملف نموذج الكتلة

أنشئ ملفًا جديدًا في دليل الإضافة: `client/models/SimpleBlockModel.tsx`

## الخطوة 2: كتابة محتوى النموذج

عرّف وطبّق نموذج كتلة أساسي في الملف، بما في ذلك منطق العرض الخاص به:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## الخطوة 3: تسجيل نموذج الكتلة

قم بتصدير النموذج الذي تم إنشاؤه حديثًا في ملف `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## الخطوة 4: تفعيل وتجربة الكتلة

بعد تفعيل الإضافة، سترى خيار **Hello block** الجديد في القائمة المنسدلة "إضافة كتلة".

عرض توضيحي:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## الخطوة 5: إضافة إمكانية التكوين للكتلة

بعد ذلك، سنضيف وظائف قابلة للتكوين للكتلة عبر **سير العمل**، مما يتيح للمستخدمين تحرير محتوى الكتلة في الواجهة.

تابع تحرير ملف `SimpleBlockModel.tsx`:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

عرض توضيحي:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## ملخص

توضح هذه المقالة كيفية إنشاء إضافة كتلة بسيطة، بما في ذلك:

- كيفية تعريف وتطبيق نموذج كتلة
- كيفية تسجيل نموذج كتلة
- كيفية إضافة وظائف قابلة للتكوين عبر سير العمل

مرجع الكود المصدري الكامل: [مثال الكتلة البسيطة](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)