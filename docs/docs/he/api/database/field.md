:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# שדה

## סקירה כללית

זוהי מחלקת ניהול שדות של **אוסף** (מחלקה אבסטרקטית). הוא משמש גם כמחלקת הבסיס לכל סוגי השדות, וכל סוג שדה אחר מיושם על ידי ירושה ממחלקה זו.

למידע נוסף על התאמה אישית של שדות, עיינו ב[הרחבת סוגי שדות].

## בנאי

בדרך כלל, מפתחים אינם קוראים לו ישירות. הוא נקרא בעיקר דרך שיטת `db.collection({ fields: [] })` כנקודת כניסה מתווכת.

בעת הרחבת שדה, היישום העיקרי מתבצע על ידי ירושה מהמחלקה האבסטרקטית `Field` ולאחר מכן רישום שלה למופע ה-`Database`.

**חתימה**

- `constructor(options: FieldOptions, context: FieldContext)`

**פרמטרים**

| שם פרמטר             | סוג            | ברירת מחדל | תיאור                                    |
| :------------------- | :------------- | :--------- | :--------------------------------------- |
| `options`            | `FieldOptions` | -          | אובייקט תצורת שדה                        |
| `options.name`       | `string`       | -          | שם השדה                                  |
| `options.type`       | `string`       | -          | סוג השדה, תואם לשם סוג השדה הרשום ב-`db` |
| `context`            | `FieldContext` | -          | אובייקט הקשר שדה                         |
| `context.database`   | `Database`     | -          | מופע מסד נתונים                          |
| `context.collection` | `Collection`   | -          | מופע **אוסף**                            |

## חברי מופע

### `name`

שם השדה.

### `type`

סוג השדה.

### `dataType`

סוג אחסון השדה במסד הנתונים.

### `options`

פרמטרי תצורת אתחול השדה.

### `context`

אובייקט הקשר השדה.

## שיטות תצורה

### `on()`

שיטת הגדרה מקוצרת המבוססת על אירועי **אוסף**. שקול ל-`db.on(this.collection.name + '.' + eventName, listener)`.

בדרך כלל אין צורך לדרוס שיטה זו בעת ירושה.

**חתימה**

- `on(eventName: string, listener: (...args: any[]) => void)`

**פרמטרים**

| שם פרמטר    | סוג                        | ברירת מחדל | תיאור      |
| :---------- | :------------------------- | :--------- | :--------- |
| `eventName` | `string`                   | -          | שם האירוע |
| `listener`  | `(...args: any[]) => void` | -          | מאזין אירועים |

### `off()`

שיטת הסרה מקוצרת המבוססת על אירועי **אוסף**. שקול ל-`db.off(this.collection.name + '.' + eventName, listener)`.

בדרך כלל אין צורך לדרוס שיטה זו בעת ירושה.

**חתימה**

- `off(eventName: string, listener: (...args: any[]) => void)`

**פרמטרים**

| שם פרמטר    | סוג                        | ברירת מחדל | תיאור      |
| :---------- | :------------------------- | :--------- | :--------- |
| `eventName` | `string`                   | -          | שם האירוע |
| `listener`  | `(...args: any[]) => void` | -          | מאזין אירועים |

### `bind()`

התוכן שיבוצע כאשר שדה מתווסף ל**אוסף**. בדרך כלל משמש להוספת מאזיני אירועים של **אוסף** וטיפולים אחרים.

בעת ירושה, עליכם לקרוא תחילה לשיטת `super.bind()` המתאימה.

**חתימה**

- `bind()`

### `unbind()`

התוכן שיבוצע כאשר שדה מוסר מ**אוסף**. בדרך כלל משמש להסרת מאזיני אירועים של **אוסף** וטיפולים אחרים.

בעת ירושה, עליכם לקרוא תחילה לשיטת `super.unbind()` המתאימה.

**חתימה**

- `unbind()`

### `get()`

מקבל את הערך של פריט תצורה של שדה.

**חתימה**

- `get(key: string): any`

**פרמטרים**

| שם פרמטר | סוג      | ברירת מחדל | תיאור        |
| :------- | :------- | :--------- | :----------- |
| `key`    | `string` | -          | שם פריט התצורה |

**דוגמה**

```ts
const field = db.collection('users').getField('name');

// מקבל את הערך של פריט תצורת שם השדה, מחזיר 'name'
console.log(field.get('name'));
```

### `merge()`

ממזג את הערכים של פריטי התצורה של שדה.

**חתימה**

- `merge(options: { [key: string]: any }): void`

**פרמטרים**

| שם פרמטר  | סוג                      | ברירת מחדל | תיאור              |
| :-------- | :----------------------- | :--------- | :----------------- |
| `options` | `{ [key: string]: any }` | -          | אובייקט פריטי התצורה למיזוג |

**דוגמה**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // מוסיף תצורת אינדקס
  index: true,
});
```

### `remove()`

מסיר את השדה מ**אוסף** (רק מהזיכרון).

**דוגמה**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// really remove from db
await books.sync();
```

## שיטות מסד נתונים

### `removeFromDb()`

מסיר את השדה ממסד הנתונים.

**חתימה**

- `removeFromDb(options?: Transactionable): Promise<void>`

**פרמטרים**

| שם פרמטר               | סוג           | ברירת מחדל | תיאור      |
| :--------------------- | :------------ | :--------- | :--------- |
| `options.transaction?` | `Transaction` | -          | מופע טרנזקציה |

### `existsInDb()`

קובע אם השדה קיים במסד הנתונים.

**חתימה**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**פרמטרים**

| שם פרמטר               | סוג           | ברירת מחדל | תיאור      |
| :--------------------- | :------------ | :--------- | :--------- |
| `options.transaction?` | `Transaction` | -          | מופע טרנזקציה |

## רשימת סוגי שדות מובנים

NocoBase כולל מספר סוגי שדות נפוצים מובנים, וניתן להשתמש ישירות בשם ה-`type` המתאים כדי לציין את הסוג בעת הגדרת שדות עבור **אוסף**. לסוגי שדות שונים יש תצורות פרמטרים שונות; עיינו ברשימה שלהלן לפרטים.

כל פריטי התצורה עבור סוגי השדות, למעט אלה שיוצגו בהמשך, יועברו ל-Sequelize, כך שכל פריטי תצורת השדות הנתמכים על ידי Sequelize ניתנים לשימוש כאן (כגון `allowNull`, `defaultValue` וכו').

בנוסף, סוגי השדות בצד השרת מטפלים בעיקר בבעיות אחסון נתונים ואלגוריתמים מסוימים, ואינם קשורים באופן מהותי לסוגי תצוגת השדות ולרכיבים המשמשים בקצה הקדמי. לסוגי שדות בקצה הקדמי, עיינו בהוראות המדריך המתאימות.

### `'boolean'`

סוג ערך בוליאני.

**דוגמה**

```js
db.collection({
  name: 'books',
  fields: [
    {
      type: 'boolean',
      name: 'published',
    },
  ],
});
```

### `'integer'`

סוג מספר שלם (32 סיביות).

**דוגמה**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'integer',
      name: 'pages',
    },
  ],
});
```

### `'bigInt'`

סוג מספר שלם ארוך (64 סיביות).

**דוגמה**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'bigInt',
      name: 'words',
    },
  ],
});
```

### `'double'`

סוג נקודה צפה בדיוק כפול (64 סיביות).

**דוגמה**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
  ],
});
```

### `'real'`

סוג מספר ממשי (רלוונטי רק ל-PG).

### `'decimal'`

סוג מספר עשרוני.

### `'string'`

סוג מחרוזת. שקול לסוג `VARCHAR` ברוב מסדי הנתונים.

**דוגמה**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});
```

### `'text'`

סוג טקסט. שקול לסוג `TEXT` ברוב מסדי הנתונים.

**דוגמה**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'text',
      name: 'content',
    },
  ],
});
```

### `'password'`

סוג סיסמה (הרחבת NocoBase). מצפין סיסמאות באמצעות שיטת `scrypt` מחבילת ה-`crypto` המובנית של Node.js.

**דוגמה**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // אורך, ברירת מחדל 64
      randomBytesSize: 8, // אורך בתים אקראיים, ברירת מחדל 8
    },
  ],
});
```

**פרמטרים**

| שם פרמטר          | סוג      | ברירת מחדל | תיאור        |
| :---------------- | :------- | :--------- | :----------- |
| `length`          | `number` | 64         | אורך תו      |
| `randomBytesSize` | `number` | 8          | גודל בתים אקראיים |

### `'date'`

סוג תאריך.

### `'time'`

סוג זמן.

### `'array'`

סוג מערך (רלוונטי רק ל-PG).

### `'json'`

סוג JSON.

### `'jsonb'`

סוג JSONB (רלוונטי רק ל-PG, אחרת יותאם לסוג `'json'`).

### `'uuid'`

סוג UUID.

### `'uid'`

סוג UID (הרחבת NocoBase). סוג מזהה מחרוזת אקראית קצרה.

### `'formula'`

סוג נוסחה (הרחבת NocoBase). מאפשר הגדרת חישובי נוסחאות מתמטיות המבוססות על [mathjs](https://www.npmjs.com/package/mathjs). הנוסחה יכולה להתייחס לערכים מעמודות אחרות באותה רשומה לצורך החישוב.

**דוגמה**

```ts
db.collection({
  name: 'orders',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
    {
      type: 'integer',
      name: 'quantity',
    },
    {
      type: 'formula',
      name: 'total',
      expression: 'price * quantity',
    },
  ],
});
```

### `'radio'`

סוג רדיו (הרחבת NocoBase). לכל היותר רשומה אחת ב**אוסף** כולו יכולה להכיל את הערך `true` בשדה זה; כל השאר יהיו `false` או `null`.

**דוגמה**

במערכת כולה יש רק משתמש אחד המסומן כ-`root`. לאחר שערך ה-`root` של משתמש אחר כלשהו משתנה ל-`true`, כל שאר הרשומות עם `root` שערכן `true` ישונו ל-`false`:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'radio',
      name: 'root',
    },
  ],
});
```

### `'sort'`

סוג מיון (הרחבת NocoBase). ממיין על בסיס מספרים שלמים, יוצר אוטומטית מספר סידורי חדש לרשומות חדשות, ומסדר מחדש את המספרים הסידוריים בעת העברת נתונים.

אם **אוסף** מגדיר את האפשרות `sortable`, שדה מתאים ייווצר גם הוא באופן אוטומטי.

**דוגמה**

פוסטים ניתנים למיון על בסיס המשתמש שאליו הם שייכים:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'sort',
      name: 'priority',
      scopeKey: 'userId', // ממיין נתונים מקובצים לפי אותו ערך userId
    },
  ],
});
```

### `'virtual'`

סוג וירטואלי. אינו מאחסן נתונים בפועל, ומשמש רק להגדרות getter/setter מיוחדות.

### `'belongsTo'`

סוג קשר רבים-לאחד. מפתח החוץ מאוחסן ב**אוסף** עצמו, בניגוד ל-`hasOne`/`hasMany`.

**דוגמה**

כל פוסט שייך למחבר מסוים:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // אם לא מוגדר, ברירת המחדל היא שם ה-collection בצורת רבים
      foreignKey: 'authorId', // אם לא מוגדר, ברירת המחדל היא בפורמט <name> + Id
      sourceKey: 'id', // אם לא מוגדר, ברירת המחדל היא ה-id של ה-collection היעד
    },
  ],
});
```

### `'hasOne'`

סוג קשר אחד-לאחד. מפתח החוץ מאוחסן ב**אוסף** המקושר, בניגוד ל-`belongsTo`.

**דוגמה**

לכל משתמש יש פרופיל אישי:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // ניתן להשמיט
    },
  ],
});
```

### `'hasMany'`

סוג קשר אחד-לרבים. מפתח החוץ מאוחסן ב**אוסף** המקושר, בניגוד ל-`belongsTo`.

**דוגמה**

כל משתמש יכול להחזיק במספר פוסטים:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasMany',
      name: 'posts',
      foreignKey: 'authorId',
      sourceKey: 'id',
    },
  ],
});
```

### `'belongsToMany'`

סוג קשר רבים-לרבים. משתמש ב**אוסף** מתווך לאחסון מפתחות החוץ של שני הצדדים. אם לא מצוין **אוסף** קיים כ**אוסף** מתווך, **אוסף** מתווך ייווצר אוטומטית.

**דוגמה**

כל פוסט יכול להכיל מספר תגיות, וכל תגית יכולה להיות משויכת למספר פוסטים:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // ניתן להשמיט אם השם זהה
      through: 'postsTags', // ה-collection המתווך ייווצר אוטומטית אם לא מוגדר
      foreignKey: 'postId', // מפתח החוץ של ה-collection המקורי ב-collection המתווך
      sourceKey: 'id', // המפתח הראשי של ה-collection המקורי
      otherKey: 'tagId', // מפתח החוץ של ה-collection המקושר ב-collection המתווך
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // אותה קבוצת יחסים מצביעה על אותו collection מתווך
    },
  ],
});
```