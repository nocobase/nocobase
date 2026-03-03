:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/get-var).
:::

# ctx.getVar()

يقرأ قيم المتغيرات **بشكل غير متزامن** من سياق التشغيل الحالي. يتوافق تحليل المتغيرات مع `{{ctx.xxx}}` المستخدم في SQL والقوالب، وعادةً ما تأتي من المستخدم الحالي، السجل الحالي، معلمات العرض، سياق النافذة المنبثقة، إلخ.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSBlock / JSField** | الحصول على معلومات السجل الحالي، المستخدم، المورد، إلخ، لاستخدامها في العرض أو المنطق البرمجي. |
| **قواعد الربط / محرك سير العمل** | قراءة `ctx.record` و `ctx.formValues` وما إلى ذلك لاتخاذ قرارات شرطية. |
| **الصيغ / القوالب** | تستخدم نفس قواعد تحليل المتغيرات الخاصة بـ `{{ctx.xxx}}`. |

## تعريف النوع

```ts
getVar(path: string): Promise<any>;
```

| المعلمة | النوع | الوصف |
|------|------|------|
| `path` | `string` | مسار المتغير، **يجب أن يبدأ بـ `ctx.`**، ويدعم الوصول عبر النقاط (dot notation) وفهارس المصفوفات. |

**القيمة المعادة**: `Promise<any>`، يجب استخدام `await` للحصول على القيمة المحللة؛ يعيد `undefined` إذا كان المتغير غير موجود.

> إذا تم تمرير مسار لا يبدأ بـ `ctx.`، فسيتم إلقاء خطأ: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## مسارات المتغيرات الشائعة

| المسار | الوصف |
|------|------|
| `ctx.record` | السجل الحالي (متاح عند ربط كتلة النموذج/التفاصيل بسجل) |
| `ctx.record.id` | المفتاح الأساسي للسجل الحالي |
| `ctx.formValues` | قيم النموذج الحالي (شائع الاستخدام في قواعد الربط وسير العمل؛ في سياق النماذج، يُفضل استخدام `ctx.form.getFieldsValue()` للقراءة في الوقت الفعلي) |
| `ctx.user` | المستخدم الحالي المسجل دخوله |
| `ctx.user.id` | معرف المستخدم الحالي |
| `ctx.user.nickname` | الاسم المستعار للمستخدم الحالي |
| `ctx.user.roles.name` | أسماء أدوار المستخدم الحالي (مصفوفة) |
| `ctx.popup.record` | السجل داخل النافذة المنبثقة |
| `ctx.popup.record.id` | المفتاح الأساسي للسجل داخل النافذة المنبثقة |
| `ctx.urlSearchParams` | معلمات استعلام URL (المحللة من `?key=value`) |
| `ctx.token` | رمز API Token الحالي |
| `ctx.role` | الدور الحالي |

## ctx.getVarInfos()

الحصول على **المعلومات الهيكلية** (النوع، العنوان، الخصائص الفرعية، إلخ) للمتغيرات القابلة للتحليل في السياق الحالي، مما يسهل استكشاف المسارات المتاحة. القيمة المعادة هي وصف ثابت بناءً على `meta` ولا تتضمن قيم التشغيل الفعلية.

### تعريف النوع

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

في القيمة المعادة، يمثل كل مفتاح (key) مسار المتغير، والقيمة (value) هي المعلومات الهيكلية لذلك المسار (بما في ذلك `type` و `title` و `properties` إلخ).

### المعلمات

| المعلمة | النوع | الوصف |
|------|------|------|
| `path` | `string \| string[]` | مسار القص؛ يجمع فقط هيكل المتغيرات تحت هذا المسار. يدعم `'record'`، `'record.id'`، `'ctx.record'`، `'{{ ctx.record }}'`؛ المصفوفة تمثل دمج مسارات متعددة. |
| `maxDepth` | `number` | أقصى عمق للتوسع، الافتراضي هو `3`. عند عدم تمرير `path` يكون عمق الخصائص في المستوى الأعلى هو 1؛ عند تمرير `path` يكون عمق العقدة المقابلة للمسار هو 1. |

### مثال

```ts
// الحصول على هيكل المتغيرات تحت record (بعمق يصل إلى 3 مستويات)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// الحصول على هيكل popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// الحصول على الهيكل الكامل للمتغيرات في المستوى الأعلى (الافتراضي maxDepth=3)
const vars = await ctx.getVarInfos();
```

## الفرق عن ctx.getValue

| الطريقة | سيناريو الاستخدام | الوصف |
|------|----------|------|
| `ctx.getValue()` | الحقول القابلة للتحرير مثل JSField أو JSItem | يحصل بشكل متزامن على قيمة **الحقل الحالي**؛ يتطلب ربط النموذج. |
| `ctx.getVar(path)` | أي سياق RunJS | يحصل بشكل غير متزامن على **أي متغير في ctx**؛ يجب أن يبدأ المسار بـ `ctx.`. |

في JSField، استخدم `getValue`/`setValue` لقراءة/كتابة الحقل الحالي؛ واستخدم `getVar` للوصول إلى متغيرات السياق الأخرى (مثل `record` و `user` و `formValues`).

## ملاحظات

- **يجب أن يبدأ المسار بـ `ctx.`**: مثل `ctx.record.id` وإلا سيتم إلقاء خطأ.
- **طريقة غير متزامنة**: يجب استخدام `await` للحصول على النتيجة، مثل `const id = await ctx.getVar('ctx.record.id')`.
- **المتغير غير موجود**: يعيد `undefined`؛ يمكن استخدام `??` بعد النتيجة لتعيين قيمة افتراضية: `(await ctx.getVar('ctx.user.nickname')) ?? 'زائر'`.
- **قيم النموذج**: يجب الحصول على `ctx.formValues` عبر `await ctx.getVar('ctx.formValues')`؛ لا يتم كشفها مباشرة كـ `ctx.formValues`. في سياق النموذج، يُفضل استخدام `ctx.form.getFieldsValue()` لقراءة أحدث القيم في الوقت الفعلي.

## أمثلة

### الحصول على معرف السجل الحالي

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`السجل الحالي: ${recordId}`);
}
```

### الحصول على السجل داخل نافذة منبثقة

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`سجل النافذة المنبثقة الحالي: ${recordId}`);
}
```

### قراءة العناصر الفرعية لحقل مصفوفة

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// يعيد مصفوفة من أسماء الأدوار، مثل ['admin', 'member']
```

### تعيين قيمة افتراضية

```ts
// لا تحتوي getVar على معلمة defaultValue؛ استخدم ?? بعد النتيجة
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'زائر';
```

### قراءة قيم حقول النموذج

```ts
// كل من ctx.formValues و ctx.form مخصصان لسيناريوهات النماذج؛ استخدم getVar لقراءة الحقول المتداخلة
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### قراءة معلمات استعلام URL

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // يقابل ?id=xxx
```

### استكشاف المتغيرات المتاحة

```ts
// الحصول على هيكل المتغيرات تحت record (بعمق يصل إلى 3 مستويات)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars تأخذ شكلاً مثل { 'record.id': { type: 'string', title: 'id' }, ... }
```

## روابط ذات صلة

- [ctx.getValue()](./get-value.md) - الحصول بشكل متزامن على قيمة الحقل الحالي (JSField/JSItem فقط)
- [ctx.form](./form.md) - مثيل النموذج، يمكن لـ `ctx.form.getFieldsValue()` قراءة قيم النموذج في الوقت الفعلي
- [ctx.model](./model.md) - النموذج الذي ينتمي إليه سياق التنفيذ الحالي
- [ctx.blockModel](./block-model.md) - الكتلة الأب التي يتواجد فيها كود JS الحالي
- [ctx.resource](./resource.md) - مثيل المورد (resource) في السياق الحالي
- `{{ctx.xxx}}` في SQL / القوالب - تستخدم نفس قواعد التحليل مثل `ctx.getVar('ctx.xxx')`