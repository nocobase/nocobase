:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# מאגר

## סקירה כללית

על אובייקט `אוסף` נתון, ניתן לקבל את אובייקט ה-`Repository` שלו כדי לבצע פעולות קריאה וכתיבה בטבלת הנתונים.

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

### שאילתה

#### שאילתה בסיסית

על אובייקט ה-`Repository`, קראו למתודות הקשורות ל-`find*` כדי לבצע פעולות שאילתה. כל מתודות השאילתה תומכות בהעברת פרמטר `filter` לסינון נתונים.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### אופרטורים

פרמטר ה-`filter` ב-`Repository` מספק גם מגוון אופרטורים לביצוע פעולות שאילתה מגוונות יותר.

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

לפרטים נוספים על אופרטורים, עיינו ב-[אופרטורי סינון](/api/database/operators).

#### בקרת שדות

בעת ביצוע פעולת שאילתה, ניתן לשלוט בשדות הפלט באמצעות הפרמטרים `fields`, `except` ו-`appends`.

- `fields`: מציין שדות פלט
- `except`: מדיר שדות פלט
- `appends`: מצרף שדות קשורים לפלט

```javascript
// The result will only include id and name fields
userRepository.find({
  fields: ['id', 'name'],
});

// The result will not include the password field
userRepository.find({
  except: ['password'],
});

// The result will include data from the associated object posts
userRepository.find({
  appends: ['posts'],
});
```

#### שאילתת שדות קשורים

פרמטר ה-`filter` תומך בסינון לפי שדות קשורים, לדוגמה:

```javascript
// Query for user objects whose associated posts have an object with the title 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

שדות קשורים יכולים להיות מקוננים גם כן.

```javascript
// Query for user objects where the comments of their posts contain keywords
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### מיון

ניתן למיין את תוצאות השאילתה באמצעות פרמטר ה-`sort`.

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

ניתן גם למיין לפי שדות של אובייקטים קשורים.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### יצירה

#### יצירה בסיסית

צרו אובייקטי נתונים חדשים באמצעות ה-`Repository`.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// Supports bulk creation
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

#### יצירת קשרים

בעת יצירה, ניתן ליצור גם אובייקטים קשורים בו-זמנית. בדומה לשאילתה, נתמכת גם שימוש מקונן באובייקטים קשורים, לדוגמה:

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
// When creating a user, a post is created and associated with the user, and tags are created and associated with the post.
```

אם האובייקט הקשור כבר קיים במסד הנתונים, ניתן להעביר את ה-ID שלו כדי ליצור קשר איתו במהלך היצירה.

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
          id: tag1.id, // Establish an association with an existing associated object
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### עדכון

#### עדכון בסיסי

לאחר קבלת אובייקט נתונים, ניתן לשנות ישירות את המאפיינים שלו על אובייקט הנתונים (`Model`) ולאחר מכן לקרוא למתודת `save` כדי לשמור את השינויים.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

אובייקט הנתונים `Model` יורש מ-Sequelize Model. לפעולות על ה-`Model`, עיינו ב-[Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

ניתן גם לעדכן נתונים באמצעות ה-`Repository`:

```javascript
// Update data records that meet the filter criteria
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

בעת עדכון, ניתן לשלוט באילו שדות מתעדכנים באמצעות הפרמטרים `whitelist` ו-`blacklist`, לדוגמה:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // Only update the age field
});
```

#### עדכון שדות קשורים

בעת עדכון, ניתן להגדיר אובייקטים קשורים, לדוגמה:

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
        id: tag1.id, // Establish an association with tag1
      },
      {
        name: 'tag2', // Create a new tag and establish an association
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Disassociate the post from the tags
  },
});
```

### מחיקה

ניתן לקרוא למתודת `destroy()` ב-`Repository` כדי לבצע פעולת מחיקה. יש לציין קריטריוני סינון בעת מחיקה:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## בנאי

בדרך כלל אינו נקרא ישירות על ידי מפתחים. הוא מופעל בעיקר לאחר רישום הסוג באמצעות `db.registerRepositories()` וציון סוג המאגר הרשום המתאים בפרמטרים של `db.collection()`.

**Signature**

- `constructor(collection: Collection)`

**Example**

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

## חברי מופע

### `database`

מופע ניהול מסד הנתונים של ההקשר.

### `collection`

מופע ניהול ה**אוסף** המתאים.

### `model`

מחלקת המודל המתאימה.

## מתודות מופע

### `find()`

שולף מערך נתונים ממסד הנתונים, ומאפשר ציון תנאי סינון, מיון וכדומה.

**Signature**

- `async find(options?: FindOptions): Promise<Model[]>`

**Type**

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

**פרטים**

#### `filter: Filter`

תנאי שאילתה המשמש לסינון תוצאות נתונים. בפרמטרי השאילתה המועברים, `key` הוא שם השדה לשאילתה, ו-`value` יכול להיות הערך לשאילתה או לשמש עם אופרטורים לסינון נתונים מותנה אחר.

```typescript
// Query for records where name is 'foo' and age is greater than 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

לאופרטורים נוספים, עיינו ב-[אופרטורי שאילתה](./operators.md).

#### `filterByTk: TargetKey`

שולף נתונים לפי `TargetKey`, שהיא מתודה נוחה לפרמטר `filter`. השדה הספציפי עבור `TargetKey` יכול להיות [מוגדר](./collection.md#filtertargetkey) ב**אוסף**, ובברירת מחדל הוא `primaryKey`.

```typescript
// By default, finds the record with id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

עמודות שאילתה, המשמשות לשליטה בתוצאות שדות הנתונים. לאחר העברת פרמטר זה, רק השדות שצוינו יוחזרו.

#### `except: string[]`

עמודות מוחרגות, המשמשות לשליטה בתוצאות שדות הנתונים. לאחר העברת פרמטר זה, השדות שהועברו לא יוצגו בפלט.

#### `appends: string[]`

עמודות מצורפות, המשמשות לטעינת נתונים קשורים. לאחר העברת פרמטר זה, גם שדות הקישור שצוינו יוצגו בפלט.

#### `sort: string[] | string`

מציין את שיטת המיון עבור תוצאות השאילתה. הפרמטר הוא שם השדה, אשר ברירת המחדל שלו היא סדר עולה (`asc`). עבור סדר יורד (`desc`), הוסיפו סימן `-` לפני שם השדה, לדוגמה: `['-id', 'name']`, שמשמעותו מיון לפי `id desc, name asc`.

#### `limit: number`

מגביל את מספר התוצאות, בדומה ל-`limit` ב-`SQL`.

#### `offset: number`

היסט שאילתה, בדומה ל-`offset` ב-`SQL`.

**דוגמה**

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

שולף פריט נתונים יחיד ממסד הנתונים העונה לקריטריונים ספציפיים. שקול ל-`Model.findOne()` ב-Sequelize.

**Signature**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**דוגמה**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

שולף את המספר הכולל של רשומות נתונים העונות לקריטריונים ספציפיים ממסד הנתונים. שקול ל-`Model.count()` ב-Sequelize.

**Signature**

- `count(options?: CountOptions): Promise<number>`

**Type**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**דוגמה**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

שולף מערך נתונים ואת המספר הכולל של התוצאות העונות לקריטריונים ספציפיים ממסד הנתונים. שקול ל-`Model.findAndCountAll()` ב-Sequelize.

**Signature**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Type**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**פרטים**

פרמטרי השאילתה זהים לאלו של `find()`. הערך המוחזר הוא מערך שבו האלמנט הראשון הוא תוצאת השאילתה והאלמנט השני הוא הספירה הכוללת.

### `create()`

מוסיף רשומה חדשה ל**אוסף**. שקול ל-`Model.create()` ב-Sequelize. כאשר אובייקט הנתונים שנוצר מכיל מידע על שדות קשר, רשומות נתוני הקשר המתאימות ייווצרו או יעודכנו גם כן.

**Signature**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**דוגמה**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // When the primary key of the association table exists, it updates the data
      { id: 1 },
      // When there is no primary key value, it creates new data
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

מוסיף מספר רשומות חדשות ל**אוסף**. שקול לקריאה למתודת `create()` מספר פעמים.

**Signature**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Type**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**פרטים**

- `records`: מערך של אובייקטי נתונים עבור הרשומות שייווצרו.
- `transaction`: אובייקט טרנזקציה. אם לא מועבר פרמטר טרנזקציה, המתודה תיצור באופן אוטומטי טרנזקציה פנימית.

**דוגמה**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // When the primary key of the association table exists, it updates the data
        { id: 1 },
        // When there is no primary key value, it creates new data
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

מעדכן נתונים ב**אוסף**. שקול ל-`Model.update()` ב-Sequelize. כאשר אובייקט הנתונים שיתעדכן מכיל מידע על שדות קשר, רשומות נתוני הקשר המתאימות ייווצרו או יעודכנו גם כן.

**Signature**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**דוגמה**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // When the primary key of the association table exists, it updates the data
      { id: 1 },
      // When there is no primary key value, it creates new data
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

מוחק נתונים מ**אוסף**. שקול ל-`Model.destroy()` ב-Sequelize.

**Signature**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**Type**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**פרטים**

- `filter`: מציין את תנאי הסינון עבור הרשומות למחיקה. לשימוש מפורט ב-Filter, עיינו במתודת [`find()`](#find).
- `filterByTk`: מציין את תנאי הסינון עבור הרשומות למחיקה לפי TargetKey.
- `truncate`: האם לקטוע את נתוני ה**אוסף**, יעיל כאשר לא מועבר פרמטר `filter` או `filterByTk`.
- `transaction`: אובייקט טרנזקציה. אם לא מועבר פרמטר טרנזקציה, המתודה תיצור באופן אוטומטי טרנזקציה פנימית.