:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/collection-field).
:::

# ctx.collectionField

نسخة من حقل المجموعة (`CollectionField`) المرتبطة بسياق تنفيذ RunJS الحالي، تُستخدم للوصول إلى البيانات التعريفية (metadata) للحقل، ونوعه، وقواعد التحقق، ومعلومات الارتباط. تتوفر فقط عندما يكون الحقل مرتبطاً بتعريف مجموعة بيانات؛ قد تكون القيمة `null` في الحقول المخصصة أو الافتراضية.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSField** | إجراء ربط أو تحقق في حقول النموذج بناءً على `interface` و `enum` و `targetCollection` وما إلى ذلك. |
| **JSItem** | الوصول إلى البيانات التعريفية للحقل المقابل للعمود الحالي في عناصر الجداول الفرعية. |
| **JSColumn** | اختيار طريقة العرض بناءً على `collectionField.interface` أو الوصول إلى `targetCollection` في أعمدة الجدول. |

> ملاحظة: `ctx.collectionField` متاح فقط عندما يكون الحقل مرتبطاً بتعريف مجموعة (`Collection`)؛ وعادةً ما يكون `undefined` في سيناريوهات مثل الكتل المستقلة (JSBlock) أو أحداث الإجراءات التي لا تحتوي على ربط للحقول. يُنصح بالتحقق من القيم الفارغة قبل الاستخدام.

## تعريف النوع

```ts
collectionField: CollectionField | null | undefined;
```

## الخصائص الشائعة

| الخاصية | النوع | الوصف |
|------|------|------|
| `name` | `string` | اسم الحقل (مثل `status` أو `userId`) |
| `title` | `string` | عنوان الحقل (بما في ذلك الترجمة الدولية) |
| `type` | `string` | نوع بيانات الحقل (`string` أو `integer` أو `belongsTo` إلخ.) |
| `interface` | `string` | نوع واجهة الحقل (`input` أو `select` أو `m2o` أو `o2m` أو `m2m` إلخ.) |
| `collection` | `Collection` | المجموعة التي ينتمي إليها الحقل |
| `targetCollection` | `Collection` | المجموعة المستهدفة للحقل المرتبط (فقط لأنواع الارتباط) |
| `target` | `string` | اسم المجموعة المستهدفة (للحقول المرتبطة) |
| `enum` | `array` | خيارات التعداد (select، radio، إلخ.) |
| `defaultValue` | `any` | القيمة الافتراضية |
| `collectionName` | `string` | اسم المجموعة التي ينتمي إليها الحقل |
| `foreignKey` | `string` | اسم حقل المفتاح الأجنبي (belongsTo، إلخ.) |
| `sourceKey` | `string` | مفتاح المصدر للارتباط (hasMany، إلخ.) |
| `targetKey` | `string` | مفتاح الهدف للارتباط |
| `fullpath` | `string` | المسار الكامل (مثل `main.users.status`)، يُستخدم لواجهة برمجة التطبيقات (API) أو مراجع المتغيرات |
| `resourceName` | `string` | اسم المورد (مثل `users.status`) |
| `readonly` | `boolean` | ما إذا كان الحقل للقراءة فقط |
| `titleable` | `boolean` | ما إذا كان يمكن عرضه كعنوان |
| `validation` | `object` | تكوين قواعد التحقق |
| `uiSchema` | `object` | تكوين واجهة المستخدم (UI) |
| `targetCollectionTitleField` | `CollectionField` | حقل العنوان للمجموعة المستهدفة (للحقول المرتبطة) |

## الطرق الشائعة

| الطريقة | الوصف |
|------|------|
| `isAssociationField(): boolean` | ما إذا كان الحقل حقل ارتباط (belongsTo، hasMany، hasOne، belongsToMany، إلخ.) |
| `isRelationshipField(): boolean` | ما إذا كان الحقل حقل علاقة (بما في ذلك o2o، m2o، o2m، m2m، إلخ.) |
| `getComponentProps(): object` | الحصول على الخصائص (props) الافتراضية لمكون الحقل |
| `getFields(): CollectionField[]` | الحصول على قائمة حقول المجموعة المستهدفة (للحقول المرتبطة فقط) |
| `getFilterOperators(): object[]` | الحصول على مشغلات التصفية التي يدعمها هذا الحقل (مثل `$eq` و `$ne` إلخ.) |

## أمثلة

### العرض الشرطي بناءً على نوع الحقل

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // حقل ارتباط: عرض السجلات المرتبطة
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### تحديد ما إذا كان الحقل حقل ارتباط والوصول إلى المجموعة المستهدفة

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // المعالجة وفقاً لهيكل المجموعة المستهدفة
}
```

### الحصول على خيارات التعداد

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### العرض الشرطي بناءً على وضع القراءة فقط أو وضع العرض

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### الحصول على حقل العنوان للمجموعة المستهدفة

```ts
// عند عرض حقل ارتباط، استخدم targetCollectionTitleField للحصول على اسم حقل العنوان
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## العلاقة مع ctx.collection

| المتطلب | الاستخدام الموصى به |
|------|----------|
| **المجموعة التي ينتمي إليها الحقل الحالي** | `ctx.collectionField?.collection` أو `ctx.collection` |
| **البيانات التعريفية للحقل (الاسم، النوع، الواجهة، التعداد، إلخ.)** | `ctx.collectionField` |
| **المجموعة المستهدفة للارتباط** | `ctx.collectionField?.targetCollection` |

تمثل `ctx.collection` عادةً المجموعة المرتبطة بالكتلة الحالية؛ بينما تمثل `ctx.collectionField` تعريف الحقل الحالي داخل المجموعة. في سيناريوهات مثل الجداول الفرعية أو حقول الارتباط، قد يختلف الاثنان.

## ملاحظات

- في سيناريوهات مثل **JSBlock** أو **JSAction (بدون ربط حقل)**، عادةً ما يكون `ctx.collectionField` غير معرف (`undefined`). يُنصح باستخدام الربط الاختياري (optional chaining) قبل الوصول إليه.
- إذا لم يتم ربط حقل JS مخصص بحقل مجموعة، فقد يكون `ctx.collectionField` بقيمة `null`.
- `targetCollection` متاح فقط للحقول من نوع الارتباط (مثل m2o، o2m، m2m)؛ و `enum` متاح فقط للحقول التي تحتوي على خيارات مثل select أو radioGroup.

## ذات صلة

- [ctx.collection](./collection.md): المجموعة المرتبطة بالسياق الحالي
- [ctx.model](./model.md): النموذج الذي يتواجد فيه سياق التنفيذ الحالي
- [ctx.blockModel](./block-model.md): الكتلة الأب التي تحمل كود JS الحالي
- [ctx.getValue()](./get-value.md)، [ctx.setValue()](./set-value.md): قراءة وكتابة قيمة الحقل الحالي