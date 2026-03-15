:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/make-resource).
:::

# ctx.makeResource()

تقوم هذه الدالة بـ **إنشاء** مثيل (instance) جديد للمورد (resource) وإرجاعه، و**لا** تقوم بالكتابة في `ctx.resource` أو تغييره. وهي مناسبة للسيناريوهات التي تتطلب موارد متعددة مستقلة أو استخداماً مؤقتاً.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **موارد متعددة** | تحميل مصادر بيانات متعددة في وقت واحد (مثل قائمة المستخدمين + قائمة الطلبات)، حيث يستخدم كل منها مورداً مستقلاً. |
| **الاستعلامات المؤقتة** | استعلامات لمرة واحدة يتم التخلص منها بعد الاستخدام، دون الحاجة لربطها بـ `ctx.resource`. |
| **البيانات المساعدة** | استخدام `ctx.resource` للبيانات الأساسية، واستخدام `makeResource` لإنشاء مثيلات للبيانات الإضافية. |

إذا كنت بحاجة إلى مورد واحد فقط وترغب في ربطه بـ `ctx.resource`، فإن استخدام [ctx.initResource()](./init-resource.md) يكون أكثر ملاءمة.

## تعريف النوع

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| المعامل | النوع | الوصف |
|------|------|------|
| `resourceType` | `string` | نوع المورد: `'APIResource'`، أو `'SingleRecordResource'`، أو `'MultiRecordResource'`، أو `'SQLResource'` |

**القيمة المرجعة**: مثيل المورد الذي تم إنشاؤه حديثاً.

## الفرق عن ctx.initResource()

| الطريقة | السلوك |
|------|------|
| `ctx.makeResource(type)` | تقوم فقط بإنشاء مثيل جديد وإرجاعه، و**لا** تكتب في `ctx.resource`. يمكن استدعاؤها عدة مرات للحصول على موارد مستقلة متعددة. |
| `ctx.initResource(type)` | تقوم بإنشاء المورد وربطه إذا لم يكن `ctx.resource` موجوداً؛ وتُرجعه مباشرة إذا كان موجوداً بالفعل. تضمن توفر `ctx.resource`. |

## أمثلة

### مورد واحد

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// تظل ctx.resource بقيمتها الأصلية (إن وجدت)
```

### موارد متعددة

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>عدد المستخدمين: {usersRes.getData().length}</p>
    <p>عدد الطلبات: {ordersRes.getData().length}</p>
  </div>
);
```

### استعلام مؤقت

```ts
// استعلام لمرة واحدة، لا يلوث ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## ملاحظات

- يحتاج المورد المنشأ حديثاً إلى استدعاء `setResourceName(name)` لتحديد المجموعة (collection)، ثم تحميل البيانات عبر `refresh()`.
- كل مثيل مورد مستقل ولا يؤثر على الآخرين؛ مما يجعله مناسباً لتحميل مصادر بيانات متعددة بالتوازي.

## روابط ذات صلة

- [ctx.initResource()](./init-resource.md): تهيئة المورد وربطه بـ `ctx.resource`
- [ctx.resource](./resource.md): مثيل المورد في السياق الحالي
- [MultiRecordResource](../resource/multi-record-resource) — سجلات متعددة/قائمة
- [SingleRecordResource](../resource/single-record-resource) — سجل واحد
- [APIResource](../resource/api-resource) — مورد API عام
- [SQLResource](../resource/sql-resource) — مورد استعلام SQL