:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/resource/sql-resource).
:::

# SQLResource

مورد (Resource) مخصص لتنفيذ الاستعلامات بناءً على **تكوينات SQL المحفوظة** أو **SQL الديناميكي**، حيث يتم جلب البيانات من واجهات مثل `flowSql:run` / `flowSql:runById`. يُعد مناسباً لسيناريوهات التقارير، الإحصائيات، قوائم SQL المخصصة، وغيرها. بخلاف [MultiRecordResource](./multi-record-resource.md)، لا يعتمد SQLResource على المجموعات (Collections)؛ بل يقوم بتنفيذ استعلامات SQL مباشرة ويدعم الترقيم الصفحي (Pagination)، ربط المعاملات (Parameter binding)، متغيرات القالب (`{{ctx.xxx}}`) والتحكم في نوع النتيجة.

**علاقة الوراثة**: FlowResource ← APIResource ← BaseRecordResource ← SQLResource.

**طريقة الإنشاء**: `ctx.makeResource('SQLResource')` أو `ctx.initResource('SQLResource')`. للتنفيذ بناءً على تكوين محفوظ، استخدم `setFilterByTk(uid)` (المعرف الفريد لقالب SQL)؛ ولأغراض التصحيح، يمكن استخدام `setDebug(true)` + `setSQL(sql)` لتنفيذ SQL مباشرة؛ في بيئة RunJS، يتم حقن `ctx.api` بواسطة بيئة التشغيل.

---

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **التقارير / الإحصائيات** | التجميعات المعقدة، الاستعلامات عبر الجداول، والمقاييس الإحصائية المخصصة. |
| **قوائم JSBlock المخصصة** | تنفيذ عمليات تصفية أو فرز أو ربط خاصة باستخدام SQL مع عرض مخصص. |
| **مكعبات الرسوم البيانية** | استخدام قوالب SQL المحفوظة كمصادر بيانات للرسوم البيانية، مع دعم الترقيم الصفحي. |
| **المفاضلة بين SQLResource و ctx.sql** | استخدم SQLResource عندما تحتاج إلى ترقيم صفحي، أحداث، أو بيانات تفاعلية؛ واستخدم `ctx.sql.run()` / `ctx.sql.runById()` للاستعلامات البسيطة التي تُنفذ لمرة واحدة. |

---

## تنسيق البيانات

- تعيد `getData()` تنسيقات مختلفة بناءً على `setSQLType()`:
  - `selectRows` (افتراضي): **مصفوفة**، نتائج متعددة الأسطر.
  - `selectRow`: **كائن واحد**.
  - `selectVar`: **قيمة مفردة** (مثل COUNT، SUM).
- تعيد `getMeta()` معلومات وصفية مثل الترقيم الصفحي: `page` (الصفحة)، `pageSize` (حجم الصفحة)، `count` (العدد الإجمالي)، `totalPage` (إجمالي الصفحات)، إلخ.

---

## أوضاع تكوين وتنفيذ SQL

| الطريقة | الوصف |
|------|------|
| `setFilterByTk(uid)` | تعيين المعرف الفريد (UID) لقالب SQL المراد تنفيذه (يقابل runById، يجب حفظه في واجهة الإدارة أولاً). |
| `setSQL(sql)` | تعيين نص SQL الخام (يُستخدم لـ runBySQL فقط عند تفعيل وضع التصحيح `setDebug(true)`). |
| `setSQLType(type)` | نوع النتيجة: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | عند ضبطه على `true` فإنه يتم استدعاء `runBySQL()` عند التحديث (refresh)، وإلا يتم استدعاء `runById()`. |
| `run()` | يستدعي `runBySQL()` أو `runById()` بناءً على حالة التصحيح (debug). |
| `runBySQL()` | التنفيذ باستخدام SQL المحدد في `setSQL` (يتطلب `setDebug(true)`). |
| `runById()` | التنفيذ باستخدام قالب SQL المحفوظ عبر المعرف الفريد الحالي. |

---

## المعاملات والسياق

| الطريقة | الوصف |
|------|------|
| `setBind(bind)` | ربط المتغيرات. استخدم كائنًا مع علامات `:name` أو مصفوفة مع علامات `?`. |
| `setLiquidContext(ctx)` | سياق القالب (Liquid)، يُستخدم لتحليل `{{ctx.xxx}}`. |
| `setFilter(filter)` | شروط تصفية إضافية (تُمرر في بيانات الطلب). |
| `setDataSourceKey(key)` | معرف مصدر البيانات (يُستخدم في بيئات تعدد مصادر البيانات). |

---

## الترقيم الصفحي (Pagination)

| الطريقة | الوصف |
|------|------|
| `setPage(page)` / `getPage()` | الصفحة الحالية (الافتراضي 1). |
| `setPageSize(size)` / `getPageSize()` | عدد العناصر في كل صفحة (الافتراضي 20). |
| `next()` / `previous()` / `goto(page)` | التنقل بين الصفحات وتشغيل التحديث (refresh). |

يمكن استخدام `{{ctx.limit}}` و `{{ctx.offset}}` داخل SQL للإشارة إلى معاملات الترقيم الصفحي، حيث يقوم SQLResource بحقن `limit` و `offset` في السياق تلقائياً.

---

## جلب البيانات والأحداث

| الطريقة | الوصف |
|------|------|
| `refresh()` | تنفيذ SQL (سواء runById أو runBySQL)، وكتابة النتيجة في `setData(data)` وتحديث المعلومات الوصفية (meta)، وإطلاق حدث `'refresh'`. |
| `runAction(actionName, options)` | استدعاء الإجراءات الأساسية (مثل `getBind`، `run`، `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | يتم إطلاقها عند اكتمال التحديث أو عند بدء التحميل. |

---

## أمثلة

### التنفيذ عبر قالب محفوظ (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // المعرف الفريد لقالب SQL المحفوظ
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page، pageSize، count، إلخ.
```

### وضع التصحيح: تنفيذ SQL مباشرة (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### الترقيم الصفحي والتنقل

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// التنقل بين الصفحات
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### أنواع النتائج

```js
// أسطر متعددة (افتراضي)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// سطر واحد
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// قيمة واحدة (مثل COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### استخدام متغيرات القالب

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### الاستماع لحدث التحديث (refresh)

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## ملاحظات

- **يتطلب runById حفظ القالب أولاً**: يجب أن يكون المعرف الفريد (uid) المستخدم في `setFilterByTk(uid)` معرفاً لقالب SQL تم حفظه مسبقاً في واجهة الإدارة. يمكن حفظه عبر `ctx.sql.save({ uid, sql })`.
- **وضع التصحيح يتطلب صلاحيات**: يستخدم `setDebug(true)` واجهة `flowSql:run` التي تتطلب أن يمتلك الدور الحالي صلاحيات تكوين SQL؛ بينما يتطلب `runById` تسجيل الدخول فقط.
- **تخفيف التحديث (Debouncing)**: استدعاء `refresh()` عدة مرات ضمن نفس حلقة الأحداث (event loop) سيؤدي إلى تنفيذ الاستدعاء الأخير فقط لتجنب الطلبات المتكررة.
- **ربط المعاملات لمنع الحقن**: استخدم `setBind()` مع علامات `:name` أو `?` بدلاً من دمج النصوص لتجنب هجمات حقن SQL (SQL Injection).

---

## ذات صلة

- [ctx.sql](../context/sql.md) - إدارة وتنفيذ SQL، حيث يناسب `ctx.sql.runById` الاستعلامات البسيطة لمرة واحدة.
- [ctx.resource](../context/resource.md) - مثيل المورد في السياق الحالي.
- [ctx.initResource()](../context/init-resource.md) - تهيئة المورد وربطه بـ `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) - إنشاء مثيل مورد جديد دون ربطه.
- [APIResource](./api-resource.md) - مورد API عام.
- [MultiRecordResource](./multi-record-resource.md) - مخصص للمجموعات والقوائم.