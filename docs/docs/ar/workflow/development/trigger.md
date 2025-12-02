:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# توسيع أنواع المشغلات

يجب تكوين كل سير عمل بمشغل محدد، والذي يعمل كنقطة دخول لبدء تنفيذ العملية.

يمثل نوع المشغل عادةً حدثًا بيئيًا محددًا للنظام. خلال دورة حياة تشغيل التطبيق، يمكن استخدام أي جزء يوفر أحداثًا قابلة للاشتراك لتعريف نوع المشغل. على سبيل المثال، استقبال الطلبات، عمليات المجموعة، المهام المجدولة، وما إلى ذلك.

يتم تسجيل أنواع المشغلات في جدول مشغلات الإضافة بناءً على معرف نصي. تتضمن إضافة سير العمل عدة مشغلات مدمجة:

- `'collection'`: يتم تشغيله بواسطة عمليات المجموعة؛
- `'schedule'`: يتم تشغيله بواسطة المهام المجدولة؛
- `'action'`: يتم تشغيله بواسطة أحداث ما بعد الإجراء؛

تتطلب أنواع المشغلات الموسعة ضمان أن تكون معرفاتها فريدة. يتم تسجيل تنفيذ الاشتراك/إلغاء الاشتراك للمشغل في جانب الخادم، بينما يتم تسجيل تنفيذ واجهة الإعدادات في جانب العميل.

## جانب الخادم

يجب أن يرث أي مشغل من الفئة الأساسية `Trigger` وأن يقوم بتنفيذ التابعين `on`/`off`، اللذين يُستخدمان على التوالي للاشتراك في أحداث بيئية محددة وإلغاء الاشتراك منها. في التابع `on`، تحتاج إلى استدعاء `this.workflow.trigger()` ضمن دالة رد الاتصال للحدث المحدد لتشغيل الحدث في النهاية. بالإضافة إلى ذلك، في التابع `off`، يجب عليك القيام بأعمال التنظيف المتعلقة بإلغاء الاشتراك.

حيث أن `this.workflow` هو نسخة إضافة سير العمل التي يتم تمريرها إلى مُنشئ الفئة الأساسية `Trigger`.

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.workflow.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

بعد ذلك، في الإضافة التي تقوم بتوسيع سير العمل، قم بتسجيل نسخة المشغل في محرك سير العمل:

```ts
import WorkflowPlugin from '@nocobase/plugin-workflow';

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    // register trigger
    workflowPlugin.registerTrigger('interval', MyTrigger);
  }
}
```

بعد بدء تشغيل الخادم وتحميله، يمكن إضافة مشغل نوع `'interval'` وتنفيذه.

## جانب العميل

يوفر جزء جانب العميل بشكل أساسي واجهة إعدادات بناءً على عناصر الإعدادات المطلوبة لنوع المشغل. يحتاج كل نوع مشغل أيضًا إلى تسجيل إعدادات النوع المقابلة له مع إضافة سير العمل.

على سبيل المثال، بالنسبة للمشغل الذي يتم تنفيذه بجدول زمني والمذكور أعلاه، قم بتعريف عنصر إعدادات وقت الفاصل الزمني المطلوب (`interval`) في نموذج واجهة الإعدادات:

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';
  // fields of trigger config
  fieldset = {
    interval: {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    },
  };
}
```

ثم، داخل الإضافة الموسعة، قم بتسجيل نوع المشغل هذا مع نسخة إضافة سير العمل:

```ts
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import MyTrigger from './MyTrigger';

export default class extends Plugin {
  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

بعد ذلك، سيظهر نوع المشغل الجديد في واجهة إعدادات سير العمل.

:::info{title=ملاحظة}
يجب أن يكون معرف نوع المشغل المسجل في جانب العميل متطابقًا مع المعرف في جانب الخادم، وإلا سيؤدي ذلك إلى حدوث أخطاء.
:::

لمزيد من التفاصيل حول تعريف أنواع المشغلات، يرجى الرجوع إلى قسم [مرجع واجهة برمجة تطبيقات سير العمل](./api#pluginregisterTrigger).