:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# المستودع (Repository)

## نظرة عامة

على كائن `Collection` معين، يمكنك الحصول على كائن `Repository` الخاص به لإجراء عمليات القراءة والكتابة على المجموعة (Collection).

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'new name';
await user.save();
```

### الاستعلام

#### الاستعلام الأساسي

على كائن `Repository`، يمكنك استدعاء الطرق المتعلقة بـ `find*` لإجراء عمليات الاستعلام. تدعم جميع طرق الاستعلام تمرير المعامل `filter` لتصفية البيانات.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### عوامل التشغيل

يوفر المعامل `filter` في `Repository` أيضًا مجموعة متنوعة من عوامل التشغيل لإجراء عمليات استعلام أكثر تنوعًا.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%张%' } }],
  },
});
```

لمزيد من التفاصيل حول عوامل التشغيل، يرجى الرجوع إلى [عوامل تصفية البيانات (Filter Operators)](/api/database/operators).

#### التحكم في الحقول

عند إجراء عملية استعلام، يمكنك التحكم في الحقول الناتجة من خلال المعاملات `fields` و `except` و `appends`.

-   `fields`: لتحديد الحقول المراد إخراجها
-   `except`: لاستبعاد الحقول من الإخراج
-   `appends`: لإضافة الحقول المرتبطة إلى الإخراج

```javascript
// 获取的结果只包含 id 和 name 字段
userRepository.find({
  fields: ['id', 'name'],
});

// 获取的结果不包含 password 字段
userRepository.find({
  except: ['password'],
});

// 获取的结果会包含关联对象 posts 的数据
userRepository.find({
  appends: ['posts'],
});
```

#### الاستعلام عن الحقول المرتبطة

يدعم المعامل `filter` التصفية حسب الحقول المرتبطة، على سبيل المثال:

```javascript
// 查询 user 对象，其所关联的 posts 存在 title 为 'post title' 的对象
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

يمكن أيضًا تداخل الحقول المرتبطة.

```javascript
// 查询 user 对象，查询结果满足其 posts 的 comments 包含 keywords
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### الفرز

يمكنك فرز نتائج الاستعلام باستخدام المعامل `sort`.

```javascript
// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age',
});

// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age',
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', 'name'],
});
```

يمكنك أيضًا الفرز حسب حقول الكائنات المرتبطة.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### الإنشاء

#### الإنشاء الأساسي

أنشئ كائنات بيانات جديدة من خلال `Repository`.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// 支持批量创建
await userRepository.create([
  {
    name: '张三',
    age: 18,
  },
  {
    name: '李四',
    age: 20,
  },
]);
```

#### إنشاء الارتباطات

عند الإنشاء، يمكنك أيضًا إنشاء كائنات مرتبطة في نفس الوقت. على غرار الاستعلام، يدعم هذا أيضًا الاستخدام المتداخل للكائنات المرتبطة، على سبيل المثال:

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          name: 'tag1',
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
// 创建用户的同时，创建 post 与用户关联，创建 tags 与 post 相关联。
```

إذا كان الكائن المرتبط موجودًا بالفعل في قاعدة البيانات، يمكنك تمرير معرفه (ID) لإنشاء ارتباط به أثناء عملية الإنشاء.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // 建立与已存在关联对象的关联关系
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### التحديث

#### التحديث الأساسي

بعد الحصول على كائن بيانات، يمكنك تعديل خصائصه مباشرة على كائن البيانات (`Model`) ثم استدعاء طريقة `save` لحفظ التغييرات.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

يرث كائن البيانات `Model` من Sequelize Model. لعمليات على `Model`، يرجى الرجوع إلى [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

يمكنك أيضًا تحديث البيانات من خلال `Repository`:

```javascript
// 修改满足筛选条件的数据记录
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

عند التحديث، يمكنك التحكم في الحقول التي يتم تحديثها باستخدام المعاملين `whitelist` و `blacklist`، على سبيل المثال:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // 仅更新 age 字段
});
```

#### تحديث الحقول المرتبطة

عند التحديث، يمكنك تعيين الكائنات المرتبطة، على سبيل المثال:

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1,
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    title: 'new post title',
    tags: [
      {
        id: tag1.id, // 与 tag1 建立关联
      },
      {
        name: 'tag2', // 创建新的 tag 并建立关联
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // 解除 post 与 tags 的关联
  },
});
```

### الحذف

يمكنك استدعاء طريقة `destroy()` في `Repository` لإجراء عملية حذف. عند الحذف، يجب تحديد معايير التصفية:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## الدالة الإنشائية (Constructor)

لا يتم استدعاؤها عادةً مباشرة من قبل المطورين. يتم إنشاؤها بشكل أساسي بعد تسجيل النوع عبر `db.registerRepositories()` وتحديد نوع المستودع المسجل المقابل في معاملات `db.collection()`، ثم إتمام عملية الإنشاء.

**التوقيع (Signature)**

-   `constructor(collection: Collection)`

**مثال**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository,
});

db.collection({
  name: 'books',
  // here link to the registered repository
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## أعضاء الكائن (Instance Members)

### `database`

كائن إدارة قاعدة البيانات الخاص بالسياق.

### `collection`

كائن إدارة المجموعة (Collection) المقابل.

### `model`

فئة النموذج (Model) المقابلة.

## طرق الكائن (Instance Methods)

### `find()`

تستعلم عن مجموعة بيانات من قاعدة البيانات، ويمكنها تحديد شروط التصفية والفرز وغيرها.

**التوقيع (Signature)**

-   `async find(options?: FindOptions): Promise<Model[]>`

**النوع (Type)**

```typescript
type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;
type Appends = string[];
type Except = string[];
type Fields = string[];
type Sort = string[] | string;

interface SequelizeFindOptions {
  limit?: number;
  offset?: number;
}

interface FilterByTk {
  filterByTk?: TargetKey;
}

interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;
```

**التفاصيل**

#### `filter: Filter`

شرط الاستعلام، يستخدم لتصفية نتائج البيانات. في معاملات الاستعلام الممررة، `key` هو اسم الحقل المراد الاستعلام عنه، و `value` يمكن أن يكون القيمة المراد الاستعلام عنها، أو يمكن استخدامه مع عوامل التشغيل لتصفية البيانات بشروط أخرى.

```typescript
// 查询 name 为 foo，并且 age 大于 18 的记录
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

لمزيد من عوامل التشغيل، يرجى الرجوع إلى [عوامل تشغيل الاستعلام](./operators.md).

#### `filterByTk: TargetKey`

تستعلم عن البيانات بواسطة `TargetKey`، وهي طريقة ملائمة لمعامل `filter`. يمكن [تكوين](./collection.md#filtertargetkey) الحقل المحدد لـ `TargetKey` في `Collection`، والقيمة الافتراضية هي `primaryKey`.

```typescript
// 默认情况下，查找 id 为 1 的记录
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

أعمدة الاستعلام، تستخدم للتحكم في نتائج حقول البيانات. بعد تمرير هذا المعامل، سيتم إرجاع الحقول المحددة فقط.

#### `except: string[]`

أعمدة الاستبعاد، تستخدم للتحكم في نتائج حقول البيانات. بعد تمرير هذا المعامل، لن يتم إخراج الحقول الممررة.

#### `appends: string[]`

أعمدة الإلحاق، تستخدم لتحميل البيانات المرتبطة. بعد تمرير هذا المعامل، سيتم إخراج الحقول المرتبطة المحددة أيضًا.

#### `sort: string[] | string`

تحدد طريقة فرز نتائج الاستعلام. المعامل هو اسم الحقل، والذي يتم فرزه افتراضيًا بترتيب تصاعدي `asc`. للفرز بترتيب تنازلي `desc`، أضف رمز `-` قبل اسم الحقل، على سبيل المثال: `['-id', 'name']`، مما يعني الفرز حسب `id desc, name asc`.

#### `limit: number`

يحدد عدد النتائج، وهو مماثل لـ `limit` في `SQL`.

#### `offset: number`

إزاحة الاستعلام، وهي مماثلة لـ `offset` في `SQL`.

**مثال**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    },
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

تستعلم عن سجل بيانات واحد من قاعدة البيانات يطابق شروطًا محددة. يعادل `Model.findOne()` في Sequelize.

**التوقيع (Signature)**

-   `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**مثال**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

تستعلم عن العدد الإجمالي لسجلات البيانات التي تطابق شروطًا محددة من قاعدة البيانات. يعادل `Model.count()` في Sequelize.

**التوقيع (Signature)**

-   `count(options?: CountOptions): Promise<number>`

**النوع (Type)**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**مثال**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

تستعلم عن مجموعة بيانات والعدد الإجمالي للنتائج التي تطابق شروطًا محددة من قاعدة البيانات. يعادل `Model.findAndCountAll()` في Sequelize.

**التوقيع (Signature)**

-   `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**النوع (Type)**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**التفاصيل**

معاملات الاستعلام هي نفسها المستخدمة في `find()`. القيمة المعادة هي مصفوفة، العنصر الأول فيها هو نتيجة الاستعلام، والعنصر الثاني هو العدد الإجمالي للنتائج.

### `create()`

تُدرج سجل بيانات جديدًا في المجموعة (Collection). يعادل `Model.create()` في Sequelize. عندما يحمل كائن البيانات المراد إنشاؤه معلومات عن حقول العلاقات، سيتم إنشاء أو تحديث سجلات بيانات العلاقة المقابلة أيضًا.

**التوقيع (Signature)**

-   `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**مثال**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // 有关系表主键值时为更新该条数据
      { id: 1 },
      // 没有主键值时为创建新数据
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

تُدرج عدة سجلات بيانات جديدة في المجموعة (Collection). يعادل استدعاء طريقة `create()` عدة مرات.

**التوقيع (Signature)**

-   `createMany(options: CreateManyOptions): Promise<Model[]>`

**النوع (Type)**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**التفاصيل**

-   `records`: مصفوفة من كائنات البيانات للسجلات المراد إنشاؤها.
-   `transaction`: كائن المعاملة (transaction). إذا لم يتم تمرير معامل معاملة، فستقوم هذه الطريقة تلقائيًا بإنشاء معاملة داخلية.

**مثال**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // 有关系表主键值时为更新该条数据
        { id: 1 },
        // 没有主键值时为创建新数据
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 发布日志',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

تُحدّث البيانات في المجموعة (Collection). يعادل `Model.update()` في Sequelize. عندما يحمل كائن البيانات المراد تحديثه معلومات عن حقول العلاقات، سيتم إنشاء أو تحديث سجلات بيانات العلاقة المقابلة أيضًا.

**التوقيع (Signature)**

-   `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**مثال**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // 有关系表主键值时为更新该条数据
      { id: 1 },
      // 没有主键值时为创建新数据
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

تحذف البيانات من المجموعة (Collection). يعادل `Model.destroy()` في Sequelize.

**التوقيع (Signature)**

-   `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**النوع (Type)**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**التفاصيل**

-   `filter`: يحدد شروط التصفية للسجلات المراد حذفها. للاستخدام المفصل لـ Filter، يرجى الرجوع إلى طريقة [`find()`](#find).
-   `filterByTk`: يحدد شروط التصفية للسجلات المراد حذفها بواسطة TargetKey.
-   `truncate`: ما إذا كان سيتم تفريغ بيانات المجموعة (Collection)، ويكون فعالاً عند عدم تمرير المعامل `filter` أو `filterByTk`.
-   `transaction`: كائن المعاملة (transaction). إذا لم يتم تمرير معامل معاملة، فستقوم هذه الطريقة تلقائيًا بإنشاء معاملة داخلية.