:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# ResourceManager إدارة الموارد

تتيح ميزة إدارة الموارد في NocoBase تحويل المجموعات (collection) والارتباطات (association) الموجودة تلقائيًا إلى موارد، وتوفر أنواع عمليات مدمجة لمساعدة المطورين على بناء عمليات موارد REST API بسرعة. على عكس واجهات REST API التقليدية، لا تعتمد عمليات موارد NocoBase على طرق طلب HTTP، بل تحدد العملية المحددة التي سيتم تنفيذها من خلال تعريف صريح لـ `:action`.

## توليد الموارد تلقائيًا

يحول NocoBase تلقائيًا `collection` و `association` المعرفة في قاعدة البيانات إلى موارد. على سبيل المثال، عند تعريف مجموعتين (collection) هما `posts` و `tags`:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

سيؤدي هذا إلى توليد الموارد التالية تلقائيًا:

*   مورد `posts`
*   مورد `tags`
*   مورد الارتباط `posts.tags`

أمثلة على الطلبات:

| طريقة الطلب | المسار                     | العملية      |
| -------- | ---------------------- | -------------- |
| `GET`  | `/api/posts:list`      | استعلام القائمة |
| `GET`  | `/api/posts:get/1`     | استعلام فردي |
| `POST` | `/api/posts:create`    | إضافة جديد |
| `POST` | `/api/posts:update/1`  | تحديث |
| `POST` | `/api/posts:destroy/1` | حذف |

| طريقة الطلب | المسار                   | العملية      |
| -------- | ---------------------- | -------------- |
| `GET`  | `/api/tags:list`       | استعلام القائمة |
| `GET`  | `/api/tags:get/1`      | استعلام فردي |
| `POST` | `/api/tags:create`     | إضافة جديد |
| `POST` | `/api/tags:update/1`   | تحديث |
| `POST` | `/api/tags:destroy/1`  | حذف |

| طريقة الطلب | المسار                           | العملية                            |
| -------- | ------------------------------ | ------------------------------------ |
| `GET`  | `/api/posts/1/tags:list`       | استعلام عن جميع `tags` المرتبطة بـ `post` معين |
| `GET`  | `/api/posts/1/tags:get/1`      | استعلام عن `tag` فردي ضمن `post` معين |
| `POST` | `/api/posts/1/tags:create`     | إنشاء `tag` فردي ضمن `post` معين |
| `POST` | `/api/posts/1/tags:update/1`   | تحديث `tag` فردي ضمن `post` معين |
| `POST` | `/api/posts/1/tags:destroy/1`  | حذف `tag` فردي ضمن `post` معين |
| `POST` | `/api/posts/1/tags:add`        | إضافة `tags` مرتبطة إلى `post` معين |
| `POST` | `/api/posts/1/tags:remove`     | إزالة `tags` مرتبطة من `post` معين |
| `POST` | `/api/posts/1/tags:set`        | تعيين جميع `tags` المرتبطة لـ `post` معين |
| `POST` | `/api/posts/1/tags:toggle`     | تبديل ارتباط `tags` لـ `post` معين |

:::tip تلميح

لا تعتمد عمليات موارد NocoBase بشكل مباشر على طرق الطلب، بل تحدد العمليات من خلال تعريفات `:action` الصريحة.

:::

## عمليات الموارد

يوفر NocoBase أنواع عمليات مدمجة غنية لتلبية مختلف احتياجات العمل.

### عمليات CRUD الأساسية

| اسم العملية      | الوصف                                | أنواع الموارد المطبقة | طريقة الطلب | مسار المثال                  |
| --------------- | ------------------------------------ | -------------------- | ----------- | --------------------------- |
| `list`          | استعلام بيانات القائمة               | الكل                 | GET/POST    | `/api/posts:list`           |
| `get`           | استعلام بيانات فردية                 | الكل                 | GET/POST    | `/api/posts:get/1`          |
| `create`        | إنشاء سجل جديد                       | الكل                 | POST        | `/api/posts:create`         |
| `update`        | تحديث سجل                           | الكل                 | POST        | `/api/posts:update/1`       |
| `destroy`       | حذف سجل                             | الكل                 | POST        | `/api/posts:destroy/1`      |
| `firstOrCreate` | البحث عن أول سجل، وإنشاؤه إذا لم يكن موجودًا | الكل                 | POST        | `/api/users:firstOrCreate`  |
| `updateOrCreate`| تحديث سجل، وإنشاؤه إذا لم يكن موجودًا    | الكل                 | POST        | `/api/users:updateOrCreate` |

### عمليات العلاقة

| اسم العملية | الوصف                 | أنواع العلاقة المطبقة                                   | مسار المثال                   |
| ----------- | --------------------- | ------------------------------------------------------- | ------------------------------ |
| `add`       | إضافة ارتباط           | `hasMany`, `belongsToMany`                              | `/api/posts/1/tags:add`        |
| `remove`    | إزالة ارتباط           | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo`       | `/api/posts/1/comments:remove` |
| `set`       | إعادة تعيين الارتباط | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo`       | `/api/posts/1/comments:set`    |
| `toggle`    | إضافة أو إزالة ارتباط | `belongsToMany`                                         | `/api/posts/1/tags:toggle`     |

### معلمات العملية

تشمل معلمات العملية الشائعة ما يلي:

*   `filter`: شروط الاستعلام
*   `values`: القيم المراد تعيينها
*   `fields`: تحديد الحقول المراد إرجاعها
*   `appends`: تضمين البيانات المرتبطة
*   `except`: استبعاد الحقول
*   `sort`: قواعد الفرز
*   `page`، `pageSize`: معلمات الترحيل
*   `paginate`: هل يتم تمكين الترحيل
*   `tree`: هل يتم إرجاع بنية شجرية
*   `whitelist`، `blacklist`: القائمة البيضاء/السوداء للحقول
*   `updateAssociationValues`: هل يتم تحديث قيم الارتباط

## عمليات الموارد المخصصة

يسمح NocoBase بتسجيل عمليات إضافية للموارد الموجودة. يمكنك استخدام `registerActionHandlers` لتخصيص العمليات لجميع الموارد أو لموارد محددة.

### تسجيل العمليات العامة

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### تسجيل العمليات لموارد محددة

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

أمثلة على الطلبات:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

قاعدة التسمية: `resourceName:actionName`، استخدم صيغة النقطة (`posts.comments`) عند تضمين الارتباطات.

## الموارد المخصصة

إذا كنت بحاجة إلى توفير موارد لا ترتبط بالمجموعات (collection)، يمكنك استخدام طريقة `resourceManager.define` لتعريفها:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

تتفق طرق الطلب مع الموارد التي يتم توليدها تلقائيًا:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (يدعم GET/POST افتراضيًا)

## البرمجيات الوسيطة المخصصة (Middleware)

استخدم طريقة `resourceManager.use()` لتسجيل البرمجيات الوسيطة العامة (global middleware). على سبيل المثال:

برمجية وسيطة عامة للتسجيل (logging)

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## خصائص السياق الخاصة (Context Properties)

القدرة على الدخول إلى البرمجيات الوسيطة (middleware) أو الإجراء (action) في طبقة `resourceManager` تعني أن هذا المورد موجود حتمًا.

### `ctx.action`

*   `ctx.action.actionName`: اسم العملية
*   `ctx.action.resourceName`: قد يكون مجموعة (collection) أو ارتباطًا (association)
*   `ctx.action.params`: معلمات العملية

### `ctx.dataSource`

كائن مصدر البيانات الحالي

### `ctx.getCurrentRepository()`

كائن المستودع (repository) الحالي

## كيفية الحصول على كائنات `resourceManager` لمصادر بيانات مختلفة

ينتمي `resourceManager` إلى مصدر بيانات، ويمكن تسجيل العمليات بشكل منفصل لمصادر البيانات المختلفة.

### مصدر البيانات الرئيسي

بالنسبة لمصدر البيانات الرئيسي، يمكنك استخدام `app.resourceManager` مباشرة لتنفيذ العمليات:

```ts
app.resourceManager.registerActionHandlers();
```

### مصادر البيانات الأخرى

بالنسبة لمصادر البيانات الأخرى، يمكنك الحصول على مثيل مصدر بيانات محدد عبر `dataSourceManager`، ثم استخدام `resourceManager` الخاص بهذا المثيل لتنفيذ العمليات:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### التكرار عبر جميع مصادر البيانات

إذا كنت بحاجة إلى تنفيذ نفس العمليات على جميع مصادر البيانات المضافة، يمكنك استخدام طريقة `dataSourceManager.afterAddDataSource` للتكرار، مما يضمن أن `resourceManager` لكل مصدر بيانات يمكنه تسجيل العمليات المقابلة:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```