:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/sql).
:::

# ctx.sql

يوفر `ctx.sql` إمكانيات تنفيذ وإدارة SQL، ويُستخدم عادةً في RunJS (مثل JSBlock وسير العمل) للوصول المباشر إلى قاعدة البيانات. يدعم تنفيذ SQL المؤقت، والتنفيذ حسب المعرف (ID) لقوالب SQL المحفوظة، وربط المعاملات، ومتغيرات القوالب (`{{ctx.xxx}}`) والتحكم في نوع النتائج.

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **JSBlock** | التقارير الإحصائية المخصصة، قوائم التصفية المعقدة، واستعلامات التجميع عبر الجداول. |
| **كتلة المخططات (Chart Block)** | حفظ قوالب SQL لتشغيل مصادر بيانات المخططات. |
| **سير العمل / الارتباط** | تنفيذ SQL محدد مسبقاً للحصول على البيانات والمشاركة في المنطق اللاحق. |
| **SQLResource** | يُستخدم بالاقتران مع `ctx.initResource('SQLResource')` لحالات مثل القوائم المرقمة (pagination). |

> ملاحظة: يصل `ctx.sql` إلى قاعدة البيانات عبر واجهة برمجة تطبيقات `flowSql`. تأكد من أن المستخدم الحالي لديه صلاحيات التنفيذ لمصدر البيانات المقابل.

## توضيح الصلاحيات

| الصلاحية | الطريقة | الوصف |
|------|------|------|
| **مستخدم مسجل** | `runById` | التنفيذ بناءً على معرف قالب SQL مهيأ مسبقاً. |
| **صلاحية تكوين SQL** | `run`, `save`, `destroy` | تنفيذ SQL مؤقت، أو حفظ/تحديث/حذف قوالب SQL. |

يجب أن يستخدم منطق الواجهة الأمامية المخصص للمستخدمين العاديين `ctx.sql.runById(uid, options)`. عندما يتطلب الأمر SQL ديناميكياً أو إدارة القوالب، تأكد من أن الدور الحالي يمتلك صلاحيات تكوين SQL.

## تعريف الأنواع (Type Definition)

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## الطرق الشائعة

| الطريقة | الوصف | متطلبات الصلاحية |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | تنفيذ SQL مؤقت؛ يدعم ربط المعاملات ومتغيرات القوالب. | صلاحية تكوين SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | حفظ أو تحديث قالب SQL حسب المعرف لإعادة استخدامه. | صلاحية تكوين SQL |
| `ctx.sql.runById(uid, options?)` | تنفيذ قالب SQL محفوظ مسبقاً باستخدام معرفه. | أي مستخدم مسجل |
| `ctx.sql.destroy(uid)` | حذف قالب SQL محدد حسب المعرف. | صلاحية تكوين SQL |

ملاحظة:

- تُستخدم `run` لتصحيح أخطاء SQL وتتطلب صلاحيات التكوين.
- تُستخدم `save` و `destroy` لإدارة قوالب SQL وتتطلب صلاحيات التكوين.
- `runById` متاحة للمستخدمين العاديين؛ حيث يمكنها فقط تنفيذ القوالب المحفوظة ولا يمكنها تصحيح أخطاء SQL أو تعديله.
- عند تعديل قالب SQL، يجب استدعاء `save` لحفظ التغييرات.

## شرح المعاملات

### خيارات (options) لـ run / runById

| المعامل | النوع | الوصف |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | متغيرات الربط. استخدم كائناً لعلامات الحجز `:name` أو مصفوفة لعلامات الحجز `?`. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | نوع النتيجة: صفوف متعددة، صف واحد، أو قيمة واحدة. الافتراضي هو `selectRows`. |
| `dataSourceKey` | `string` | معرف مصدر البيانات. الافتراضي هو مصدر البيانات الرئيسي. |
| `filter` | `Record<string, any>` | شروط تصفية إضافية (حسب دعم الواجهة). |

### خيارات (options) لـ save

| المعامل | النوع | الوصف |
|------|------|------|
| `uid` | `string` | المعرف الفريد للقالب. بمجرد حفظه، يمكن تنفيذه عبر `runById(uid, ...)`. |
| `sql` | `string` | محتوى SQL. يدعم متغيرات القوالب `{{ctx.xxx}}` وعلامات الحجز `:name` / `?`. |
| `dataSourceKey` | `string` | اختياري، معرف مصدر البيانات. |

## متغيرات قوالب SQL وربط المعاملات

### متغيرات القوالب `{{ctx.xxx}}`

يمكنك استخدام `{{ctx.xxx}}` في SQL للإشارة إلى متغيرات السياق. يتم تحليل هذه المتغيرات إلى قيم فعلية قبل التنفيذ:

```js
// الإشارة إلى ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

مصادر المتغيرات التي يمكن الإشارة إليها هي نفسها الموجودة في `ctx.getVar()` (مثل `ctx.user.*` و `ctx.record.*` و `ctx.defineProperty` المخصص، إلخ).

### ربط المعاملات

- **المعاملات المسماة (Named Parameters)**: استخدم `:name` في SQL ومرر كائناً `{ name: value }` في `bind`.
- **المعاملات الموضعية (Positional Parameters)**: استخدم `?` في SQL ومرر مصفوفة `[value1, value2]` في `bind`.

```js
// معاملات مسماة
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// معاملات موضعية
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['London', 'active'], type: 'selectVar' }
);
```

## أمثلة

### تنفيذ SQL مؤقت (يتطلب صلاحية تكوين SQL)

```js
// صفوف متعددة (افتراضي)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// صف واحد
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// قيمة واحدة (مثل COUNT، SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### استخدام متغيرات القوالب

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### حفظ القوالب وإعادة استخدامها

```js
// حفظ (يتطلب صلاحية تكوين SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// يمكن لأي مستخدم مسجل تنفيذ هذا
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// حذف القالب (يتطلب صلاحية تكوين SQL)
await ctx.sql.destroy('active-users-report');
```

### قائمة مرقمة (SQLResource)

```js
// استخدم SQLResource عندما تكون هناك حاجة للترقيم أو التصفية
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // معرف قالب SQL المحفوظ
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // يتضمن الصفحة، حجم الصفحة، إلخ.
```

## العلاقة مع ctx.resource و ctx.request

| الغرض | الاستخدام الموصى به |
|------|----------|
| **تنفيذ استعلام SQL** | `ctx.sql.run()` أو `ctx.sql.runById()` |
| **قائمة SQL مرقمة (كتلة)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **طلب HTTP عام** | `ctx.request()` |

يغلف `ctx.sql` واجهة برمجة تطبيقات `flowSql` وهو متخصص لحالات SQL؛ بينما يمكن استخدام `ctx.request` لاستدعاء أي واجهة برمجة تطبيقات.

## ملاحظات

- استخدم ربط المعاملات (`:name` / `?`) بدلاً من دمج النصوص لتجنب حقن SQL.
- `type: 'selectVar'` يعيد قيمة عددية، ويُستخدم عادةً لـ `COUNT` و `SUM` وما إلى ذلك.
- يتم حل متغيرات القوالب `{{ctx.xxx}}` قبل التنفيذ؛ تأكد من تعريف المتغيرات المقابلة في السياق.

## ذات صلة

- [ctx.resource](./resource.md): موارد البيانات؛ يستدعي SQLResource واجهة `flowSql` داخلياً.
- [ctx.initResource()](./init-resource.md): لتهيئة SQLResource للقوائم المرقمة وغيرها.
- [ctx.request()](./request.md): لطلبات HTTP العامة.