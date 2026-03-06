:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/init-resource).
:::

# ctx.initResource()

تقوم بـ **تهيئة** المورد (resource) للسياق الحالي: إذا لم يكن `ctx.resource` موجوداً بالفعل، فسيتم إنشاء مورد من النوع المحدد وربطه بالسياق؛ أما إذا كان موجوداً بالفعل، فسيتم استخدامه مباشرة. بعد ذلك، يمكن الوصول إليه عبر `ctx.resource`.

## حالات الاستخدام

تُستخدم بشكل عام في سيناريوهات **JSBlock** (الكتل المستقلة). معظم الكتل والنوافذ المنبثقة والمكونات الأخرى يكون `ctx.resource` مرتبطاً بها مسبقاً ولا تتطلب استدعاءً يدوياً. لا يحتوي JSBlock على مورد افتراضياً، لذا يجب استدعاء `ctx.initResource(type)` قبل تحميل البيانات عبر `ctx.resource`.

## تعريف النوع

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| المعامل | النوع | الوصف |
|------|------|------|
| `type` | `string` | نوع المورد: `'APIResource'`، `'SingleRecordResource'`، `'MultiRecordResource'`، `'SQLResource'` |

**القيمة المرجعة**: مثيل المورد في السياق الحالي (أي `ctx.resource`).

## الفرق بين ctx.makeResource() و ctx.initResource()

| الطريقة | السلوك |
|------|------|
| `ctx.initResource(type)` | تقوم بإنشاء وربط المورد إذا لم يكن `ctx.resource` موجوداً؛ وتُرجع المورد الحالي إذا كان موجوداً. تضمن توفر `ctx.resource`. |
| `ctx.makeResource(type)` | تقوم فقط بإنشاء وإرجاع مثيل جديد، و**لا** تكتب في `ctx.resource`. مناسبة للسيناريوهات التي تتطلب موارد مستقلة متعددة أو استخداماً مؤقتاً. |

## أمثلة

### بيانات القائمة (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### سجل واحد (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // تحديد المفتاح الأساسي
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### تحديد مصدر البيانات

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## ملاحظات

- في معظم سيناريوهات الكتل (النماذج، الجداول، التفاصيل، إلخ) والنوافذ المنبثقة، يكون `ctx.resource` مرتبطاً مسبقاً بواسطة بيئة التشغيل، لذا فإن استدعاء `ctx.initResource` غير ضروري.
- التهيئة اليدوية مطلوبة فقط في سياقات مثل JSBlock حيث لا يوجد مورد افتراضي.
- بعد التهيئة، يجب استدعاء `setResourceName(name)` لتحديد المجموعة، ثم استدعاء `refresh()` لتحميل البيانات.

## مواضيع ذات صلة

- [ctx.resource](./resource.md) — مثيل المورد في السياق الحالي
- [ctx.makeResource()](./make-resource.md) — إنشاء مثيل مورد جديد دون ربطه بـ `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — سجلات متعددة/قائمة
- [SingleRecordResource](../resource/single-record-resource.md) — سجل واحد
- [APIResource](../resource/api-resource.md) — مورد API عام
- [SQLResource](../resource/sql-resource.md) — مورد استعلام SQL