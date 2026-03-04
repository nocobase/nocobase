---
title: نقاط توسيع إضافة RunJS (توثيق ctx / القصاصات البرمجية / تخطيط المشهد)
---

:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/flow-engine/runjs-extension-points).
:::

# نقاط توسيع إضافة RunJS (توثيق ctx / القصاصات البرمجية / تخطيط المشهد)

عندما تقوم إضافة (Plugin) بإضافة أو توسيع قدرات RunJS، يُنصح بتسجيل "تخطيط السياق / توثيق `ctx` / كود الأمثلة" عبر **نقاط التوسيع الرسمية**، لضمان:

- تمكين CodeEditor من توفير الإكمال التلقائي لـ `ctx.xxx.yyy`.
- حصول البرمجة بالذكاء الاصطناعي (AI coding) على مرجع API مهيكل لـ `ctx` مع أمثلة.

يقدم هذا الفصل نقطتي توسيع:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

تُستخدم لتسجيل "مساهمات" (contributions) RunJS، وتشمل الاستخدامات النموذجية:

- إضافة/تجاوز تخطيطات `RunJSContextRegistry` (من `modelClass` إلى `RunJSContext` بما في ذلك `scenes`).
- توسيع `RunJSDocMeta` (شروحات/أمثلة/قوالب الإكمال لـ API الخاص بـ `ctx`) لـ `FlowRunJSContext` أو RunJSContext مخصص.

### وصف السلوك

- تُنفذ المساهمات بشكل موحد خلال مرحلة `setupRunJSContexts()`.
- إذا اكتمل `setupRunJSContexts()` بالفعل، **سيتم تنفيذ التسجيلات المتأخرة فوراً** (دون الحاجة لإعادة تشغيل الإعداد).
- يتم تنفيذ كل مساهمة **مرة واحدة فقط كحد أقصى** لكل إصدار `RunJSVersion`.

### مثال: إضافة سياق نموذج (Model Context) قابل للكتابة بلغة JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) توثيق ctx/الإكمال (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS context',
    properties: {
      myPlugin: {
        description: 'My plugin namespace',
        detail: 'object',
        properties: {
          hello: {
            description: 'Say hello',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) تخطيط model -> context (يؤثر المشهد scene على إكمال المحرر/تصفية القصاصات snippets)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

تُستخدم لتسجيل قصاصات كود برمجية (snippets) لـ RunJS، وتُستخدم في:

- إكمال القصاصات في CodeEditor.
- توفير أمثلة/مواد مرجعية للبرمجة بالذكاء الاصطناعي (يمكن تصفيتها حسب المشهد/الإصدار/اللغة).

### تسمية المرجع (ref) الموصى بها

يُنصح باستخدام: `plugin/<pluginName>/<topic>`، على سبيل المثال:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

تجنب التعارض مع مساحات الأسماء `global/*` أو `scene/*` الخاصة بالنواة (core).

### استراتيجية التعارض

- بشكل افتراضي، لا يتم تجاوز مدخلات `ref` الموجودة (تُرجع `false` دون رمي خطأ).
- للتجاوز صراحةً، قم بتمرير `{ override: true }`.

### مثال: تسجيل قصاصة برمجية (Snippet)

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hello (My Plugin)',
    description: 'Minimal example for my plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// My plugin snippet
ctx.message.success('Hello from plugin');
`,
  },
}));
```

## 3. أفضل الممارسات

- **صيانة التوثيق والقصاصات بشكل طبقي**:
  - `RunJSDocMeta`: الوصف/قوالب الإكمال (قصيرة ومهيكلة).
  - snippets: أمثلة طويلة (قابلة لإعادة الاستخدام، قابلة للتصفية حسب المشهد/الإصدار).
- **تجنب طول المطالبة (Prompt)**: يجب ألا تكون الأمثلة كثيرة جداً؛ الأولوية لـ "أصغر قالب قابل للتشغيل".
- **أولوية المشهد**: إذا كان كود JS الخاص بك يعمل بشكل أساسي في مشاهد مثل النماذج أو الجداول، يرجى التأكد من ملء حقل `scenes` بشكل صحيح لتحسين صلة الإكمال والأمثلة.

## 4. إخفاء الإكمال بناءً على ctx الفعلي: `hidden(ctx)`

بعض واجهات برمجة التطبيقات (APIs) في `ctx` تعتمد بشكل كبير على السياق (على سبيل المثال، `ctx.popup` متاح فقط عند فتح نافذة منبثقة أو درج). عندما ترغب في إخفاء هذه الواجهات غير المتاحة أثناء الإكمال، يمكنك تعريف `hidden(ctx)` للمدخل المقابل في `RunJSDocMeta`:

- إرجاع `true`: يخفي العقدة الحالية وشجرتها الفرعية.
- إرجاع `string[]`: يخفي مسارات فرعية محددة تحت العقدة الحالية (يدعم إرجاع مسارات متعددة؛ المسارات نسبية؛ يتم إخفاء الأشجار الفرعية بناءً على مطابقة البادئة).

يدعم `hidden(ctx)` العمليات غير المتزامنة `async`: يمكنك استخدام `await ctx.getVar('ctx.xxx')` لتحديد الرؤية (حسب تقدير المستخدم). يُنصح بإبقاء هذا المنطق سريعاً وخالياً من الآثار الجانبية (تجنب طلبات الشبكة مثلاً).

مثال: إظهار إكمال `ctx.popup.*` فقط عند وجود `popup.uid`

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'Popup uid',
      },
    },
  },
});
```

مثال: النافذة المنبثقة متاحة ولكن يتم إخفاء بعض المسارات الفرعية (مسارات نسبية فقط؛ مثل إخفاء `record` و `parent.record`)

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'Popup uid',
        record: 'Popup record',
        parent: {
          properties: {
            record: 'Parent record',
          },
        },
      },
    },
  },
});
```

ملاحظة: يقوم CodeEditor دائماً بتفعيل تصفية الإكمال بناءً على `ctx` الفعلي (fail-open، لا يرمي أخطاء).

## 5. معلومات وقت التشغيل `info/meta` وواجهة برمجة تطبيقات معلومات السياق (للإكمال والنماذج اللغوية الكبيرة)

بالإضافة إلى صيانة توثيق `ctx` بشكل ثابت عبر `FlowRunJSContext.define()`، يمكنك أيضاً حقن **info/meta** في وقت التشغيل عبر `FlowContext.defineProperty/defineMethod`. يمكنك بعد ذلك إخراج معلومات سياق **قابلة للتسلسل** لـ CodeEditor أو النماذج اللغوية الكبيرة (LLMs) باستخدام واجهات برمجة التطبيقات التالية:

- `await ctx.getApiInfos(options?)`: معلومات API الثابتة.
- `await ctx.getVarInfos(options?)`: معلومات هيكل المتغيرات (مصدرها `meta` وتدعم توسيع المسار/العمق الأقصى).
- `await ctx.getEnvInfos()`: لقطة لبيئة وقت التشغيل.

### 5.1 `defineMethod(name, fn, info?)`

يدعم `info` (جميعها اختيارية):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (بأسلوب JSDoc)

> ملاحظة: يخرج `getApiInfos()` توثيق API ثابت ولن يتضمن حقولاً مثل `deprecated` أو `disabled` أو `disabledReason`.

مثال: توفير روابط التوثيق لـ `ctx.refreshTargets()`

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'تحديث بيانات الكتل المستهدفة',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: يُستخدم لواجهة مستخدم محدد المتغيرات (`getPropertyMetaTree` / `FlowContextSelector`). يحدد الرؤية، وهيكل الشجرة، والتعطيل، وما إلى ذلك (يدعم الدوال/async).
  - الحقول الشائعة: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: يُستخدم لتوثيق API الثابت (`getApiInfos`) والأوصاف الموجهة للنماذج اللغوية الكبيرة، ولا يؤثر على واجهة مستخدم محدد المتغيرات (يدعم الدوال/async).
  - الحقول الشائعة: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

عند توفير `meta` فقط (بدون توفير `info`):

- لن يقوم `getApiInfos()` بإرجاع هذا المفتاح (لأن توثيق API الثابت لا يُستنتج من `meta`).
- سيقوم `getVarInfos()` ببناء هيكل المتغير بناءً على `meta` (يُستخدم لمحددات المتغيرات/أشجار المتغيرات الديناميكية).

### 5.3 واجهة برمجة تطبيقات معلومات السياق

تُستخدم لإخراج "معلومات قدرات السياق المتاحة".

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // يمكن استخدامه مباشرة في await ctx.getVar(getVar)، ويُنصح بأن يبدأ بـ "ctx."
  value?: any; // القيمة الثابتة التي تم حلها (قابلة للتسلسل، تُرجع فقط عندما يمكن استنتاجها)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // توثيق ثابت (المستوى الأعلى)
type FlowContextVarInfos = Record<string, any>; // هيكل المتغيرات (قابل للتوسيع حسب المسار/العمق الأقصى)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

المعلمات الشائعة:

- `getApiInfos({ version })`: إصدار توثيق RunJS (الافتراضي `v1`).
- `getVarInfos({ path, maxDepth })`: القص وأقصى عمق للتوسيع (الافتراضي 3).

ملاحظة: النتائج التي ترجعها واجهات برمجة التطبيقات المذكورة أعلاه لا تحتوي على دوال، وهي مناسبة للتسلسل المباشر وإرسالها إلى النماذج اللغوية الكبيرة.

### 5.4 `await ctx.getVar(path)`

عندما يكون لديك "سلسلة مسار متغير" (على سبيل المثال من الإعدادات أو إدخال المستخدم) وتريد الحصول على قيمة وقت التشغيل لهذا المتغير مباشرة، استخدم `getVar`:

- مثال: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` هو مسار تعبير يبدأ بـ `ctx.` (مثل `ctx.record.id` / `ctx.record.roles[0].id`).

بالإضافة إلى ذلك: تُعامل الأساليب أو الخصائص التي تبدأ بشرطة سفلية `_` كأعضاء خاصين ولن تظهر في مخرجات `getApiInfos()` أو `getVarInfos()`.