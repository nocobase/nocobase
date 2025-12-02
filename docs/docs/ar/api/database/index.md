:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# قاعدة البيانات

## نظرة عامة

تُعد Database أداة تفاعل مع قواعد البيانات يقدمها NocoBase، وتوفر إمكانيات مريحة للغاية للتفاعل مع قواعد البيانات لتطبيقات بلا تعليمات برمجية (no-code) وتطبيقات منخفضة التعليمات البرمجية (low-code). قواعد البيانات المدعومة حاليًا هي:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### الاتصال بقاعدة البيانات

في دالة إنشاء الكائن (constructor) الخاصة بـ `Database`، يمكنك تهيئة الاتصال بقاعدة البيانات عن طريق تمرير المعامل `options`.

```javascript
const { Database } = require('@nocobase/database');

// معلمات تهيئة قاعدة بيانات SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// معلمات تهيئة قاعدة بيانات MySQL \ PostgreSQL
const database = new Database({
  dialect: /* 'postgres' أو 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

للاطلاع على معلمات التهيئة التفصيلية، يرجى الرجوع إلى [دالة الإنشاء](#构造函数).

### تعريف نموذج البيانات

تُعرّف `Database` بنية قاعدة البيانات من خلال `مجموعة` (Collection). يمثل كائن `مجموعة` (Collection) جدولاً في قاعدة البيانات.

```javascript
// تعريف المجموعة
const UserCollection = database.collection({
  name: 'users',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'age',
      type: 'integer',
    },
  ],
});
```

بعد الانتهاء من تعريف بنية قاعدة البيانات، يمكنك استخدام الدالة `sync()` لمزامنة بنية قاعدة البيانات.

```javascript
await database.sync();
```

لمزيد من التفاصيل حول استخدام `مجموعة` (Collection)، يرجى الرجوع إلى [المجموعة](/api/database/collection).

### قراءة وكتابة البيانات

تُجري `Database` عمليات على البيانات من خلال `المستودع` (Repository).

```javascript
const UserRepository = UserCollection.repository();

// إنشاء
await UserRepository.create({
  name: 'جون',
  age: 18,
});

// استعلام
const user = await UserRepository.findOne({
  filter: {
    name: 'جون',
  },
});

// تعديل
await UserRepository.update({
  values: {
    age: 20,
  },
});

// حذف
await UserRepository.destroy(user.id);
```

لمزيد من التفاصيل حول استخدام عمليات CRUD للبيانات، يرجى الرجوع إلى [المستودع](/api/database/repository).

## دالة الإنشاء

**التوقيع**

- `constructor(options: DatabaseOptions)`

تُنشئ نسخة من قاعدة البيانات.

**المعلمات**

| اسم المعلمة             | النوع           | القيمة الافتراضية | الوصف                                                                                                                |
| :--------------------- | :-------------- | :------------- | :------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | مضيف قاعدة البيانات                                                                                                          |
| `options.port`         | `number`       | -             | منفذ خدمة قاعدة البيانات، مع منفذ افتراضي يتوافق مع قاعدة البيانات المستخدمة                                                                      |
| `options.username`     | `string`       | -             | اسم مستخدم قاعدة البيانات                                                                                                        |
| `options.password`     | `string`       | -             | كلمة مرور قاعدة البيانات                                                                                                          |
| `options.database`     | `string`       | -             | اسم قاعدة البيانات                                                                                                          |
| `options.dialect`      | `string`       | `'mysql'`     | نوع قاعدة البيانات                                                                                                          |
| `options.storage?`     | `string`       | `':memory:'`  | وضع التخزين لـ SQLite                                                                                                   |
| `options.logging?`     | `boolean`      | `false`       | هل يتم تمكين التسجيل (logging)                                                                                                        |
| `options.define?`      | `Object`       | `{}`          | معلمات تعريف الجدول الافتراضية                                                                                                    |
| `options.tablePrefix?` | `string`       | `''`          | امتداد NocoBase، بادئة اسم الجدول                                                                                             |
| `options.migrator?`    | `UmzugOptions` | `{}`          | امتداد NocoBase، معلمات متعلقة بمدير الترحيل (migration manager)، راجع تطبيق [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) |

## دوال متعلقة بالترحيل

### `addMigration()`

تُضيف ملف ترحيل واحد.

**التوقيع**

- `addMigration(options: MigrationItem)`

**المعلمات**

| اسم المعلمة             | النوع               | القيمة الافتراضية | الوصف                   |
| :-------------------- | :------------------ | :------ | :---------------------- |
| `options.name`       | `string`           | -      | اسم ملف الترحيل           |
| `options.context?`   | `string`           | -      | سياق ملف الترحيل       |
| `options.migration?` | `typeof Migration` | -      | فئة مخصصة لملف الترحيل     |
| `options.up`         | `Function`         | -      | دالة `up` لملف الترحيل   |
| `options.down`       | `Function`         | -      | دالة `down` لملف الترحيل |

**مثال**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* أوامر SQL للترحيل الخاصة بك */);
  },
});
```

### `addMigrations()`

تُضيف ملفات الترحيل من دليل محدد.

**التوقيع**

- `addMigrations(options: AddMigrationsOptions): void`

**المعلمات**

| اسم المعلمة             | النوع       | القيمة الافتراضية | الوصف             |
| :-------------------- | :---------- | :-------------- | :---------------- |
| `options.directory`  | `string`   | `''`           | الدليل الذي توجد به ملفات الترحيل |
| `options.extensions` | `string[]` | `['js', 'ts']` | امتدادات الملفات       |
| `options.namespace?` | `string`   | `''`           | مساحة الاسم         |
| `options.context?`   | `Object`   | `{ db }`       | سياق ملف الترحيل |

**مثال**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## دوال مساعدة

### `inDialect()`

تتحقق مما إذا كان نوع قاعدة البيانات الحالي هو أحد الأنواع المحددة.

**التوقيع**

- `inDialect(dialect: string[]): boolean`

**المعلمات**

| اسم المعلمة    | النوع       | القيمة الافتراضية | الوصف                                             |
| :--------- | :---------- | :------ | :------------------------------------------------ |
| `dialect` | `string[]` | -      | نوع قاعدة البيانات، القيم المحتملة هي `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

تُرجع بادئة اسم الجدول من التهيئة.

**التوقيع**

- `getTablePrefix(): string`

## تهيئة المجموعة

### `collection()`

تُعرّف مجموعة. هذه الدالة تشبه دالة `define` في Sequelize، حيث تُنشئ بنية الجدول في الذاكرة فقط. لجعلها دائمة في قاعدة البيانات، تحتاج إلى استدعاء دالة `sync`.

**التوقيع**

- `collection(options: CollectionOptions): Collection`

**المعلمات**

تتوافق جميع معلمات التهيئة الخاصة بـ `options` مع دالة الإنشاء لفئة `مجموعة` (Collection)، راجع [المجموعة](/api/database/collection#构造函数).

**الأحداث**

- `'beforeDefineCollection'`: يُطلق قبل تعريف المجموعة.
- `'afterDefineCollection'`: يُطلق بعد تعريف المجموعة.

**مثال**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'float',
      name: 'price',
    },
  ],
});

// مزامنة المجموعة كجدول مع قاعدة البيانات
await db.sync();
```

### `getCollection()`

تُرجع مجموعة معرفة.

**التوقيع**

- `getCollection(name: string): Collection`

**المعلمات**

| اسم المعلمة | النوع     | القيمة الافتراضية | الوصف        |
| :------ | :-------- | :------ | :----------- |
| `name` | `string` | -      | اسم المجموعة |

**مثال**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

تتحقق مما إذا كانت مجموعة محددة قد تم تعريفها.

**التوقيع**

- `hasCollection(name: string): boolean`

**المعلمات**

| اسم المعلمة | النوع     | القيمة الافتراضية | الوصف        |
| :------ | :-------- | :------ | :----------- |
| `name` | `string` | -      | اسم المجموعة |

**مثال**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

تُزيل مجموعة معرفة. يتم إزالتها من الذاكرة فقط؛ لجعل التغيير دائمًا، تحتاج إلى استدعاء دالة `sync`.

**التوقيع**

- `removeCollection(name: string): void`

**المعلمات**

| اسم المعلمة | النوع     | القيمة الافتراضية | الوصف        |
| :------ | :-------- | :------ | :----------- |
| `name` | `string` | -      | اسم المجموعة |

**الأحداث**

- `'beforeRemoveCollection'`: يُطلق قبل إزالة المجموعة.
- `'afterRemoveCollection'`: يُطلق بعد إزالة المجموعة.

**مثال**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

تستورد جميع الملفات في دليل كتهيئة للمجموعات إلى الذاكرة.

**التوقيع**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**المعلمات**

| اسم المعلمة             | النوع       | القيمة الافتراضية | الوصف             |
| :-------------------- | :---------- | :-------------- | :---------------- |
| `options.directory`  | `string`   | -              | مسار الدليل المراد استيراده |
| `options.extensions` | `string[]` | `['ts', 'js']` | مسح الامتدادات المحددة       |

**مثال**

المجموعة المعرفة في الملف `./collections/books.ts` هي كما يلي:

```ts
export default {
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
};
```

استيراد التهيئة ذات الصلة عند تحميل الإضافة:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## تسجيل واسترجاع الامتدادات

### `registerFieldTypes()`

تُسجل أنواع الحقول المخصصة.

**التوقيع**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**المعلمات**

إن `fieldTypes` عبارة عن زوج من المفتاح والقيمة، حيث يكون المفتاح هو اسم نوع الحقل والقيمة هي فئة نوع الحقل.

**مثال**

```ts
import { Field } from '@nocobase/database';

class MyField extends Field {
  // ...
}

db.registerFieldTypes({
  myField: MyField,
});
```

### `registerModels()`

تُسجل فئات نماذج البيانات المخصصة.

**التوقيع**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**المعلمات**

إن `models` عبارة عن زوج من المفتاح والقيمة، حيث يكون المفتاح هو اسم نموذج البيانات والقيمة هي فئة نموذج البيانات.

**مثال**

```ts
import { Model } from '@nocobase/database';

class MyModel extends Model {
  // ...
}

db.registerModels({
  myModel: MyModel,
});

db.collection({
  name: 'myCollection',
  model: 'myModel',
});
```

### `registerRepositories()`

تُسجل فئات المستودعات المخصصة.

**التوقيع**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**المعلمات**

إن `repositories` عبارة عن زوج من المفتاح والقيمة، حيث يكون المفتاح هو اسم المستودع والقيمة هي فئة المستودع.

**مثال**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  // ...
}

db.registerRepositories({
  myRepository: MyRepository,
});

db.collection({
  name: 'myCollection',
  repository: 'myRepository',
});
```

### `registerOperators()`

تُسجل عوامل تشغيل استعلام البيانات المخصصة.

**التوقيع**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**المعلمات**

إن `operators` عبارة عن زوج من المفتاح والقيمة، حيث يكون المفتاح هو اسم عامل التشغيل والقيمة هي الدالة التي تُنشئ عبارة المقارنة.

**مثال**

```ts
db.registerOperators({
  $dateOn(value) {
    return {
      [Op.and]: [
        { [Op.gte]: stringToDate(value) },
        { [Op.lt]: getNextDay(value) },
      ],
    };
  },
});

db.getRepository('books').count({
  filter: {
    createdAt: {
      // عامل تشغيل مسجل
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

تُرجع فئة نموذج بيانات معرفة. إذا لم يتم تسجيل فئة نموذج مخصصة مسبقًا، فستُرجع فئة نموذج Sequelize الافتراضية. الاسم الافتراضي هو نفس اسم المجموعة المعرفة.

**التوقيع**

- `getModel(name: string): Model`

**المعلمات**

| اسم المعلمة | النوع     | القيمة الافتراضية | الوصف           |
| :------ | :-------- | :------ | :------------- |
| `name` | `string` | -      | اسم النموذج المسجل |

**مثال**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

ملاحظة: فئة النموذج التي يتم الحصول عليها من مجموعة ليست متطابقة تمامًا مع فئة النموذج المسجلة، بل ترث منها. نظرًا لأن خصائص فئة نموذج Sequelize يتم تعديلها أثناء عملية التهيئة، فإن NocoBase يتعامل تلقائيًا مع علاقة الوراثة هذه. باستثناء عدم تطابق الفئة، يمكن استخدام جميع التعريفات الأخرى بشكل طبيعي.

### `getRepository()`

تُرجع فئة المستودع المخصصة. إذا لم يتم تسجيل فئة مستودع مخصصة مسبقًا، فستُرجع فئة مستودع NocoBase الافتراضية. الاسم الافتراضي هو نفس اسم المجموعة المعرفة.

تُستخدم فئات المستودعات بشكل أساسي لعمليات CRUD (الإنشاء، القراءة، التحديث، الحذف) المستندة إلى نماذج البيانات، راجع [المستودع](/api/database/repository).

**التوقيع**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**المعلمات**

| اسم المعلمة       | النوع                 | القيمة الافتراضية | الوصف               |
| :------------ | :-------------------- | :------ | :----------------- |
| `name`       | `string`             | -      | اسم المستودع المسجل |
| `relationId` | `string` \| `number` | -      | قيمة المفتاح الخارجي للبيانات العلائقية   |

عندما يكون الاسم اسمًا مرتبطًا مثل `'tables.relations'`، فإنه سيعيد فئة المستودع المرتبطة. إذا تم توفير المعلمة الثانية، فإن المستودع عند الاستخدام (الاستعلام، التحديث، إلخ) سيعتمد على قيمة المفتاح الخارجي للبيانات العلائقية.

**مثال**

لنفترض وجود مجموعتين، *المقالات* و*المؤلفون*، وأن مجموعة المقالات تحتوي على مفتاح خارجي يشير إلى مجموعة المؤلفين:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## أحداث قاعدة البيانات

### `on()`

تستمع لأحداث قاعدة البيانات.

**التوقيع**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**المعلمات**

| اسم المعلمة | النوع     | القيمة الافتراضية | الوصف        |
| :-------- | :-------- | :------ | :----------- |
| event    | string   | -      | اسم الحدث   |
| listener | Function | -      | مستمع الحدث |

تدعم أسماء الأحداث أحداث نموذج Sequelize بشكل افتراضي. بالنسبة للأحداث العامة، استمع باستخدام التنسيق `<sequelize_model_global_event>`، وبالنسبة لأحداث النموذج الفردي، استخدم التنسيق `<model_name>.<sequelize_model_event>`.

للحصول على وصف المعلمات وأمثلة تفصيلية لجميع أنواع الأحداث المضمنة، راجع قسم [الأحداث المضمنة](#内置事件).

### `off()`

تُزيل دالة مستمع الحدث.

**التوقيع**

- `off(name: string, listener: Function)`

**المعلمات**

| اسم المعلمة | النوع     | القيمة الافتراضية | الوصف        |
| :-------- | :-------- | :------ | :----------- |
| name     | string   | -      | اسم الحدث   |
| listener | Function | -      | مستمع الحدث |

**مثال**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## عمليات قاعدة البيانات

### `auth()`

مصادقة اتصال قاعدة البيانات. يمكن استخدامها للتأكد من أن التطبيق قد أقام اتصالاً بالبيانات.

**التوقيع**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**المعلمات**

| اسم المعلمة                 | النوع                  | القيمة الافتراضية | الوصف               |
| :---------------------- | :--------------------- | :------- | :----------------- |
| `options?`             | `Object`              | -        | خيارات المصادقة           |
| `options.retry?`       | `number`              | `10`     | عدد مرات إعادة المحاولة عند فشل المصادقة |
| `options.transaction?` | `Transaction`         | -        | كائن المعاملة           |
| `options.logging?`     | `boolean \| Function` | `false`  | هل يتم طباعة السجلات       |

**مثال**

```ts
await db.auth();
```

### `reconnect()`

تُعيد الاتصال بقاعدة البيانات.

**مثال**

```ts
await db.reconnect();
```

### `closed()`

تتحقق مما إذا كان اتصال قاعدة البيانات مغلقًا.

**التوقيع**

- `closed(): boolean`

### `close()`

تُغلق اتصال قاعدة البيانات. مكافئ لـ `sequelize.close()`.

### `sync()`

تُزامن بنية مجموعة قاعدة البيانات. مكافئ لـ `sequelize.sync()`، للمعلومات حول المعلمات، راجع [وثائق Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

تُفرغ قاعدة البيانات، وستحذف جميع المجموعات.

**التوقيع**

- `clean(options: CleanOptions): Promise<void>`

**المعلمات**

| اسم المعلمة                | النوع          | القيمة الافتراضية | الوصف               |
| :-------------------- | :------------- | :------- | :----------------- |
| `options.drop`        | `boolean`     | `false`  | هل يتم إسقاط جميع المجموعات |
| `options.skip`        | `string[]`    | -        | تهيئة أسماء المجموعات المراد تخطيها     |
| `options.transaction` | `Transaction` | -        | كائن المعاملة           |

**مثال**

تُزيل جميع المجموعات باستثناء مجموعة `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## صادرات مستوى الحزمة

### `defineCollection()`

تُنشئ محتوى تهيئة لمجموعة.

**التوقيع**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**المعلمات**

| اسم المعلمة              | النوع                | القيمة الافتراضية | الوصف                                |
| :------------------- | :------------------- | :------ | :----------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | نفس جميع معلمات `db.collection()` |

**مثال**

لملف تهيئة المجموعة المراد استيراده بواسطة `db.import()`:

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
  ],
});
```

### `extendCollection()`

تُوسّع محتوى تهيئة بنية المجموعة الموجودة بالفعل في الذاكرة، وتُستخدم بشكل أساسي لمحتوى الملفات المستوردة بواسطة دالة `import()`. هذه الدالة هي دالة عليا يتم تصديرها بواسطة حزمة `@nocobase/database` ولا يتم استدعاؤها عبر نسخة `db`. يمكن أيضًا استخدام الاسم المستعار `extend`.

**التوقيع**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**المعلمات**

| اسم المعلمة              | النوع                | القيمة الافتراضية | الوصف                                                           |
| :------------------- | :------------------- | :------ | :-------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | نفس جميع معلمات `db.collection()` |
| `mergeOptions?`     | `MergeOptions`      | -      | معلمات حزمة npm [deepmerge](https://npmjs.com/package/deepmerge) |

**مثال**

تعريف مجموعة الكتب الأصلية (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

تعريف مجموعة الكتب الموسعة (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// توسيع مرة أخرى
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

إذا تم استيراد الملفين أعلاه عند استدعاء `import()`، وبعد توسيعهما مرة أخرى باستخدام `extend()`، ستحتوي مجموعة الكتب على حقلي `title` و `price`.

تُعد هذه الدالة مفيدة جدًا عند توسيع هياكل المجموعات المعرفة بالفعل بواسطة الإضافات الموجودة.

## الأحداث المضمنة

تُطلق قاعدة البيانات الأحداث التالية في مراحل دورة حياتها المختلفة. يتيح الاشتراك في هذه الأحداث باستخدام دالة `on()` معالجة محددة لتلبية بعض الاحتياجات التجارية.

### `'beforeSync'` / `'afterSync'`

يُطلق قبل وبعد مزامنة تهيئة بنية مجموعة جديدة (الحقول، الفهارس، إلخ) مع قاعدة البيانات. عادةً ما يُطلق عند تنفيذ `collection.sync()` (استدعاء داخلي) ويُستخدم بشكل عام لمعالجة منطق امتدادات الحقول الخاصة.

**التوقيع**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**النوع**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**مثال**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // قم بعمل شيء ما
});

db.on('users.afterSync', async (options) => {
  // قم بعمل شيء ما
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

قبل إنشاء أو تحديث البيانات، توجد عملية تحقق تستند إلى القواعد المعرفة في المجموعة. تُطلق الأحداث المقابلة قبل وبعد التحقق. يُطلق هذا عند استدعاء `repository.create()` أو `repository.update()`.

**التوقيع**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**النوع**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**مثال**

```ts
db.collection({
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'email',
      validate: {
        isEmail: true,
      },
    },
  ],
});

// جميع النماذج
db.on('beforeValidate', async (model, options) => {
  // قم بعمل شيء ما
});
// نموذج الاختبارات
db.on('tests.beforeValidate', async (model, options) => {
  // قم بعمل شيء ما
});

// جميع النماذج
db.on('afterValidate', async (model, options) => {
  // قم بعمل شيء ما
});
// نموذج الاختبارات
db.on('tests.afterValidate', async (model, options) => {
  // قم بعمل شيء ما
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // يتحقق من تنسيق البريد الإلكتروني
  },
});
// or
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // يتحقق من تنسيق البريد الإلكتروني
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

تُطلق الأحداث المقابلة قبل وبعد إنشاء سجل. يُطلق هذا عند استدعاء `repository.create()`.

**التوقيع**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**النوع**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**مثال**

```ts
db.on('beforeCreate', async (model, options) => {
  // قم بعمل شيء ما
});

db.on('books.afterCreate', async (model, options) => {
  const { transaction } = options;
  const result = await model.constructor.findByPk(model.id, {
    transaction,
  });
  console.log(result);
});
```

### `'beforeUpdate'` / `'afterUpdate'`

تُطلق الأحداث المقابلة قبل وبعد تحديث سجل. يُطلق هذا عند استدعاء `repository.update()`.

**التوقيع**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**النوع**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**مثال**

```ts
db.on('beforeUpdate', async (model, options) => {
  // قم بعمل شيء ما
});

db.on('books.afterUpdate', async (model, options) => {
  // قم بعمل شيء ما
});
```

### `'beforeSave'` / `'afterSave'`

تُطلق الأحداث المقابلة قبل وبعد إنشاء أو تحديث سجل. يُطلق هذا عند استدعاء `repository.create()` أو `repository.update()`.

**التوقيع**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**النوع**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**مثال**

```ts
db.on('beforeSave', async (model, options) => {
  // قم بعمل شيء ما
});

db.on('books.afterSave', async (model, options) => {
  // قم بعمل شيء ما
});
```

### `'beforeDestroy'` / `'afterDestroy'`

تُطلق الأحداث المقابلة قبل وبعد حذف سجل. يُطلق هذا عند استدعاء `repository.destroy()`.

**التوقيع**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**النوع**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**مثال**

```ts
db.on('beforeDestroy', async (model, options) => {
  // قم بعمل شيء ما
});

db.on('books.afterDestroy', async (model, options) => {
  // قم بعمل شيء ما
});
```

### `'afterCreateWithAssociations'`

يُطلق هذا الحدث بعد إنشاء سجل يحتوي على بيانات ارتباط هرمية. يُطلق هذا عند استدعاء `repository.create()`.

**التوقيع**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**النوع**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**مثال**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // قم بعمل شيء ما
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // قم بعمل شيء ما
});
```

### `'afterUpdateWithAssociations'`

يُطلق هذا الحدث بعد تحديث سجل يحتوي على بيانات ارتباط هرمية. يُطلق هذا عند استدعاء `repository.update()`.

**التوقيع**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**النوع**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**مثال**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // قم بعمل شيء ما
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // قم بعمل شيء ما
});
```

### `'afterSaveWithAssociations'`

يُطلق هذا الحدث بعد إنشاء أو تحديث سجل يحتوي على بيانات ارتباط هرمية. يُطلق هذا عند استدعاء `repository.create()` أو `repository.update()`.

**التوقيع**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**النوع**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**مثال**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // قم بعمل شيء ما
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // قم بعمل شيء ما
});
```

### `'beforeDefineCollection'`

يُطلق قبل تعريف مجموعة، على سبيل المثال، عند استدعاء `db.collection()`.

ملاحظة: هذا الحدث متزامن.

**التوقيع**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**النوع**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**مثال**

```ts
db.on('beforeDefineCollection', (options) => {
  // قم بعمل شيء ما
});
```

### `'afterDefineCollection'`

يُطلق بعد تعريف مجموعة، على سبيل المثال، عند استدعاء `db.collection()`.

ملاحظة: هذا الحدث متزامن.

**التوقيع**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**النوع**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**مثال**

```ts
db.on('afterDefineCollection', (collection) => {
  // قم بعمل شيء ما
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

يُطلق قبل وبعد إزالة مجموعة من الذاكرة، على سبيل المثال، عند استدعاء `db.removeCollection()`.

ملاحظة: هذا الحدث متزامن.

**التوقيع**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**النوع**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**مثال**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // قم بعمل شيء ما
});

db.on('afterRemoveCollection', (collection) => {
  // قم بعمل شيء ما
});
```