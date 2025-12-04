:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# מסד נתונים

## סקירה כללית

`Database` הוא כלי אינטראקציה עם מסד נתונים המסופק על ידי NocoBase, המציע יכולות נוחות לאינטראקציה עם מסד נתונים עבור יישומי No-code ו-Low-code. מסדי הנתונים הנתמכים כרגע הם:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### חיבור למסד נתונים

בפונקציית הבנאי (`constructor`) של `Database`, ניתן להגדיר את חיבור מסד הנתונים על ידי העברת הפרמטר `options`.

```javascript
const { Database } = require('@nocobase/database');

// פרמטרי תצורה למסד נתונים SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// פרמטרי תצורה למסד נתונים MySQL \ PostgreSQL
const database = new Database({
  dialect: /* 'postgres' או 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

לפרמטרי תצורה מפורטים, עיינו ב-[בנאי](#בנאי).

### הגדרת מודל נתונים

`Database` מגדיר את מבנה מסד הנתונים באמצעות `Collection` (אוסף). אובייקט `Collection` מייצג טבלה במסד הנתונים.

```javascript
// הגדרת Collection (אוסף)
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

לאחר הגדרת מבנה מסד הנתונים, ניתן להשתמש בשיטה `sync()` כדי לסנכרן את מבנה מסד הנתונים.

```javascript
await database.sync();
```

לשימוש מפורט יותר ב-`Collection`, עיינו ב-[Collection](/api/database/collection).

### קריאה וכתיבה של נתונים

`Database` מבצע פעולות על נתונים באמצעות `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// יצירה
await UserRepository.create({
  name: '张三',
  age: 18,
});

// שאילתה
const user = await UserRepository.findOne({
  filter: {
    name: '张三',
  },
});

// עדכון
await UserRepository.update({
  values: {
    age: 20,
  },
});

// מחיקה
await UserRepository.destroy(user.id);
```

לשימוש מפורט יותר בפעולות CRUD על נתונים, עיינו ב-[Repository](/api/database/repository).

## בנאי

**חתימה**

- `constructor(options: DatabaseOptions)`

יוצר מופע של מסד נתונים.

**פרמטרים**

| פרמטר                  | סוג            | ערך ברירת מחדל | תיאור                                                                                                                |
| :--------------------- | :------------- | :------------- | :------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'`  | מארח מסד הנתונים                                                                                                    |
| `options.port`         | `number`       | -              | פורט שירות מסד הנתונים, עם פורט ברירת מחדל מתאים למסד הנתונים בשימוש                                                 |
| `options.username`     | `string`       | -              | שם משתמש של מסד הנתונים                                                                                             |
| `options.password`     | `string`       | -              | סיסמת מסד הנתונים                                                                                                   |
| `options.database`     | `string`       | -              | שם מסד הנתונים                                                                                                      |
| `options.dialect`      | `string`       | `'mysql'`      | סוג מסד הנתונים                                                                                                     |
| `options.storage?`     | `string`       | `':memory:'`   | מצב האחסון עבור SQLite                                                                                              |
| `options.logging?`     | `boolean`      | `false`        | האם להפעיל רישום יומן (logging)                                                                                      |
| `options.define?`      | `Object`       | `{}`           | פרמטרי הגדרת טבלה ברירת מחדל                                                                                         |
| `options.tablePrefix?` | `string`       | `''`           | הרחבת NocoBase, קידומת לשם הטבלה                                                                                     |
| `options.migrator?`    | `UmzugOptions` | `{}`           | הרחבת NocoBase, פרמטרים הקשורים למנהל ההעברות (migration manager), עיינו ביישום [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) |

## שיטות הקשורות להעברות (Migrations)

### `addMigration()`

מוסיף קובץ העברה בודד.

**חתימה**

- `addMigration(options: MigrationItem)`

**פרמטרים**

| פרמטר                | סוג                | ערך ברירת מחדל | תיאור                  |
| :------------------- | :----------------- | :------------- | :--------------------- |
| `options.name`       | `string`           | -              | שם קובץ ההעברה         |
| `options.context?`   | `string`           | -              | הקשר של קובץ ההעברה     |
| `options.migration?` | `typeof Migration` | -              | מחלקה מותאמת אישית לקובץ ההעברה |
| `options.up`         | `Function`         | -              | שיטת `up` של קובץ ההעברה |
| `options.down`       | `Function`         | -              | שיטת `down` של קובץ ההעברה |

**דוגמה**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* your migration sqls */);
  },
});
```

### `addMigrations()`

מוסיף קבצי העברה מתיקייה ספציפית.

**חתימה**

- `addMigrations(options: AddMigrationsOptions): void`

**פרמטרים**

| פרמטר                | סוג        | ערך ברירת מחדל | תיאור            |
| :------------------- | :--------- | :------------- | :--------------- |
| `options.directory`  | `string`   | `''`           | תיקיית קבצי ההעברה |
| `options.extensions` | `string[]` | `['js', 'ts']` | סיומות קבצים     |
| `options.namespace?` | `string`   | `''`           | מרחב שמות        |
| `options.context?`   | `Object`   | `{ db }`       | הקשר של קובץ ההעברה |

**דוגמה**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## שיטות עזר

### `inDialect()`

בודק/ת אם סוג מסד הנתונים הנוכחי הוא אחד מהסוגים שצוינו.

**חתימה**

- `inDialect(dialect: string[]): boolean`

**פרמטרים**

| פרמטר     | סוג        | ערך ברירת מחדל | תיאור                                             |
| :-------- | :--------- | :------------- | :------------------------------------------------ |
| `dialect` | `string[]` | -              | סוג מסד נתונים, ערכים אפשריים הם `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

מקבל/ת את קידומת שם הטבלה מהתצורה.

**חתימה**

- `getTablePrefix(): string`

## תצורת אוסף

### `collection()`

מגדיר/ה אוסף. קריאה זו דומה לשיטת `define` של Sequelize, ויוצרת את מבנה הטבלה רק בזיכרון. כדי לשמור אותו במסד הנתונים, עליך לקרוא לשיטה `sync`.

**חתימה**

- `collection(options: CollectionOptions): Collection`

**פרמטרים**

כל פרמטרי התצורה של `options` תואמים לפונקציית הבנאי של מחלקת `Collection`, עיינו ב-[Collection](/api/database/collection#%D7%91%D7%A0%D7%90%D7%99).

**אירועים**

- `'beforeDefineCollection'`: מופעל לפני הגדרת אוסף.
- `'afterDefineCollection'`: מופעל לאחר הגדרת אוסף.

**דוגמה**

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

// sync collection as table to db
await db.sync();
```

### `getCollection()`

מקבל/ת אוסף שהוגדר.

**חתימה**

- `getCollection(name: string): Collection`

**פרמטרים**

| פרמטר  | סוג      | ערך ברירת מחדל | תיאור   |
| :----- | :------- | :------------- | :------ |
| `name` | `string` | -              | שם האוסף |

**דוגמה**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

בודק/ת אם אוסף מסוים הוגדר.

**חתימה**

- `hasCollection(name: string): boolean`

**פרמטרים**

| פרמטר  | סוג      | ערך ברירת מחדל | תיאור   |
| :----- | :------- | :------------- | :------ |
| `name` | `string` | -              | שם האוסף |

**דוגמה**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

מסיר/ה אוסף שהוגדר. הוא מוסר רק מהזיכרון; כדי לשמור את השינוי, עליך לקרוא לשיטה `sync`.

**חתימה**

- `removeCollection(name: string): void`

**פרמטרים**

| פרמטר  | סוג      | ערך ברירת מחדל | תיאור   |
| :----- | :------- | :------------- | :------ |
| `name` | `string` | -              | שם האוסף |

**אירועים**

- `'beforeRemoveCollection'`: מופעל לפני הסרת אוסף.
- `'afterRemoveCollection'`: מופעל לאחר הסרת אוסף.

**דוגמה**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

מייבא/ת את כל הקבצים בתיקייה כתצורות אוסף לזיכרון.

**חתימה**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**פרמטרים**

| פרמטר                | סוג        | ערך ברירת מחדל | תיאור            |
| :------------------- | :--------- | :------------- | :--------------- |
| `options.directory`  | `string`   | -              | נתיב התיקייה לייבוא |
| `options.extensions` | `string[]` | `['ts', 'js']` | סריקה אחר סיומות ספציפיות |

**דוגמה**

האוסף המוגדר בקובץ `./collections/books.ts` הוא כדלקמן:

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

ייבאו את התצורה הרלוונטית בעת טעינת התוסף:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## רישום ושליפה של הרחבות

### `registerFieldTypes()`

רושם/ת סוגי שדות מותאמים אישית.

**חתימה**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**פרמטרים**

`fieldTypes` הוא זוג מפתח-ערך שבו המפתח הוא שם סוג השדה והערך הוא מחלקת סוג השדה.

**דוגמה**

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

רושם/ת מחלקות מודל נתונים מותאמות אישית.

**חתימה**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**פרמטרים**

`models` הוא זוג מפתח-ערך שבו המפתח הוא שם המודל והערך הוא מחלקת המודל.

**דוגמה**

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

רושם/ת מחלקות מאגר נתונים (repository) מותאמות אישית.

**חתימה**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**פרמטרים**

`repositories` הוא זוג מפתח-ערך שבו המפתח הוא שם מאגר הנתונים והערך הוא מחלקת מאגר הנתונים.

**דוגמה**

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

רושם/ת אופרטורים מותאמים אישית לשאילתות נתונים.

**חתימה**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**פרמטרים**

`operators` הוא זוג מפתח-ערך שבו המפתח הוא שם האופרטור והערך הוא הפונקציה המייצרת את הצהרת ההשוואה.

**דוגמה**

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
      // registered operator
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

מקבל/ת מחלקת מודל נתונים שהוגדרה. אם לא נרשמה מחלקת מודל מותאמת אישית קודם לכן, היא תחזיר את מחלקת המודל ברירת המחדל של Sequelize. שם ברירת המחדל זהה לשם האוסף שהוגדר.

**חתימה**

- `getModel(name: string): Model`

**פרמטרים**

| פרמטר  | סוג      | ערך ברירת מחדל | תיאור            |
| :----- | :------- | :------------- | :--------------- |
| `name` | `string` | -              | שם המודל הרשום |

**דוגמה**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

הערה: מחלקת המודל המתקבלת מאוסף אינה זהה לחלוטין למחלקת המודל שנרשמה, אלא יורשת ממנה. מכיוון שמאפייני מחלקת המודל של Sequelize משתנים במהלך האתחול, NocoBase מטפלת באופן אוטומטי ביחס ירושה זה. למעט אי-שוויון המחלקות, כל שאר ההגדרות ניתנות לשימוש רגיל.

### `getRepository()`

מקבל/ת מחלקת מאגר נתונים (repository) מותאמת אישית. אם לא נרשמה מחלקת מאגר נתונים מותאמת אישית קודם לכן, היא תחזיר את מחלקת מאגר הנתונים ברירת המחדל של NocoBase. שם ברירת המחדל זהה לשם האוסף שהוגדר.

מחלקות מאגר נתונים משמשות בעיקר לפעולות CRUD המבוססות על מודלי נתונים, עיינו ב-[מאגר נתונים](/api/database/repository).

**חתימה**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**פרמטרים**

| פרמטר        | סוג                  | ערך ברירת מחדל | תיאור              |
| :----------- | :------------------- | :------------- | :----------------- |
| `name`       | `string`             | -              | שם מאגר הנתונים הרשום |
| `relationId` | `string` \| `number` | -              | ערך מפתח זר עבור נתונים יחסיים |

כאשר השם הוא שם אסוציאציה כמו `'tables.relations'`, הוא יחזיר את מחלקת מאגר הנתונים המשויכת. אם הפרמטר השני מסופק, מאגר הנתונים יתבסס על ערך המפתח הזר של הנתונים היחסיים בעת השימוש (שאילתות, עדכונים וכו').

**דוגמה**

נניח שיש שני אוספים, *פוסטים* ו*מחברים*, ולאוסף הפוסטים יש מפתח זר המצביע על אוסף המחברים:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## אירועי מסד נתונים

### `on()`

מאזין/ה לאירועי מסד נתונים.

**חתימה**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**פרמטרים**

| פרמטר    | סוג      | ערך ברירת מחדל | תיאור      |
| :------- | :------- | :------------- | :--------- |
| event    | string   | -              | שם האירוע |
| listener | Function | -              | מאזין לאירוע |

שמות האירועים תומכים כברירת מחדל באירועי מודל של Sequelize. עבור אירועים גלובליים, האזינו באמצעות הפורמט `<sequelize_model_global_event>`, ועבור אירועי מודל בודדים, השתמשו בפורמט `<model_name>.<sequelize_model_event>`.

לתיאורי פרמטרים ודוגמאות מפורטות של כל סוגי האירועים המובנים, עיינו בסעיף [אירועים מובנים](#אירועים-מובנים).

### `off()`

מסיר/ה פונקציית האזנה לאירוע.

**חתימה**

- `off(name: string, listener: Function)`

**פרמטרים**

| פרמטר    | סוג      | ערך ברירת מחדל | תיאור      |
| :------- | :------- | :------------- | :--------- |
| name     | string   | -              | שם האירוע |
| listener | Function | -              | מאזין לאירוע |

**דוגמה**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## פעולות מסד נתונים

### `auth()`

אימות חיבור למסד נתונים. ניתן להשתמש בו כדי לוודא שהיישום יצר חיבור עם הנתונים.

**חתימה**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**פרמטרים**

| פרמטר                  | סוג                   | ערך ברירת מחדל | תיאור              |
| :--------------------- | :-------------------- | :------------- | :----------------- |
| `options?`             | `Object`              | -              | אפשרויות אימות   |
| `options.retry?`       | `number`              | `10`           | מספר ניסיונות חוזרים במקרה של כשל באימות |
| `options.transaction?` | `Transaction`         | -              | אובייקט טרנזקציה |
| `options.logging?`     | `boolean \| Function` | `false`        | האם להדפיס יומנים |

**דוגמה**

```ts
await db.auth();
```

### `reconnect()`

מתחבר/ת מחדש למסד הנתונים.

**דוגמה**

```ts
await db.reconnect();
```

### `closed()`

בודק/ת אם חיבור מסד הנתונים סגור.

**חתימה**

- `closed(): boolean`

### `close()`

סוגר/ת את חיבור מסד הנתונים. שווה ערך ל-`sequelize.close()`.

### `sync()`

מסנכרן/ת את מבנה אוסף מסד הנתונים. שווה ערך ל-`sequelize.sync()`, לפרמטרים עיינו ב-[תיעוד Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

מנקה/ת את מסד הנתונים, מוחק/ת את כל האוספים.

**חתימה**

- `clean(options: CleanOptions): Promise<void>`

**פרמטרים**

| פרמטר                 | סוג           | ערך ברירת מחדל | תיאור              |
| :-------------------- | :------------ | :------------- | :----------------- |
| `options.drop`        | `boolean`     | `false`        | האם למחוק את כל האוספים |
| `options.skip`        | `string[]`    | -              | תצורת שמות אוספים לדלג עליהם |
| `options.transaction` | `Transaction` | -              | אובייקט טרנזקציה |

**דוגמה**

מסיר/ה את כל האוספים למעט אוסף `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## ייצוא ברמת חבילה

### `defineCollection()`

יוצר/ת את תוכן התצורה עבור אוסף.

**חתימה**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**פרמטרים**

| פרמטר               | סוג                 | ערך ברירת מחדל | תיאור                                |
| :------------------ | :------------------ | :------------- | :----------------------------------- |
| `collectionOptions` | `CollectionOptions` | -              | זהה לכל הפרמטרים של `db.collection()` |

**דוגמה**

עבור קובץ תצורת אוסף שייובא על ידי `db.import()`:

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

מרחיב/ה את תוכן התצורה של אוסף שכבר נמצא בזיכרון, בעיקר עבור תוכן קבצים שיובאו על ידי שיטת `import()`. שיטה זו היא שיטה ברמה העליונה המיוצאת על ידי חבילת `@nocobase/database` ואינה נקראת דרך מופע `db`. ניתן להשתמש גם בכינוי `extend`.

**חתימה**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**פרמטרים**

| פרמטר               | סוג                 | ערך ברירת מחדל | תיאור                                                           |
| :------------------ | :------------------ | :------------- | :-------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -              | זהה לכל הפרמטרים של `db.collection()`                            |
| `mergeOptions?`     | `MergeOptions`      | -              | פרמטרים עבור חבילת npm [deepmerge](https://npmjs.com/package/deepmerge) |

**דוגמה**

הגדרת אוסף ספרים מקורית (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

הגדרת אוסף ספרים מורחבת (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// הרחבה נוספת
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

אם שני הקבצים לעיל מיובאים בעת קריאה ל-`import()`, לאחר הרחבה נוספת באמצעות `extend()`, אוסף הספרים יכלול את השדות `title` ו-`price`.

שיטה זו שימושית מאוד להרחבת מבני אוספים שכבר הוגדרו על ידי תוספים קיימים.

## אירועים מובנים

מסד הנתונים מפעיל/ה את האירועים המתאימים הבאים בשלבי מחזור החיים השונים שלו. הרשמה אליהם באמצעות שיטת `on()` מאפשרת טיפול ספציפי כדי לעמוד בצרכים עסקיים מסוימים.

### `'beforeSync'` / `'afterSync'`

מופעל לפני ואחרי סנכרון תצורת מבנה אוסף חדשה (שדות, אינדקסים וכו') למסד הנתונים. הוא מופעל בדרך כלל כאשר `collection.sync()` (קריאה פנימית) מבוצע, ומשמש בדרך כלל לטיפול בלוגיקה של הרחבות שדות מיוחדות.

**חתימה**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**סוג**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**דוגמה**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // do something
});

db.on('users.afterSync', async (options) => {
  // do something
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

לפני יצירה או עדכון נתונים, מתבצע תהליך אימות המבוסס על הכללים המוגדרים באוסף. אירועים מתאימים מופעלים לפני ואחרי האימות. זה מופעל כאשר `repository.create()` או `repository.update()` נקראים.

**חתימה**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**סוג**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**דוגמה**

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

// all models
db.on('beforeValidate', async (model, options) => {
  // do something
});
// tests model
db.on('tests.beforeValidate', async (model, options) => {
  // do something
});

// all models
db.on('afterValidate', async (model, options) => {
  // do something
});
// tests model
db.on('tests.afterValidate', async (model, options) => {
  // do something
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // checks for email format
  },
});
// or
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // checks for email format
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

אירועים מתאימים מופעלים לפני ואחרי יצירת רשומה. זה מופעל כאשר `repository.create()` נקרא.

**חתימה**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**סוג**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**דוגמה**

```ts
db.on('beforeCreate', async (model, options) => {
  // do something
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

אירועים מתאימים מופעלים לפני ואחרי עדכון רשומה. זה מופעל כאשר `repository.update()` נקרא.

**חתימה**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**סוג**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**דוגמה**

```ts
db.on('beforeUpdate', async (model, options) => {
  // do something
});

db.on('books.afterUpdate', async (model, options) => {
  // do something
});
```

### `'beforeSave'` / `'afterSave'`

אירועים מתאימים מופעלים לפני ואחרי יצירה או עדכון רשומה. זה מופעל כאשר `repository.create()` או `repository.update()` נקראים.

**חתימה**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**סוג**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**דוגמה**

```ts
db.on('beforeSave', async (model, options) => {
  // do something
});

db.on('books.afterSave', async (model, options) => {
  // do something
});
```

### `'beforeDestroy'` / `'afterDestroy'`

אירועים מתאימים מופעלים לפני ואחרי מחיקת רשומה. זה מופעל כאשר `repository.destroy()` נקרא.

**חתימה**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**סוג**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**דוגמה**

```ts
db.on('beforeDestroy', async (model, options) => {
  // do something
});

db.on('books.afterDestroy', async (model, options) => {
  // do something
});
```

### `'afterCreateWithAssociations'`

אירוע זה מופעל לאחר יצירת רשומה עם נתוני אסוציאציה היררכיים. הוא מופעל כאשר `repository.create()` נקרא.

**חתימה**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**סוג**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**דוגמה**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // do something
});
```

### `'afterUpdateWithAssociations'`

אירוע זה מופעל לאחר עדכון רשומה עם נתוני אסוציאציה היררכיים. הוא מופעל כאשר `repository.update()` נקרא.

**חתימה**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**סוג**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**דוגמה**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // do something
});
```

### `'afterSaveWithAssociations'`

אירוע זה מופעל לאחר יצירה או עדכון רשומה עם נתוני אסוציאציה היררכיים. הוא מופעל כאשר `repository.create()` או `repository.update()` נקראים.

**חתימה**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**סוג**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**דוגמה**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // do something
});
```

### `'beforeDefineCollection'`

מופעל לפני הגדרת אוסף, לדוגמה, כאשר `db.collection()` נקרא.

הערה: זהו אירוע סינכרוני.

**חתימה**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**סוג**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**דוגמה**

```ts
db.on('beforeDefineCollection', (options) => {
  // do something
});
```

### `'afterDefineCollection'`

מופעל לאחר הגדרת אוסף, לדוגמה, כאשר `db.collection()` נקרא.

הערה: זהו אירוע סינכרוני.

**חתימה**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**סוג**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**דוגמה**

```ts
db.on('afterDefineCollection', (collection) => {
  // do something
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

מופעל לפני ואחרי הסרת אוסף מהזיכרון, לדוגמה, כאשר `db.removeCollection()` נקרא.

הערה: זהו אירוע סינכרוני.

**חתימה**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**סוג**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**דוגמה**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // do something
});

db.on('afterRemoveCollection', (collection) => {
  // do something
});
```