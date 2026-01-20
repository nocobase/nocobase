:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# آلية التفاعلية: Observable

:::info
آلية التفاعلية Observable في NocoBase تشبه في جوهرها [MobX](https://mobx.js.org/README.html). يعتمد التنفيذ الأساسي الحالي على [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive)، وتتوافق بنيته ومفاهيمه بشكل كبير مع [MobX](https://mobx.js.org/README.html)، ولم يتم استخدام [MobX](https://mobx.js.org/README.html) مباشرة لأسباب تاريخية فقط.
:::

في NocoBase 2.0، تنتشر كائنات `Observable` التفاعلية في كل مكان. إنها جوهر تدفق البيانات الأساسي واستجابة واجهة المستخدم، وتُستخدم على نطاق واسع في مكونات مثل FlowContext و FlowModel و FlowStep.

## لماذا نختار Observable؟

اختارت NocoBase آلية Observable بدلاً من حلول إدارة الحالة الأخرى مثل Redux و Recoil و Zustand و Jotai، وذلك للأسباب الرئيسية التالية:

-   **مرونة فائقة**: يمكن لـ Observable أن يجعل أي كائن أو مصفوفة أو Map أو Set، وما إلى ذلك، تفاعليًا. يدعم بشكل طبيعي التداخل العميق والهياكل الديناميكية، مما يجعله مناسبًا جدًا لنماذج الأعمال المعقدة.
-   **غير تدخلي**: يمكنك التلاعب بالكائن الأصلي مباشرةً، دون الحاجة إلى تعريف إجراءات (actions) أو مخفضات (reducers) أو مخازن (stores) إضافية، مما يوفر تجربة تطوير ممتازة.
-   **تتبع التبعيات التلقائي**: بمجرد تغليف المكون بـ `observer`، يتتبع المكون تلقائيًا خصائص Observable التي يستخدمها. عند تغيير البيانات، يتم تحديث واجهة المستخدم تلقائيًا، دون الحاجة إلى إدارة التبعيات يدويًا.
-   **مناسب لسيناريوهات غير React**: لا تنطبق آلية التفاعلية Observable على React فحسب، بل يمكن دمجها أيضًا مع أطر عمل أخرى، لتلبية مجموعة أوسع من احتياجات البيانات التفاعلية.

## لماذا نستخدم observer؟

يستمع `observer` للتغييرات في كائنات Observable، ويقوم تلقائيًا بتشغيل تحديثات مكونات React عند تغيير البيانات. هذا يحافظ على مزامنة واجهة المستخدم الخاصة بك مع بياناتك، دون الحاجة إلى استدعاء `setState` يدويًا أو طرق تحديث أخرى.

## الاستخدام الأساسي

```tsx
import React from 'react';
import { Input } from 'antd';
import { observer, observable } from '@nocobase/flow-engine';

const obs = observable.deep({
  value: 'aa'
});

const MyComponent = observer(() => {
  return (
    <div>
      <Input
        defaultValue={obs.value}
        onChange={(e) => {
          obs.value = e.target.value;
        }}
      />
      <div>{obs.value}</div>
    </div>
  );
});

export default MyComponent;
```

لمزيد من المعلومات حول الاستخدام التفاعلي، يرجى الرجوع إلى وثائق [@formily/reactive](https://reactive.formilyjs.org/).