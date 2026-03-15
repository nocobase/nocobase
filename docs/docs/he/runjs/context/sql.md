:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/sql).
:::

# ctx.sql

`ctx.sql` מספק יכולות הרצה וניהול של SQL, ונמצא בשימוש נפוץ ב-RunJS (כגון JSBlock ותהליכי עבודה) לצורך גישה ישירה לבסיס הנתונים. הוא תומך בהרצת SQL זמנית, הרצת תבניות SQL שמורות לפי מזהה (ID), קישור פרמטרים (parameter binding), משתני תבנית (`{{ctx.xxx}}`) ובקרה על סוג התוצאה.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **JSBlock** | דוחות סטטיסטיים מותאמים אישית, רשימות סינון מורכבות ושאילתות אגרגציה בין טבלאות. |
| **בלוק תרשים** | שמירת תבניות SQL להזנת מקורות נתונים של תרשימים. |
| **תהליך עבודה / קישוריות** | הרצת SQL מוגדר מראש לקבלת נתונים ושילובם בלוגיקה עוקבת. |
| **SQLResource** | שימוש בשילוב עם `ctx.initResource('SQLResource')` עבור תרחישים כמו רשימות עם דפדוף (pagination). |

> הערה: `ctx.sql` ניגש לבסיס הנתונים דרך ה-API של `flowSql`; יש לוודא שלמשתמש הנוכחי יש הרשאות הרצה עבור מקור הנתונים המתאים.

## הסבר הרשאות

| הרשאה | מתודה | הסבר |
|------|------|------|
| **משתמש מחובר** | `runById` | הרצה על בסיס מזהה תבנית SQL שהוגדרה. |
| **הרשאת תצורת SQL** | `run`, `save`, `destroy` | הרצת SQL זמני, או שמירה/עדכון/מחיקה של תבניות SQL. |

לוגיקת צד-לקוח המיועדת למשתמשים רגילים צריכה להשתמש ב-`ctx.sql.runById(uid, options)`. כאשר נדרש SQL דינמי או ניהול תבניות, יש לוודא שלתפקיד הנוכחי יש הרשאות תצורת SQL.

## הגדרת טיפוסים (Type Definition)

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

## מתודות נפוצות

| מתודה | הסבר | דרישת הרשאה |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | מריץ SQL זמני; תומך בקישור פרמטרים ובמשתני תבנית. | הרשאת תצורת SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | שומר או מעדכן תבנית SQL לפי מזהה לשימוש חוזר. | הרשאת תצורת SQL |
| `ctx.sql.runById(uid, options?)` | מריץ תבנית SQL שנשמרה בעבר לפי המזהה שלה. | כל משתמש מחובר |
| `ctx.sql.destroy(uid)` | מוחק תבנית SQL ספציפית לפי מזהה. | הרשאת תצורת SQL |

הערה:

- `run` משמש לניקוי שגיאות (debugging) של SQL ודורש הרשאות תצורה.
- `save` ו-`destroy` משמשים לניהול תבניות SQL ודורשים הרשאות תצורה.
- `runById` פתוח למשתמשים רגילים; הוא יכול להריץ רק תבניות שמורות ואינו יכול לשנות או לדבג את ה-SQL.
- כאשר תבנית SQL משתנה, יש לקרוא ל-`save` כדי לשמור את השינויים.

## פרמטרים

### options עבור run / runById

| פרמטר | טיפוס | הסבר |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | משתנים לקישור. השתמשו באובייקט עבור סימני מקום מסוג `:name` או במערך עבור סימני מקום מסוג `?`. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | סוג התוצאה: שורות מרובות, שורה בודדת או ערך בודד. ברירת המחדל היא `selectRows`. |
| `dataSourceKey` | `string` | מזהה מקור נתונים. ברירת המחדל היא מקור הנתונים הראשי. |
| `filter` | `Record<string, any>` | תנאי סינון נוספים (בהתאם לתמיכת הממשק). |

### options עבור save

| פרמטר | טיפוס | הסבר |
|------|------|------|
| `uid` | `string` | מזהה ייחודי לתבנית. לאחר השמירה, ניתן להריץ אותה באמצעות `runById(uid, ...)`. |
| `sql` | `string` | תוכן ה-SQL. תומך במשתני תבנית `{{ctx.xxx}}` ובסימני מקום `:name` / `?`. |
| `dataSourceKey` | `string` | אופציונלי. מזהה מקור נתונים. |

## משתני תבנית SQL וקישור פרמטרים

### משתני תבנית `{{ctx.xxx}}`

ניתן להשתמש ב-`{{ctx.xxx}}` בתוך SQL כדי להתייחס למשתני הקשר (context). אלו מפוענחים לערכים בפועל לפני ההרצה:

```js
// התייחסות ל-ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

מקורות המשתנים הניתנים להתייחסות זהים לאלו של `ctx.getVar()` (למשל, `ctx.user.*`, `ctx.record.*`, `ctx.defineProperty` מותאם אישית וכו').

### קישור פרמטרים (Parameter Binding)

- **פרמטרים שמיים**: השתמשו ב-`:name` ב-SQL והעבירו אובייקט `{ name: value }` ב-`bind`.
- **פרמטרים לפי מיקום**: השתמשו ב-`?` ב-SQL והעבירו מערך `[value1, value2]` ב-`bind`.

```js
// פרמטרים שמיים
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// פרמטרים לפי מיקום
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['London', 'active'], type: 'selectVar' }
);
```

## דוגמאות

### הרצת SQL זמני (דורש הרשאת תצורת SQL)

```js
// תוצאה של שורות מרובות (ברירת מחדל)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// תוצאה של שורה בודדת
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// תוצאה של ערך בודד (למשל COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### שימוש במשתני תבנית

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### שמירה ושימוש חוזר בתבניות

```js
// שמירה (דורש הרשאת תצורת SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// כל משתמש מחובר יכול להריץ זאת
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// מחיקת תבנית (דורש הרשאת תצורת SQL)
await ctx.sql.destroy('active-users-report');
```

### רשימה עם דפדוף (SQLResource)

```js
// השתמשו ב-SQLResource כאשר נדרש דפדוף או סינון
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // מזהה של תבנית SQL שמורה
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // כולל page, pageSize וכו'
```

## הקשר בין ctx.resource ל-ctx.request

| שימוש | דרך מומלצת |
|------|----------|
| **ביצוע שאילתת SQL** | `ctx.sql.run()` או `ctx.sql.runById()` |
| **רשימת SQL עם דפדוף (בלוק)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **בקשת HTTP כללית** | `ctx.request()` |

`ctx.sql` עוטף את ה-API של `flowSql` ומיועד ספציפית לתרחישי SQL; ניתן להשתמש ב-`ctx.request` כדי לקרוא לכל API אחר.

## נקודות לתשומת לב

- השתמשו בקישור פרמטרים (`:name` / `?`) במקום שרשור מחרוזות כדי למנוע הזרקת SQL (SQL Injection).
- `type: 'selectVar'` מחזיר ערך סקלארי, המשמש בדרך כלל עבור `COUNT`, `SUM` וכדומה.
- משתני תבנית `{{ctx.xxx}}` מפוענחים לפני ההרצה; ודאו שהמשתנים המתאימים מוגדרים בהקשר (context).

## נושאים קשורים

- [ctx.resource](./resource.md): משאבי נתונים; SQLResource קורא ל-API של `flowSql` באופן פנימי.
- [ctx.initResource()](./init-resource.md): אתחול SQLResource עבור רשימות עם דפדוף וכו'.
- [ctx.request()](./request.md): בקשות HTTP כלליות.