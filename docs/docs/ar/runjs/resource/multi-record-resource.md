:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

مورد (Resource) موجه للمجموعات (Collections): تُرجع الطلبات مصفوفة وتدعم تقسيم الصفحات (Pagination)، التصفية، الفرز، وعمليات CRUD. وهو مناسب لسيناريوهات "السجلات المتعددة" مثل الجداول والقوائم. على عكس [APIResource](./api-resource.md)، يقوم MultiRecordResource بتحديد اسم المورد عبر `setResourceName()`، وينشئ روابط URL تلقائيًا مثل `users:list` و `users:create` بشكل آلي، ويتضمن قدرات مدمجة لتقسيم الصفحات والتصفية واختيار الصفوف.

**علاقة الوراثة**: FlowResource ← APIResource ← BaseRecordResource ← MultiRecordResource.

**طريقة الإنشاء**: `ctx.makeResource('MultiRecordResource')` أو `ctx.initResource('MultiRecordResource')`. قبل الاستخدام، يجب استدعاء `setResourceName('اسم_المجموعة')` (مثل `'users'`)؛ في RunJS، يتم حقن `ctx.api` بواسطة بيئة التشغيل.

---

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **بلوكات الجداول** | تستخدم بلوكات الجداول والقوائم MultiRecordResource افتراضيًا، مع دعم تقسيم الصفحات والتصفية والفرز. |
| **قوائم JSBlock** | تحميل البيانات من مجموعات البيانات مثل المستخدمين أو الطلبات في JSBlock وإجراء رندر مخصص. |
| **العمليات الجماعية** | استخدام `getSelectedRows()` للحصول على الصفوف المختارة و `destroySelectedRows()` للحذف الجماعي. |
| **موارد العلاقات** | تحميل المجموعات المرتبطة باستخدام صيغ مثل `users.tags`؛ يتطلب ذلك استخدام `setSourceId(parentRecordId)`. |

---

## تنسيق البيانات

- `getData()` تُرجع **مصفوفة من السجلات**، وهي حقل `data` الناتج عن استجابة واجهة برمجة تطبيقات القائمة (list API).
- `getMeta()` تُرجع المعلومات الوصفية (Metadata) لتقسيم الصفحات وغيرها: `page` ،`pageSize` ،`count` ،`totalPage` إلخ.

---

## اسم المورد ومصدر البيانات

| الطريقة | الوصف |
|------|------|
| `setResourceName(name)` / `getResourceName()` | اسم المورد، مثل `'users'` أو `'users.tags'` (مورد علاقة). |
| `setSourceId(id)` / `getSourceId()` | معرف السجل الأب لموارد العلاقات (مثلاً، لـ `users.tags` مرر المفتاح الأساسي للمستخدم). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | معرف مصدر البيانات (يُستخدم في سيناريوهات تعدد مصادر البيانات). |

---

## معاملات الطلب (التصفية / الحقول / الفرز)

| الطريقة | الوصف |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | التصفية حسب المفتاح الأساسي (لجلب سجل واحد `get` إلخ). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | شروط التصفية، مع دعم المعاملات مثل `$eq` ،`$ne` ،`$in` إلخ. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | مجموعات التصفية (لدمج شروط متعددة). |
| `setFields(fields)` / `getFields()` | الحقول المطلوبة (القائمة البيضاء). |
| `setSort(sort)` / `getSort()` | الفرز، مثل `['-createdAt']` للترتيب التنازلي حسب وقت الإنشاء. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | تحميل العلاقات (مثل `['user', 'tags']`). |

---

## تقسيم الصفحات (Pagination)

| الطريقة | الوصف |
|------|------|
| `setPage(page)` / `getPage()` | الصفحة الحالية (تبدأ من 1). |
| `setPageSize(size)` / `getPageSize()` | عدد العناصر في كل صفحة، الافتراضي هو 20. |
| `getTotalPage()` | إجمالي عدد الصفحات. |
| `getCount()` | إجمالي عدد السجلات (من meta الخاص بالخادم). |
| `next()` / `previous()` / `goto(page)` | الانتقال بين الصفحات وتفعيل التحديث `refresh`. |

---

## الصفوف المختارة (سيناريوهات الجداول)

| الطريقة | الوصف |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | بيانات الصفوف المختارة حاليًا، تُستخدم للحذف الجماعي والعمليات الأخرى. |

---

## عمليات CRUD والقوائم

| الطريقة | الوصف |
|------|------|
| `refresh()` | يطلب القائمة بالمعاملات الحالية، ويحدث `getData()` و meta الخاص بالصفحات، ويفعل حدث `'refresh'`. |
| `get(filterByTk)` | يطلب سجلاً واحدًا ويُرجعه (لا يكتب في `getData`). |
| `create(data, options?)` | إنشاء سجل. الخيار `{ refresh: false }` يمنع التحديث التلقائي. يفعل حدث `'saved'`. |
| `update(filterByTk, data, options?)` | تحديث سجل بواسطة مفتاحه الأساسي. |
| `destroy(target)` | حذف السجلات؛ يمكن أن يكون `target` مفتاحًا أساسيًا، أو كائن صف، أو مصفوفة من المفاتيح الأساسية/كائنات الصفوف (حذف جماعي). |
| `destroySelectedRows()` | حذف الصفوف المختارة حاليًا (يرمي خطأ إذا لم يتم اختيار أي صف). |
| `setItem(index, item)` | استبدال صف معين من البيانات محليًا (لا يرسل طلبًا). |
| `runAction(actionName, options)` | استدعاء أي إجراء (action) للمورد (مثل الإجراءات المخصصة). |

---

## الإعدادات والأحداث

| الطريقة | الوصف |
|------|------|
| `setRefreshAction(name)` | الإجراء الذي يتم استدعاؤه أثناء التحديث، الافتراضي هو `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | إعدادات الطلب للإنشاء/التحديث. |
| `on('refresh', fn)` / `on('saved', fn)` | يتم تفعيله بعد اكتمال التحديث أو بعد الحفظ. |

---

## أمثلة

### قائمة أساسية

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### التصفية والفرز

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### تحميل العلاقات

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### الإنشاء وتقسيم الصفحات

```js
await ctx.resource.create({ name: 'أحمد علي', email: 'ahmed.ali@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### الحذف الجماعي للصفوف المختارة

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('يرجى اختيار البيانات أولاً');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('تم الحذف'));
```

### الاستماع لحدث refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### مورد علاقة (جدول فرعي)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## ملاحظات

- **setResourceName إلزامي**: يجب استدعاء `setResourceName('اسم_المجموعة')` قبل الاستخدام، وإلا فلن يمكن إنشاء رابط URL للطلب.
- **موارد العلاقات**: عندما يكون اسم المورد بصيغة `parent.child` (مثل `users.tags`)، يجب استدعاء `setSourceId(parentPrimaryKey)` أولاً.
- **منع تكرار التحديث (Debouncing)**: الاستدعاءات المتعددة لـ `refresh()` ضمن نفس دورة الحدث (event loop) ستنفذ الاستدعاء الأخير فقط لتجنب الطلبات المتكررة.
- **getData تُرجع مصفوفة**: البيانات التي تُرجعها واجهة برمجة تطبيقات القائمة هي مصفوفة من السجلات، و `getData()` تُرجع هذه المصفوفة مباشرة.

---

## ذات صلة

- [ctx.resource](../context/resource.md) - مثيل المورد في السياق الحالي
- [ctx.initResource()](../context/init-resource.md) - تهيئة وربط بـ ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - إنشاء مثيل مورد جديد دون ربطه
- [APIResource](./api-resource.md) - مورد API عام يتم طلبه عبر URL
- [SingleRecordResource](./single-record-resource.md) - موجه نحو سجل واحد فقط