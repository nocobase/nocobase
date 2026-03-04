:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/model).
:::

# ctx.model

مثيل `FlowModel` الذي يقع فيه سياق تنفيذ RunJS الحالي، وهو نقطة الدخول الافتراضية لسيناريوهات مثل JSBlock و JSField و JSAction وغيرها. يختلف النوع المحدد حسب السياق: فقد يكون فئة فرعية مثل `BlockModel` أو `ActionModel` أو `JSEditableFieldModel`.

## سيناريوهات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSBlock** | `ctx.model` هو نموذج الكتلة الحالي، ويمكن من خلاله الوصول إلى `resource` و `collection` و `setProps` وغيرها. |
| **JSField / JSItem / JSColumn** | `ctx.model` هو نموذج الحقل، ويمكن من خلاله الوصول إلى `setProps` و `dispatchEvent` وغيرها. |
| **أحداث الإجراءات / ActionModel** | `ctx.model` هو نموذج الإجراء، ويمكن من خلاله قراءة وكتابة معلمات الخطوات وإرسال الأحداث وغيرها. |

> تلميح: إذا كنت بحاجة إلى الوصول إلى **الكتلة الأب التي تحتوي على JS الحالي** (مثل كتلة النموذج Form أو الجدول Table)، استخدم `ctx.blockModel`؛ وللوصول إلى **نماذج أخرى**، استخدم `ctx.getModel(uid)`.

## تعريف النوع

```ts
model: FlowModel;
```

`FlowModel` هي الفئة الأساسية، وفي وقت التشغيل تكون عبارة عن مثيلات لفئات فرعية متنوعة (مثل `BlockModel` و `FormBlockModel` و `TableBlockModel` و `JSEditableFieldModel` و `ActionModel` وغيرها)، وتختلف الخصائص والطرق المتاحة حسب النوع.

## الخصائص الشائعة

| الخاصية | النوع | الوصف |
|------|------|------|
| `uid` | `string` | المعرف الفريد للنموذج، يمكن استخدامه في `ctx.getModel(uid)` أو لربط UID الخاص بالنافذة المنبثقة. |
| `collection` | `Collection` | المجموعة المرتبطة بالنموذج الحالي (توجد عندما تكون الكتلة/الحقل مرتبطة ببيانات). |
| `resource` | `Resource` | مثيل المورد المرتبط، يستخدم للتحديث، والحصول على الصفوف المحددة، إلخ. |
| `props` | `object` | إعدادات واجهة المستخدم/السلوك للنموذج، يمكن تحديثها باستخدام `setProps`. |
| `subModels` | `Record<string, FlowModel>` | مجموعة النماذج الفرعية (مثل الحقول داخل النموذج، أو الأعمدة داخل الجدول). |
| `parent` | `FlowModel` | النموذج الأب (إن وجد). |

## الطرق الشائعة

| الطريقة | الوصف |
|------|------|
| `setProps(partialProps: any): void` | تحديث إعدادات النموذج وتنشيط إعادة الصيرورة (مثال: `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | إرسال حدث إلى النموذج، مما يؤدي إلى تشغيل سير العمل المكون على هذا النموذج والذي يستمع لاسم الحدث. يمكن تمرير `payload` اختياري إلى معالج سير العمل؛ خيار `options.debounce` يمكنه تفعيل منع الارتداد. |
| `getStepParams?.(flowKey, stepKey)` | قراءة معلمات خطوات سير عمل الإعدادات (في سيناريوهات لوحة الإعدادات، الإجراءات المخصصة، إلخ). |
| `setStepParams?.(flowKey, stepKey, params)` | كتابة معلمات خطوات سير عمل الإعدادات. |

## العلاقة مع ctx.blockModel و ctx.getModel

| المتطلب | الاستخدام الموصى به |
|------|----------|
| **النموذج في سياق التنفيذ الحالي** | `ctx.model` |
| **الكتلة الأب لـ JS الحالي** | `ctx.blockModel`؛ تُستخدم غالباً للوصول إلى `resource` أو `form` أو `collection`. |
| **الحصول على أي نموذج بواسطة UID** | `ctx.getModel(uid)` أو `ctx.getModel(uid, true)` (البحث عبر مكدسات العرض). |

في JSField، يكون `ctx.model` هو نموذج الحقل، بينما يكون `ctx.blockModel` هو كتلة النموذج (Form) أو الجدول (Table) التي تحتوي على ذلك الحقل.

## أمثلة

### تحديث حالة الكتلة/الإجراء

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### إرسال أحداث النموذج

```ts
// إرسال حدث لتشغيل سير عمل مكون على هذا النموذج يستمع لاسم هذا الحدث
await ctx.model.dispatchEvent('remove');

// عند توفير payload، سيتم تمريره إلى ctx.inputArgs الخاص بمعالج سير العمل
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### استخدام UID لربط النوافذ المنبثقة أو الوصول عبر النماذج

```ts
const myUid = ctx.model.uid;
// في إعدادات النافذة المنبثقة، يمكنك تمرير openerUid: myUid للربط
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## ذات صلة

- [ctx.blockModel](./block-model.md): نموذج الكتلة الأب الذي يقع فيه JS الحالي.
- [ctx.getModel()](./get-model.md): الحصول على نماذج أخرى بواسطة UID.