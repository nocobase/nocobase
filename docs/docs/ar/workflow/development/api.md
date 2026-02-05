:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# مرجع الواجهة البرمجية (API)

## جانب الخادم

تتوفر واجهات برمجة التطبيقات (APIs) ضمن بنية حزمة جانب الخادم كما هو موضح في الكود التالي:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

فئة إضافة سير العمل.

عادةً، أثناء تشغيل التطبيق، يمكنك استدعاء `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` في أي مكان يمكنك فيه الحصول على مثيل التطبيق `app` للحصول على مثيل إضافة سير العمل (يُشار إليه فيما يلي بـ `plugin`).

#### `registerTrigger()`

يوسع ويسجل نوعًا جديدًا من المشغلات.

**Signature**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parameters**

| المعلمة | النوع | الوصف |
| --------- | --------------------------- | ---------------- |
| `type` | `string` | معرف نوع المشغل |
| `trigger` | `typeof Trigger \| Trigger` | نوع المشغل أو مثيله |

**Example**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // trigger workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // listen some event to trigger workflow
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register trigger
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

يوسع ويسجل نوع عقدة جديد.

**Signature**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parameters**

| المعلمة | النوع | الوصف |
| ------------- | ----------------------------------- | -------------- |
| `type` | `string` | معرف نوع التعليمات |
| `instruction` | `typeof Instruction \| Instruction` | نوع التعليمات أو مثيلها |

**Example**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

يشغل سير عمل محددًا. يُستخدم بشكل أساسي في المشغلات المخصصة لتشغيل سير العمل المقابل عند الاستماع إلى حدث مخصص معين.

**Signature**

`trigger(workflow: Workflow, context: any)`

**Parameters**
| المعلمة | النوع | الوصف |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | كائن سير العمل المراد تشغيله |
| `context` | `object` | بيانات السياق المقدمة عند التشغيل |

:::info{title=تلميح}
`context` هو حاليًا عنصر مطلوب. إذا لم يتم توفيره، فلن يتم تشغيل سير العمل.
:::

**Example**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

يستأنف سير عمل متوقفًا باستخدام مهمة عقدة محددة.

- يمكن استئناف سير العمل الذي يكون في حالة الانتظار (`EXECUTION_STATUS.STARTED`) فقط.
- يمكن استئناف مهام العقدة التي تكون في حالة الانتظار (`JOB_STATUS.PENDING`) فقط.

**Signature**

`resume(job: JobModel)`

**Parameters**

| المعلمة | النوع | الوصف |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | كائن المهمة المحدث |

:::info{title=تلميح}
كائن المهمة الذي يتم تمريره هو عادةً كائن محدث، وعادةً ما يتم تحديث حالته (`status`) إلى قيمة غير `JOB_STATUS.PENDING`، وإلا فسيستمر في الانتظار.
:::

**Example**

للتفاصيل، راجع [الكود المصدري](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

الفئة الأساسية للمشغلات، تُستخدم لتوسيع أنواع المشغلات المخصصة.

| المعلمة | النوع | الوصف |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | الدالة الإنشائية |
| `on?` | `(workflow: WorkflowModel): void` | معالج الأحداث بعد تمكين سير العمل |
| `off?` | `(workflow: WorkflowModel): void` | معالج الأحداث بعد تعطيل سير العمل |

تُستخدم `on`/`off` لتسجيل/إلغاء تسجيل مستمعي الأحداث عند تمكين/تعطيل سير العمل. المعلمة الممررة هي مثيل سير العمل المقابل للمشغل، والذي يمكن معالجته وفقًا للتكوين. قد لا تحتاج بعض أنواع المشغلات التي تستمع بالفعل إلى الأحداث عالميًا إلى تنفيذ هاتين الطريقتين. على سبيل المثال، في المشغل المجدول، يمكنك تسجيل مؤقت في `on` وإلغاء تسجيله في `off`.

### `Instruction`

الفئة الأساسية لأنواع التعليمات، تُستخدم لتوسيع أنواع التعليمات المخصصة.

| المعلمة | النوع | الوصف |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | الدالة الإنشائية |
| `run` | `Runner` | منطق التنفيذ للدخول الأول إلى العقدة |
| `resume?` | `Runner` | منطق التنفيذ للدخول إلى العقدة بعد الاستئناف من الانقطاع |
| `getScope?` | `(node: FlowNodeModel, data: any, processor: Processor): any` | يوفر محتوى المتغير المحلي للفرع الذي تم إنشاؤه بواسطة العقدة المقابلة |

**Related Types**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

بالنسبة لـ `getScope`، يمكنك الرجوع إلى [تنفيذ عقدة التكرار](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83)، والذي يُستخدم لتوفير محتوى المتغير المحلي للفروع.

### `EXECUTION_STATUS`

جدول ثابت لحالات خطة تنفيذ سير العمل، يُستخدم لتحديد الحالة الحالية لخطة التنفيذ المقابلة.

| اسم الثابت | المعنى |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING` | في قائمة الانتظار |
| `EXECUTION_STATUS.STARTED` | قيد التنفيذ |
| `EXECUTION_STATUS.RESOLVED` | اكتمل بنجاح |
| `EXECUTION_STATUS.FAILED` | فشل |
| `EXECUTION_STATUS.ERROR` | خطأ في التنفيذ |
| `EXECUTION_STATUS.ABORTED` | تم الإجهاض |
| `EXECUTION_STATUS.CANCELED` | تم الإلغاء |
| `EXECUTION_STATUS.REJECTED` | تم الرفض |
| `EXECUTION_STATUS.RETRY_NEEDED` | لم يتم التنفيذ بنجاح، يلزم إعادة المحاولة |

باستثناء الحالات الثلاث الأولى، تمثل جميع الحالات الأخرى حالة فشل، ولكن يمكن استخدامها لوصف أسباب مختلفة للفشل.

### `JOB_STATUS`

جدول ثابت لحالات مهام عقدة سير العمل، يُستخدم لتحديد الحالة الحالية لمهمة العقدة المقابلة. تؤثر الحالة الناتجة عن العقدة أيضًا على حالة خطة التنفيذ بأكملها.

| اسم الثابت | المعنى |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING` | معلق: تم التنفيذ حتى هذه العقدة، لكن التعليمات تتطلب التعليق والانتظار |
| `JOB_STATUS.RESOLVED` | اكتمل بنجاح |
| `JOB_STATUS.FAILED` | فشل: لم يستوفِ تنفيذ هذه العقدة الشروط المكونة |
| `JOB_STATUS.ERROR` | خطأ: حدث خطأ غير معالج أثناء تنفيذ هذه العقدة |
| `JOB_STATUS.ABORTED` | تم الإجهاض: تم إنهاء تنفيذ هذه العقدة بواسطة منطق آخر بعد أن كانت في حالة انتظار |
| `JOB_STATUS.CANCELED` | تم الإلغاء: تم إلغاء تنفيذ هذه العقدة يدويًا بعد أن كانت في حالة انتظار |
| `JOB_STATUS.REJECTED` | تم الرفض: تم رفض متابعة هذه العقدة يدويًا بعد أن كانت في حالة انتظار |
| `JOB_STATUS.RETRY_NEEDED` | لم يتم التنفيذ بنجاح، يلزم إعادة المحاولة |

## جانب العميل

تتوفر واجهات برمجة التطبيقات (APIs) ضمن بنية حزمة جانب العميل كما هو موضح في الكود التالي:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

يسجل لوحة التكوين المقابلة لنوع المشغل.

**Signature**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parameters**

| المعلمة | النوع | الوصف |
| --------- | --------------------------- | ------------------------------------ |
| `type` | `string` | معرف نوع المشغل، متوافق مع المعرف المستخدم للتسجيل |
| `trigger` | `typeof Trigger \| Trigger` | نوع المشغل أو مثيله |

#### `registerInstruction()`

يسجل لوحة التكوين المقابلة لنوع العقدة.

**Signature**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parameters**

| المعلمة | النوع | الوصف |
| ------------- | ----------------------------------- | ---------------------------------- |
| `type` | `string` | معرف نوع العقدة، متوافق مع المعرف المستخدم للتسجيل |
| `instruction` | `typeof Instruction \| Instruction` | نوع العقدة أو مثيلها |

#### `registerInstructionGroup()`

يسجل مجموعة أنواع العقد. يوفر NocoBase أربع مجموعات افتراضية لأنواع العقد:

*   `'control'`: التحكم
*   `'collection'`: عمليات المجموعة
*   `'manual'`: المعالجة اليدوية
*   `'extended'`: الإضافات الأخرى

إذا كنت بحاجة إلى توسيع مجموعات أخرى، يمكنك استخدام هذه الطريقة لتسجيلها.

**Signature**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parameters**

| المعلمة | النوع | الوصف |
| --------- | ----------------- | ----------------------------- |
| `type` | `string` | معرف مجموعة العقدة، متوافق مع المعرف المستخدم للتسجيل |
| `group` | `{ label: string }` | معلومات المجموعة، تتضمن حاليًا العنوان فقط |

**Example**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

الفئة الأساسية للمشغلات، تُستخدم لتوسيع أنواع المشغلات المخصصة.

| المعلمة | النوع | الوصف |
| --------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `title` | `string` | اسم نوع المشغل |
| `fieldset` | `{ [key: string]: ISchema }` | مجموعة عناصر تكوين المشغل |
| `scope?` | `{ [key: string]: any }` | مجموعة الكائنات التي قد تُستخدم في مخطط عناصر التكوين |
| `components?` | `{ [key: string]: React.FC }` | مجموعة المكونات التي قد تُستخدم في مخطط عناصر التكوين |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | مُسترجع قيمة بيانات سياق المشغل |

- إذا لم يتم تعيين `useVariables`، فهذا يعني أن هذا النوع من المشغلات لا يوفر وظيفة استرداد القيمة، ولا يمكن تحديد بيانات سياق المشغل في عقد سير العمل.

### `Instruction`

الفئة الأساسية للتعليمات، تُستخدم لتوسيع أنواع العقد المخصصة.

| المعلمة | النوع | الوصف |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group` | `string` | معرف مجموعة نوع العقدة، الخيارات المتاحة حاليًا: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset` | `Record<string, ISchema>` | مجموعة عناصر تكوين العقدة |
| `scope?` | `Record<string, Function>` | مجموعة الكائنات التي قد تُستخدم في مخطط عناصر التكوين |
| `components?` | `Record<string, React.FC>` | مجموعة المكونات التي قد تُستخدم في مخطط عناصر التكوين |
| `Component?` | `React.FC` | مكون العرض المخصص للعقدة |
| `useVariables?` | `(node, options: UseVariableOptions) => VariableOption` | طريقة العقدة لتوفير خيارات متغيرات العقدة |
| `useScopeVariables?` | `(node, options?) => VariableOptions` | طريقة العقدة لتوفير خيارات المتغيرات المحلية للفرع |
| `useInitializers?` | `(node) => SchemaInitializerItemType` | طريقة العقدة لتوفير خيارات المُهيئات |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | طريقة تحديد ما إذا كانت العقدة متاحة |

**Related Types**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- إذا لم يتم تعيين `useVariables`، فهذا يعني أن نوع العقدة هذا لا يوفر وظيفة استرداد القيمة، ولا يمكن تحديد بيانات نتيجة هذا النوع من العقد في عقد سير العمل. إذا كانت قيمة النتيجة مفردة (غير قابلة للتحديد)، فيمكنك إرجاع محتوى ثابت يعبر عن المعلومات المقابلة (انظر: [الكود المصدري لعقدة الحساب](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). إذا كانت قابلة للتحديد (مثل خاصية في كائن)، فيمكنك تخصيص مخرج مكون التحديد المقابل (انظر: [الكود المصدري لعقدة إنشاء البيانات](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- يُعد `Component` مكون عرض مخصصًا للعقدة. عندما لا يكون العرض الافتراضي للعقدة كافيًا، يمكن استبداله بالكامل لتخصيص عرض العقدة. على سبيل المثال، إذا كنت بحاجة إلى توفير المزيد من أزرار الإجراءات أو التفاعلات الأخرى لعقدة البداية من نوع الفرع، فستحتاج إلى استخدام هذه الطريقة (انظر: [الكود المصدري للفرع المتوازي](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- يُستخدم `useInitializers` لتوفير طريقة لتهيئة الكتل. على سبيل المثال، في العقدة اليدوية، يمكنك تهيئة كتل المستخدم ذات الصلة بناءً على العقدة السابقة. إذا تم توفير هذه الطريقة، فستكون متاحة عند تهيئة الكتل في تكوين واجهة العقدة اليدوية (انظر: [الكود المصدري لعقدة إنشاء البيانات](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- يُستخدم `isAvailable` بشكل أساسي لتحديد ما إذا كانت العقدة يمكن استخدامها (إضافتها) في البيئة الحالية. تتضمن البيئة الحالية سير العمل الحالي، والعقد السابقة، وفهرس الفرع الحالي.