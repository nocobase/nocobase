:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# אוסף

## סקירה כללית

`אוסף` (Collection) משמש להגדרת מודלי נתונים במערכת, כמו שמות מודלים, שדות, אינדקסים, קשרים ומידע נוסף.
בדרך כלל, קוראים לו דרך מתודת ה-`collection` של מופע `Database` כנקודת גישה.

```javascript
const { Database } = require('@nocobase/database')

// יצירת מופע מסד נתונים
const db = new Database({...});

// הגדרת מודל נתונים
db.collection({
  name: 'users',
  // הגדרת שדות המודל
  fields: [
    // שדה סקלרי
    {
      name: 'name',
      type: 'string',
    },

    // שדה קשר
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

לסוגי שדות נוספים, ראו [Fields](/api/database/field).

## בנאי

**חתימה**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**פרמטרים**

| פרמטר                 | טיפוס                                                       | ברירת מחדל | תיאור                                                                                  |
| :-------------------- | :---------------------------------------------------------- | :--------- | :------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -          | מזהה ה-`אוסף`                                                                          |
| `options.tableName?`  | `string`                                                    | -          | שם טבלת מסד הנתונים. אם לא סופק, ייעשה שימוש בערך של `options.name`.                   |
| `options.fields?`     | `FieldOptions[]`                                            | -          | הגדרות שדות. לפרטים נוספים, ראו [Field](./field).                                      |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -          | טיפוס מודל של Sequelize. אם נעשה שימוש ב-`string`, שם המודל חייב להיות רשום מראש במסד הנתונים. |
| `options.repository?` | `string \| RepositoryType`                                  | -          | טיפוס רפוזיטורי (repository). אם נעשה שימוש ב-`string`, טיפוס הרפוזיטורי חייב להיות רשום מראש במסד הנתונים. |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -          | הגדרת שדה הניתן למיון. כברירת מחדל, אינו ניתן למיון.                                   |
| `options.autoGenId?`  | `boolean`                                                   | `true`     | האם ליצור מפתח ראשי ייחודי באופן אוטומטי. ברירת המחדל היא `true`.                      |
| `context.database`    | `Database`                                                  | -          | מסד הנתונים בהקשר הנוכחי.                                                              |

**דוגמה**

יצירת `אוסף` פוסטים:

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
    // מופע קיים של מסד נתונים
    database: db,
  },
);
```

## חברי מופע

### `options`

פרמטרי תצורה ראשוניים עבור ה`אוסף`. זהים לפרמטר `options` של הבנאי.

### `context`

ההקשר אליו שייך ה`אוסף` הנוכחי, כרגע בעיקר מופע מסד הנתונים.

### `name`

שם ה`אוסף`.

### `db`

מופע מסד הנתונים אליו הוא שייך.

### `filterTargetKey`

שם השדה המשמש כמפתח ראשי.

### `isThrough`

האם זהו `אוסף` ביניים.

### `model`

תואם לטיפוס המודל של Sequelize.

### `repository`

מופע רפוזיטורי.

## מתודות תצורת שדות

### `getField()`

מקבל את אובייקט השדה עם השם המתאים שהוגדר ב`אוסף`.

**חתימה**

- `getField(name: string): Field`

**פרמטרים**

| פרמטר | טיפוס     | ברירת מחדל | תיאור    |
| :---- | :-------- | :--------- | :------- |
| `name` | `string` | -          | שם השדה |

**דוגמה**

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

מגדיר שדה עבור ה`אוסף`.

**חתימה**

- `setField(name: string, options: FieldOptions): Field`

**פרמטרים**

| פרמטר    | טיפוס          | ברירת מחדל | תיאור                           |
| :------- | :------------- | :--------- | :------------------------------ |
| `name`    | `string`       | -          | שם השדה                        |
| `options` | `FieldOptions` | -          | תצורת שדה. לפרטים נוספים, ראו [Field](./field). |

**דוגמה**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

מגדיר מספר שדות עבור ה`אוסף` בקבוצה.

**חתימה**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**פרמטרים**

| פרמטר        | טיפוס            | ברירת מחדל | תיאור                           |
| :----------- | :--------------- | :--------- | :------------------------------ |
| `fields`      | `FieldOptions[]` | -          | תצורת שדה. לפרטים נוספים, ראו [Field](./field). |
| `resetFields` | `boolean`        | `true`     | האם לאפס שדות קיימים.           |

**דוגמה**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

מסיר את אובייקט השדה עם השם המתאים שהוגדר ב`אוסף`.

**חתימה**

- `removeField(name: string): void | Field`

**פרמטרים**

| פרמטר | טיפוס     | ברירת מחדל | תיאור    |
| :---- | :-------- | :--------- | :------- |
| `name` | `string` | -          | שם השדה |

**דוגמה**

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

מאפס (מנקה) את השדות של ה`אוסף`.

**חתימה**

- `resetFields(): void`

**דוגמה**

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

בודק אם אובייקט שדה עם השם המתאים מוגדר ב`אוסף`.

**חתימה**

- `hasField(name: string): boolean`

**פרמטרים**

| פרמטר | טיפוס     | ברירת מחדל | תיאור    |
| :---- | :-------- | :--------- | :------- |
| `name` | `string` | -          | שם השדה |

**דוגמה**

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

מוצא אובייקט שדה ב`אוסף` העונה לקריטריונים.

**חתימה**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**פרמטרים**

| פרמטר      | טיפוס                       | ברירת מחדל | תיאור          |
| :---------- | :-------------------------- | :--------- | :------------- |
| `predicate` | `(field: Field) => boolean` | -          | קריטריוני חיפוש |

**דוגמה**

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

עובר בלולאה על אובייקטי השדות ב`אוסף`.

**חתימה**

- `forEachField(callback: (field: Field) => void): void`

**פרמטרים**

| פרמטר      | טיפוס                    | ברירת מחדל | תיאור                  |
| :--------- | :----------------------- | :--------- | :--------------------- |
| `callback` | `(field: Field) => void` | -          | פונקציית קריאה חוזרת (callback) |

**דוגמה**

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

## מתודות תצורת אינדקסים

### `addIndex()`

מוסיף אינדקס ל`אוסף`.

**חתימה**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**פרמטרים**

| פרמטר  | טיפוס                                                        | ברירת מחדל | תיאור                |
| :----- | :----------------------------------------------------------- | :--------- | :------------------- |
| `index` | `string \| string[]`                                         | -          | שם/שמות השדות לאינדוקס |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | -          | תצורה מלאה           |

**דוגמה**

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

מסיר אינדקס מה`אוסף`.

**חתימה**

- `removeIndex(fields: string[])`

**פרמטרים**

| פרמטר    | טיפוס      | ברירת מחדל | תיאור                      |
| :------- | :--------- | :--------- | :------------------------- |
| `fields` | `string[]` | -          | צירוף שמות השדות עבור האינדקס שיש להסיר |

**דוגמה**

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

## מתודות תצורת אוסף

### `remove()`

מוחק את ה`אוסף`.

**חתימה**

- `remove(): void`

**דוגמה**

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

## מתודות פעולות מסד נתונים

### `sync()`

מסנכרן את הגדרת ה`אוסף` למסד הנתונים. בנוסף ללוגיקת ברירת המחדל של `Model.sync` ב-Sequelize, הוא מטפל גם ב`אוספים` המתאימים לשדות קשרים.

**חתימה**

- `sync(): Promise<void>`

**דוגמה**

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

בודק אם ה`אוסף` קיים במסד הנתונים.

**חתימה**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**פרמטרים**

| פרמטר                  | טיפוס         | ברירת מחדל | תיאור                 |
| :--------------------- | :------------ | :--------- | :-------------------- |
| `options?.transaction` | `Transaction` | -          | מופע טרנזקציה (transaction) |

**דוגמה**

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

**חתימה**

- `removeFromDb(): Promise<void>`

**דוגמה**

```ts
const books = db.collection({
  name: 'books',
});

// מסנכרן את אוסף הספרים למסד הנתונים
await db.sync();

// מסיר את אוסף הספרים ממסד הנתונים
await books.removeFromDb();
```