:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# מנהל משאבים (ResourceManager)

תכונת ניהול המשאבים של NocoBase ממירה אוטומטית אוספים (collections) וקשרים (associations) קיימים למשאבים. היא כוללת סוגי פעולות מובנים המסייעים למפתחים לבנות במהירות פעולות משאבי REST API. בשונה מ-REST APIs מסורתיים, פעולות המשאבים ב-NocoBase אינן מסתמכות על שיטות בקשת HTTP, אלא קובעות את הפעולה הספציפית לביצוע באמצעות הגדרה מפורשת של `:action`.

## יצירת משאבים אוטומטית

NocoBase ממירה אוטומטית `אוספים` ו`קשרים` המוגדרים במסד הנתונים למשאבים. לדוגמה, אם נגדיר שני אוספים, `posts` ו-`tags`:

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

זה ייצור אוטומטית את המשאבים הבאים:

*   משאב `posts`
*   משאב `tags`
*   משאב קשר `posts.tags`

דוגמאות בקשה:

| שיטת בקשה | נתיב                     | פעולה         |
| -------- | ---------------------- | ------------ |
| `GET`    | `/api/posts:list`      | שאילתת רשימה |
| `GET`    | `/api/posts:get/1`     | שאילתת פריט בודד |
| `POST`   | `/api/posts:create`    | יצירה         |
| `POST`   | `/api/posts:update/1`  | עדכון         |
| `POST`   | `/api/posts:destroy/1` | מחיקה        |

| שיטת בקשה | נתיב                     | פעולה         |
| -------- | ---------------------- | ------------ |
| `GET`    | `/api/tags:list`       | שאילתת רשימה |
| `GET`    | `/api/tags:get/1`      | שאילתת פריט בודד |
| `POST`   | `/api/tags:create`     | יצירה         |
| `POST`   | `/api/tags:update/1`   | עדכון         |
| `POST`   | `/api/tags:destroy/1`  | מחיקה        |

| שיטת בקשה | נתיב                           | פעולה                                     |
| -------- | ------------------------------ | ----------------------------------------- |
| `GET`    | `/api/posts/1/tags:list`       | שאילתת כל ה-`tags` המקושרים ל-`post` מסוים |
| `GET`    | `/api/posts/1/tags:get/1`      | שאילתת `tag` בודד תחת `post` מסוים        |
| `POST`   | `/api/posts/1/tags:create`     | יצירת `tag` בודד תחת `post` מסוים         |
| `POST`   | `/api/posts/1/tags:update/1`   | עדכון `tag` בודד תחת `post` מסוים         |
| `POST`   | `/api/posts/1/tags:destroy/1`  | מחיקת `tag` בודד תחת `post` מסוים         |
| `POST`   | `/api/posts/1/tags:add`        | הוספת `tags` מקושרים ל-`post` מסוים       |
| `POST`   | `/api/posts/1/tags:remove`     | הסרת `tags` מקושרים מ-`post` מסוים        |
| `POST`   | `/api/posts/1/tags:set`        | הגדרת כל ה-`tags` המקושרים ל-`post` מסוים  |
| `POST`   | `/api/posts/1/tags:toggle`     | החלפת מצב קשר ה-`tags` עבור `post` מסוים  |

:::tip טיפ

פעולות המשאבים ב-NocoBase אינן תלויות ישירות בשיטות בקשה, אלא קובעות את הפעולות לביצוע באמצעות הגדרות `:action` מפורשות.

:::

## פעולות משאבים

NocoBase מספקת מגוון עשיר של סוגי פעולות מובנים כדי לענות על צרכים עסקיים שונים.

### פעולות CRUD בסיסיות

| שם הפעולה        | תיאור                                   | סוגי משאבים רלוונטיים | שיטת בקשה | נתיב לדוגמה                |
| --------------- | --------------------------------------- | -------------------- | -------- | -------------------------- |
| `list`          | שאילתת נתוני רשימה                      | כללי                 | GET/POST | `/api/posts:list`          |
| `get`           | שאילתת נתון בודד                        | כללי                 | GET/POST | `/api/posts:get/1`         |
| `create`        | יצירת רשומה חדשה                       | כללי                 | POST     | `/api/posts:create`        |
| `update`        | עדכון רשומה                             | כללי                 | POST     | `/api/posts:update/1`      |
| `destroy`       | מחיקת רשומה                             | כללי                 | POST     | `/api/posts:destroy/1`     |
| `firstOrCreate` | מציאת רשומה ראשונה, יצירה אם אינה קיימת | כללי                 | POST     | `/api/users:firstOrCreate` |
| `updateOrCreate`| עדכון רשומה, יצירה אם אינה קיימת        | כללי                 | POST     | `/api/users:updateOrCreate`|

### פעולות קשרים

| שם הפעולה | תיאור                 | סוגי קשרים רלוונטיים                      | נתיב לדוגמה                   |
| -------- | --------------------- | ----------------------------------------- | ----------------------------- |
| `add`    | הוספת קשר             | `hasMany`, `belongsToMany`                | `/api/posts/1/tags:add`       |
| `remove` | הסרת קשר              | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove`|
| `set`    | איפוס קשר             | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`   |
| `toggle` | הוספה או הסרה של קשר  | `belongsToMany`                           | `/api/posts/1/tags:toggle`    |

### פרמטרים של פעולה

פרמטרים נפוצים לפעולות כוללים:

*   `filter`: תנאי שאילתה
*   `values`: ערכים להגדרה
*   `fields`: ציון שדות מוחזרים
*   `appends`: הכללת נתונים מקושרים
*   `except`: החרגת שדות
*   `sort`: כללי מיון
*   `page`, `pageSize`: פרמטרים של חלוקה לעמודים (פגינציה)
*   `paginate`: האם להפעיל חלוקה לעמודים
*   `tree`: האם להחזיר מבנה עץ
*   `whitelist`, `blacklist`: רשימה לבנה/שחורה של שדות
*   `updateAssociationValues`: האם לעדכן ערכי קשר

---

## פעולות משאבים מותאמות אישית

NocoBase מאפשרת לרשום פעולות נוספות עבור משאבים קיימים. אתם יכולים להשתמש ב-`registerActionHandlers` כדי להתאים אישית פעולות עבור כל המשאבים או עבור משאבים ספציפיים.

### רישום פעולות גלובליות

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### רישום פעולות ספציפיות למשאב

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

דוגמאות בקשה:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

כלל מתן שמות: `resourceName:actionName`. כאשר כוללים קשרים, השתמשו בתחביר נקודה (`posts.comments`).

## משאבים מותאמים אישית

אם אתם צריכים לספק משאבים שאינם קשורים לאוספים, אתם יכולים להשתמש בשיטת `resourceManager.define` כדי להגדיר אותם:

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

שיטות הבקשה עקביות עם משאבים שנוצרו אוטומטית:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (תומך ב-GET/POST כברירת מחדל)

## Middleware מותאם אישית

השתמשו בשיטת `resourceManager.use()` כדי לרשום middleware גלובלי. לדוגמה:

Middleware גלובלי לרישום יומן

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## מאפייני Context מיוחדים

היכולת להיכנס ל-middleware או לפעולה בשכבת ה-`resourceManager` מצביעה על כך שהמשאב חייב להתקיים.

### ctx.action

*   `ctx.action.actionName`: שם הפעולה
*   `ctx.action.resourceName`: יכול להיות אוסף או קשר
*   `ctx.action.params`: פרמטרים של הפעולה

### ctx.dataSource

אובייקט מקור הנתונים הנוכחי.

### ctx.getCurrentRepository()

אובייקט ה-repository הנוכחי.

## כיצד לקבל אובייקטי resourceManager עבור מקורות נתונים שונים

`resourceManager` שייך למקור נתונים, וניתן לרשום פעולות בנפרד עבור מקורות נתונים שונים.

### מקור נתונים ראשי

עבור מקור הנתונים הראשי, אתם יכולים להשתמש ישירות ב-`app.resourceManager` לביצוע פעולות:

```ts
app.resourceManager.registerActionHandlers();
```

### מקורות נתונים אחרים

עבור מקורות נתונים אחרים, אתם יכולים לקבל מופע ספציפי של מקור נתונים באמצעות `dataSourceManager` ולהשתמש ב-`resourceManager` של מופע זה לביצוע פעולות:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### מעבר על כל מקורות הנתונים

אם אתם צריכים לבצע את אותן פעולות על כל מקורות הנתונים שנוספו, אתם יכולים להשתמש בשיטת `dataSourceManager.afterAddDataSource` כדי לעבור עליהם, ובכך להבטיח ש-`resourceManager` של כל מקור נתונים יוכל לרשום את הפעולות המתאימות:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```