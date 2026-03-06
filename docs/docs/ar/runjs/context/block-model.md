:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/block-model).
:::

# ctx.blockModel

نموذج الكتلة الأب (نسخة من BlockModel) الذي يتواجد فيه حقل JS أو كتلة JS الحالية. في سيناريوهات مثل `JSField` و `JSItem` و `JSColumn` يشير `ctx.blockModel` إلى كتلة النموذج (Form block) أو كتلة الجدول (Table block) التي تحمل منطق JS الحالي. في كتلة JS مستقلة (`JSBlock`) قد يكون `null` أو مطابقاً لـ `ctx.model`.

## سيناريوهات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSField** | الوصول إلى `form` و `collection` و `resource` لكتلة النموذج الأب داخل حقل النموذج لتنفيذ الربط (Linkage) أو التحقق من الصحة. |
| **JSItem** | الوصول إلى معلومات المورد والمجموعة لكتلة الجدول/النموذج الأب داخل عنصر جدول فرعي. |
| **JSColumn** | الوصول إلى `resource` (مثل `getSelectedRows`) و `collection` لكتلة الجدول الأب داخل عمود الجدول. |
| **إجراءات النموذج / سير العمل** | الوصول إلى `form` لإجراء التحقق قبل الإرسال، أو `resource` للتحديث، إلخ. |

> ملاحظة: `ctx.blockModel` متاح فقط في سياقات RunJS التي توجد بها كتلة أب. في كتل JS المستقلة (بدون نموذج/جدول أب)، قد يكون `null`. يُنصح بالتحقق من القيمة قبل الاستخدام.

## تعريف النوع

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

يعتمد النوع المحدد على نوع الكتلة الأب: كتل النموذج غالباً ما تكون `FormBlockModel` أو `EditFormModel` بينما كتل الجدول غالباً ما تكون `TableBlockModel`.

## الخصائص الشائعة

| الخاصية | النوع | الوصف |
|------|------|------|
| `uid` | `string` | المعرف الفريد لنموذج الكتلة. |
| `collection` | `Collection` | المجموعة المرتبطة بالكتلة الحالية. |
| `resource` | `Resource` | نسخة المورد المستخدمة من قبل الكتلة (`SingleRecordResource` / `MultiRecordResource` إلخ). |
| `form` | `FormInstance` | كتلة النموذج: نسخة من Ant Design Form، تدعم `getFieldsValue` و `validateFields` و `setFieldsValue` إلخ. |
| `emitter` | `EventEmitter` | باعث الأحداث، يستخدم للاستماع إلى `formValuesChange` و `onFieldReset` إلخ. |

## العلاقة مع ctx.model و ctx.form

| الحاجة | الاستخدام الموصى به |
|------|----------|
| **الكتلة الأب لـ JS الحالي** | `ctx.blockModel` |
| **قراءة/كتابة حقول النموذج** | `ctx.form` (تعادل `ctx.blockModel?.form` وهي أكثر ملاءمة في كتل النموذج) |
| **النموذج الخاص بسياق التنفيذ الحالي** | `ctx.model` (نموذج الحقل في JSField، ونموذج الكتلة في JSBlock) |

في `JSField` يكون `ctx.model` هو نموذج الحقل، بينما `ctx.blockModel` هو كتلة النموذج أو الجدول التي تحمل ذلك الحقل؛ وعادة ما يكون `ctx.form` هو نفسه `ctx.blockModel.form`.

## أمثلة

### الجدول: الحصول على الصفوف المختارة ومعالجتها

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('يرجى اختيار البيانات أولاً');
  return;
}
```

### سيناريو النموذج: التحقق والتحديث

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### الاستماع لتغييرات النموذج

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // تنفيذ الربط أو إعادة الرندرة بناءً على أحدث قيم النموذج
});
```

### تحفيز إعادة رندرة الكتلة

```ts
ctx.blockModel?.rerender?.();
```

## ملاحظات

- في **كتلة JS مستقلة** (بدون كتلة نموذج أو جدول أب)، قد يكون `ctx.blockModel` هو `null`. يُنصح باستخدام الاختيار الاختياري (optional chaining) عند الوصول إلى خصائصه: `ctx.blockModel?.resource?.refresh?.()`.
- في **JSField / JSItem / JSColumn**، يشير `ctx.blockModel` إلى كتلة النموذج أو الجدول التي تحمل الحقل الحالي. في **JSBlock**، قد يشير إلى الكتلة نفسها أو كتلة في مستوى أعلى، حسب الهيكل الفعلي.
- `resource` متاح فقط في كتل البيانات؛ `form` متاح فقط في كتل النموذج. كتل الجدول عادة لا تحتوي على `form`.

## روابط ذات صلة

- [ctx.model](./model.md): النموذج الخاص بسياق التنفيذ الحالي.
- [ctx.form](./form.md): نسخة النموذج، شائعة الاستخدام في كتل النموذج.
- [ctx.resource](./resource.md): نسخة المورد (تعادل `ctx.blockModel?.resource` وتستخدم مباشرة عند توفرها).
- [ctx.getModel()](./get-model.md): الحصول على نماذج كتل أخرى عبر UID.