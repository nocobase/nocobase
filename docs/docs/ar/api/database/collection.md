:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# مجموعة

## نظرة عامة

تُستخدم `مجموعة` لتعريف نماذج البيانات في النظام، مثل أسماء النماذج، الحقول، الفهارس، والارتباطات، وغيرها من المعلومات.
يتم استدعاؤها عادةً عبر طريقة `collection` الخاصة بنسخة `Database` كمدخل وكيل.

```javascript
const { Database } = require('@nocobase/database')

// إنشاء نسخة قاعدة بيانات
const db = new Database({...});

// تعريف نموذج بيانات
db.collection({
  name: 'users',
  // تعريف حقول النموذج
  fields: [
    // حقل قياسي
    {
      name: 'name',
      type: 'string',
    },

    // حقل ارتباط
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

لمزيد من أنواع الحقول، يرجى الرجوع إلى [الحقول](/api/database/field).

## الدالة الإنشائية (Constructor)

**التوقيع**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**المعلمات**

| المعلمة                | النوع                                                        | القيمة الافتراضية | الوصف                                                                                   |
| --------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -      | معرف المجموعة                                                                        |
| `options.tableName?`  | `string`                                                    | -      | اسم جدول قاعدة البيانات. إذا لم يتم توفيره، فسيتم استخدام قيمة `options.name`.            |
| `options.fields?`     | `FieldOptions[]`                                            | -      | تعريفات الحقول. انظر [الحقل](./field) لمزيد من التفاصيل.                                                        |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -      | نوع نموذج Sequelize. إذا تم استخدام `string`، فيجب أن يكون اسم النموذج قد تم تسجيله مسبقًا في قاعدة البيانات. |
| `options.repository?` | `string \| RepositoryType`                                  | -      | نوع المستودع. إذا تم استخدام `string`، فيجب أن يكون نوع المستودع قد تم تسجيله مسبقًا في قاعدة البيانات.                |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -      | تهيئة حقل قابل للفرز. غير قابل للفرز افتراضيًا.                                                         |
| `options.autoGenId?`  | `boolean`                                                   | `true` | ما إذا كان سيتم إنشاء مفتاح أساسي فريد تلقائيًا. القيمة الافتراضية هي `true`.                                                    |
| `context.database`    | `Database`                                                  | -      | قاعدة البيانات في السياق الحالي.                                                                 |

**مثال**

إنشاء مجموعة للمقالات:

```ts
const posts = new Collection(
  {
    name: 'posts',
    fields: [
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'double',
        name: 'price',
      },
    ],
  },
  {
    // نسخة قاعدة بيانات موجودة
    database: db,
  },
);
```

## أعضاء النسخة

### `options`

معلمات التهيئة الأولية للمجموعة. مطابقة لمعلمة `options` الخاصة بالدالة الإنشائية.

### `context`

السياق الذي تنتمي إليه المجموعة الحالية، وهو حاليًا نسخة قاعدة البيانات بشكل أساسي.

### `name`

اسم المجموعة.

### `db`

نسخة قاعدة البيانات التي تنتمي إليها.

### `filterTargetKey`

اسم الحقل المستخدم كمفتاح أساسي.

### `isThrough`

ما إذا كانت مجموعة وسيطة.

### `model`

يطابق نوع نموذج Sequelize.

### `repository`

نسخة المستودع.

## طرق تهيئة الحقول

### `getField()`

يحصل على كائن الحقل بالاسم المقابل المعرّف في المجموعة.

**التوقيع**

- `getField(name: string): Field`

**المعلمات**

| المعلمة | النوع     | القيمة الافتراضية | الوصف     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | اسم الحقل |

**مثال**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const field = posts.getField('title');
```

### `setField()`

يقوم بتعيين حقل للمجموعة.

**التوقيع**

- `setField(name: string, options: FieldOptions): Field`

**المعلمات**

| المعلمة    | النوع           | القيمة الافتراضية | الوصف                            |
| --------- | -------------- | ------ | ------------------------------- |
| `name`    | `string`       | -      | اسم الحقل                        |
| `options` | `FieldOptions` | -      | تهيئة الحقل. انظر [الحقل](./field) لمزيد من التفاصيل. |

**مثال**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

يقوم بتعيين حقول متعددة للمجموعة دفعة واحدة.

**التوقيع**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**المعلمات**

| المعلمة        | النوع             | القيمة الافتراضية | الوصف                            |
| ------------- | ---------------- | ------ | ------------------------------- |
| `fields`      | `FieldOptions[]` | -      | تهيئة الحقول. انظر [الحقل](./field) لمزيد من التفاصيل. |
| `resetFields` | `boolean`        | `true` | ما إذا كان سيتم إعادة تعيين الحقول الموجودة.            |

**مثال**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

يزيل كائن الحقل بالاسم المقابل المعرّف في المجموعة.

**التوقيع**

- `removeField(name: string): void | Field`

**المعلمات**

| المعلمة | النوع     | القيمة الافتراضية | الوصف     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | اسم الحقل |

**مثال**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.removeField('title');
```

### `resetFields()`

يعيد تعيين (يمسح) حقول المجموعة.

**التوقيع**

- `resetFields(): void`

**مثال**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.resetFields();
```

### `hasField()`

يتحقق مما إذا كان كائن حقل بالاسم المقابل معرّفًا في المجموعة.

**التوقيع**

- `hasField(name: string): boolean`

**المعلمات**

| المعلمة | النوع     | القيمة الافتراضية | الوصف     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | اسم الحقل |

**مثال**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.hasField('title'); // true
```

### `findField()`

يبحث عن كائن حقل في المجموعة يطابق المعايير.

**التوقيع**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**المعلمات**

| المعلمة      | النوع                        | القيمة الافتراضية | الوصف     |
| ----------- | --------------------------- | ------ | -------- |
| `predicate` | `(field: Field) => boolean` | -      | معايير البحث |

**مثال**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.findField((field) => field.name === 'title');
```

### `forEachField()`

يتكرر على كائنات الحقول في المجموعة.

**التوقيع**

- `forEachField(callback: (field: Field) => void): void`

**المعلمات**

| المعلمة     | النوع                     | القيمة الافتراضية | الوصف     |
| ---------- | ------------------------ | ------ | -------- |
| `callback` | `(field: Field) => void` | -      | دالة رد الاتصال |

**مثال**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.forEachField((field) => console.log(field.name));
```

## طرق تهيئة الفهارس

### `addIndex()`

يضيف فهرسًا إلى المجموعة.

**التوقيع**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**المعلمات**

| المعلمة  | النوع                                                         | القيمة الافتراضية | الوصف                 |
| ------- | ------------------------------------------------------------ | ------ | -------------------- |
| `index` | `string \| string[]`                                         | -      | اسم (أسماء) الحقل المراد فهرسته. |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | -      | التهيئة الكاملة.             |

**مثال**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.addIndex({
  fields: ['title'],
  unique: true,
});
```

### `removeIndex()`

يزيل فهرسًا من المجموعة.

**التوقيع**

- `removeIndex(fields: string[])`

**المعلمات**

| المعلمة   | النوع       | القيمة الافتراضية | الوصف                     |
| -------- | ---------- | ------ | ------------------------ |
| `fields` | `string[]` | -      | مجموعة أسماء الحقول للفهرس المراد إزالته. |

**مثال**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true,
    },
  ],
});

posts.removeIndex(['title']);
```

## طرق تهيئة المجموعة

### `remove()`

يحذف المجموعة.

**التوقيع**

- `remove(): void`

**مثال**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.remove();
```

## طرق عمليات قاعدة البيانات

### `sync()`

يقوم بمزامنة تعريف المجموعة مع قاعدة البيانات. بالإضافة إلى المنطق الافتراضي لـ `Model.sync` في Sequelize، فإنه يعالج أيضًا المجموعات المقابلة لحقول الارتباط.

**التوقيع**

- `sync(): Promise<void>`

**مثال**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

await posts.sync();
```

### `existsInDb()`

يتحقق مما إذا كانت المجموعة موجودة في قاعدة البيانات.

**التوقيع**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**المعلمات**

| المعلمة                 | النوع          | القيمة الافتراضية | الوصف     |
| ---------------------- | ------------- | ------ | -------- |
| `options?.transaction` | `Transaction` | -      | نسخة المعاملة |

**مثال**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const existed = await posts.existsInDb();

console.log(existed); // false
```

### `removeFromDb()`

**التوقيع**

- `removeFromDb(): Promise<void>`

**مثال**

```ts
const books = db.collection({
  name: 'books',
});

// مزامنة مجموعة الكتب مع قاعدة البيانات
await db.sync();

// إزالة مجموعة الكتب من قاعدة البيانات
await books.removeFromDb();
```