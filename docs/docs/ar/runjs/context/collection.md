:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/collection).
:::

# ctx.collection

مثيل المجموعة (Collection) المرتبط بسياق تنفيذ RunJS الحالي، ويُستخدم للوصول إلى البيانات الوصفية للمجموعة، وتعريفات الحقول، والمفاتيح الأساسية وغيرها من التكوينات. عادةً ما يأتي من `ctx.blockModel.collection` أو `ctx.collectionField?.collection`.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSBlock** | المجموعة المرتبطة بالكتلة؛ يمكن من خلالها الوصول إلى `name` و `getFields` و `filterTargetKey` وما إلى ذلك. |
| **JSField / JSItem / JSColumn** | المجموعة التي ينتمي إليها الحقل الحالي (أو مجموعة الكتلة الأب)، وتُستخدم للحصول على قوائم الحقول والمفاتيح الأساسية وما إلى ذلك. |
| **عمود الجدول / كتلة التفاصيل** | تُستخدم للريندنة بناءً على هيكل المجموعة أو تمرير `filterByTk` عند فتح النوافذ المنبثقة. |

> ملاحظة: يتوفر `ctx.collection` في السيناريوهات التي ترتبط فيها كتلة البيانات أو كتلة النموذج أو كتلة الجدول بمجموعة؛ أما في JSBlock المستقل غير المرتبط بمجموعة فقد يكون `null`؛ لذا يُنصح بالتحقق من القيمة قبل الاستخدام.

## تعريف النوع

```ts
collection: Collection | null | undefined;
```

## الخصائص الشائعة

| الخاصية | النوع | الوصف |
|------|------|------|
| `name` | `string` | اسم المجموعة (مثل `users` أو `orders`) |
| `title` | `string` | عنوان المجموعة (يشمل الترجمة الدولية) |
| `filterTargetKey` | `string \| string[]` | اسم حقل المفتاح الأساسي، يُستخدم لـ `filterByTk` و `getFilterByTK` |
| `dataSourceKey` | `string` | مفتاح مصدر البيانات (مثل `main`) |
| `dataSource` | `DataSource` | مثيل مصدر البيانات الذي تنتمي إليه |
| `template` | `string` | قالب المجموعة (مثل `general` أو `file` أو `tree`) |
| `titleableFields` | `CollectionField[]` | قائمة الحقول التي يمكن عرضها كعناوين |
| `titleCollectionField` | `CollectionField` | مثيل حقل العنوان |

## الطرق الشائعة

| الطريقة | الوصف |
|------|------|
| `getFields(): CollectionField[]` | الحصول على كافة الحقول (بما في ذلك الموروثة) |
| `getField(name: string): CollectionField \| undefined` | الحصول على حقل واحد بالاسم |
| `getFieldByPath(path: string): CollectionField \| undefined` | الحصول على حقل عبر المسار (يدعم العلاقات، مثل `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | الحصول على حقول الارتباط؛ يمكن أن تكون `types` مثل `['one']` أو `['many']` |
| `getFilterByTK(record): any` | استخراج قيمة المفتاح الأساسي من السجل، وتُستخدم لـ `filterByTk` في واجهة برمجة التطبيقات (API) |

## العلاقة مع ctx.collectionField و ctx.blockModel

| المتطلبات | الاستخدام الموصى به |
|------|----------|
| **المجموعة المرتبطة بالسياق الحالي** | `ctx.collection` (تعادل `ctx.blockModel?.collection` أو `ctx.collectionField?.collection`) |
| **تعريف المجموعة للحقل الحالي** | `ctx.collectionField?.collection` (المجموعة التي ينتمي إليها الحقل) |
| **المجموعة المستهدفة للارتباط** | `ctx.collectionField?.targetCollection` (المجموعة المستهدفة لحقل الارتباط) |

في سيناريوهات مثل الجداول الفرعية، قد يشير `ctx.collection` إلى المجموعة المستهدفة للارتباط؛ أما في النماذج أو الجداول العادية، فعادةً ما يكون هو المجموعة المرتبطة بالكتلة.

## أمثلة

### الحصول على المفتاح الأساسي وفتح نافذة منبثقة

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### التكرار عبر الحقول لإجراء التحقق أو الربط التفاعلي

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} مطلوب`);
    return;
  }
}
```

### الحصول على حقول الارتباط

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// تُستخدم لبناء الجداول الفرعية، والموارد المرتبطة، وما إلى ذلك.
```

## ملاحظات

- `filterTargetKey` هو اسم حقل المفتاح الأساسي للمجموعة؛ قد تستخدم بعض المجموعات مفاتيح مركبة `string[]`؛ وفي حال عدم التكوين، يُستخدم `'id'` كقيمة افتراضية شائعة.
- في سيناريوهات **الجداول الفرعية أو حقول الارتباط**، قد يشير `ctx.collection` إلى المجموعة المستهدفة للارتباط، وهو ما يختلف عن `ctx.blockModel.collection`.
- تقوم `getFields()` بدمج الحقول من المجموعات الموروثة، وتغطي الحقول المحلية الحقول الموروثة التي تحمل نفس الاسم.

## ذات صلة

- [ctx.collectionField](./collection-field.md): تعريف حقل المجموعة للحقل الحالي
- [ctx.blockModel](./block-model.md): الكتلة الأب التي تستضيف JS الحالي، وتحتوي على `collection`
- [ctx.model](./model.md): النموذج الحالي، والذي قد يحتوي على `collection`