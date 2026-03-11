:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/resource).
:::

# ctx.resource

مثيل **FlowResource** في السياق الحالي، يُستخدم للوصول إلى البيانات والتعامل معها. في معظم الكتل (النماذج، الجداول، التفاصيل، إلخ) وسيناريوهات النوافذ المنبثقة، تقوم بيئة التشغيل بربط `ctx.resource` مسبقاً؛ أما في سيناريوهات مثل JSBlock التي لا تحتوي على مورد افتراضياً، فيجب استدعاء [ctx.initResource()](./init-resource.md) أولاً لتهيئته قبل استخدامه عبر `ctx.resource`.

## سيناريوهات الاستخدام

يمكن استخدام `ctx.resource` في أي سيناريو RunJS يتطلب الوصول إلى بيانات منظمة (القوائم، السجلات الفردية، واجهات برمجة التطبيقات المخصصة، SQL). عادةً ما تكون النماذج، الجداول، كتل التفاصيل، والنوافذ المنبثقة مربوطة مسبقاً؛ بالنسبة لـ JSBlock و JSField و JSItem و JSColumn وغيرها، إذا كان تحميل البيانات مطلوباً، يمكنك استدعاء `ctx.initResource(type)` أولاً ثم الوصول إلى `ctx.resource`.

## تعريف النوع

```ts
resource: FlowResource | undefined;
```

- في السياقات التي تحتوي على ربط مسبق، يكون `ctx.resource` هو مثيل المورد المقابل.
- في سيناريوهات مثل JSBlock حيث لا يوجد مورد افتراضياً، تكون القيمة `undefined` حتى يتم استدعاء `ctx.initResource(type)`.

## الطرق الشائعة

تختلف الطرق التي توفرها أنواع الموارد المختلفة (MultiRecordResource، SingleRecordResource، APIResource، SQLResource) قليلاً. فيما يلي الطرق العامة أو الشائعة الاستخدام:

| الطريقة | الوصف |
|------|------|
| `getData()` | الحصول على البيانات الحالية (قائمة أو سجل فردي) |
| `setData(value)` | تعيين البيانات المحلية |
| `refresh()` | بدء طلب بالمعلمات الحالية لتحديث البيانات |
| `setResourceName(name)` | تعيين اسم المورد (مثل `'users'`، `'users.tags'`) |
| `setFilterByTk(tk)` | تعيين عامل تصفية المفتاح الأساسي (للحصول على سجل فردي، إلخ) |
| `runAction(actionName, options)` | استدعاء أي إجراء (action) للمورد (مثل `create`، `update`) |
| `on(event, callback)` / `off(event, callback)` | الاشتراك/إلغاء الاشتراك في الأحداث (مثل `refresh`، `saved`) |

**خاص بـ MultiRecordResource**: `getSelectedRows()`، `destroySelectedRows()`، `setPage()`، `next()`، `previous()`، إلخ.

## أمثلة

### بيانات القائمة (تتطلب initResource أولاً)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### سيناريو الجدول (مربوط مسبقاً)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('تم الحذف'));
```

### سجل فردي

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### استدعاء إجراء مخصص

```js
await ctx.resource.runAction('create', { data: { name: 'زيد' } });
```

## العلاقة مع ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: إذا كان `ctx.resource` غير موجود، فإنه يقوم بإنشائه وربطه؛ وإذا كان موجوداً بالفعل، فإنه يعيد المثيل الحالي. هذا يضمن توفر `ctx.resource`.
- **ctx.makeResource(type)**: ينشئ مثيلاً جديداً للمورد ويعيده، لكنه **لا** يكتبه في `ctx.resource`. هذا مناسب للسيناريوهات التي تتطلب موارد مستقلة متعددة أو استخداماً مؤقتاً.
- **ctx.resource**: الوصول إلى المورد المربوط بالفعل بالسياق الحالي. معظم الكتل/النوافذ المنبثقة مربوطة مسبقاً؛ وبخلاف ذلك، تكون القيمة `undefined` وتتطلب `ctx.initResource`.

## ملاحظات

- يُنصح بإجراء فحص للقيمة الفارغة قبل الاستخدام: `ctx.resource?.refresh()`، خاصة في سيناريوهات مثل JSBlock حيث قد لا يوجد ربط مسبق.
- بعد التهيئة، يجب استدعاء `setResourceName(name)` لتحديد المجموعة (collection) قبل تحميل البيانات عبر `refresh()`.
- للاطلاع على واجهة برمجة التطبيقات (API) الكاملة لكل نوع من أنواع الموارد، راجع الروابط أدناه.

## ذات صلة

- [ctx.initResource()](./init-resource.md) - تهيئة وربط مورد بالسياق الحالي
- [ctx.makeResource()](./make-resource.md) - إنشاء مثيل مورد جديد دون ربطه بـ `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - سجلات متعددة/قوائم
- [SingleRecordResource](../resource/single-record-resource.md) - سجل فردي
- [APIResource](../resource/api-resource.md) - مورد API عام
- [SQLResource](../resource/sql-resource.md) - مورد استعلام SQL