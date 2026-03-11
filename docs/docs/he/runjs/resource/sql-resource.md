:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/resource/sql-resource).
:::

# SQLResource

משאב (Resource) לביצוע שאילתות המבוססות על **הגדרות SQL שמורות** או **SQL דינמי**, כאשר מקור הנתונים הוא ממשקי `flowSql:run` / `flowSql:runById`. מתאים לדוחות, סטטיסטיקות, רשימות SQL מותאמות אישית ותרחישים דומים. בניגוד ל-[MultiRecordResource](./multi-record-resource.md), ה-SQLResource אינו תלוי ב**אוספים** (Collections); הוא מבצע שאילתות SQL ישירות ותומך בעימוד (Pagination), קישור פרמטרים (Parameter binding), משתני תבנית (`{{ctx.xxx}}`) ובקרה על סוג התוצאה.

**ירושה**: FlowResource ← APIResource ← BaseRecordResource ← SQLResource.

**דרך יצירה**: `ctx.makeResource('SQLResource')` או `ctx.initResource('SQLResource')`. לביצוע על בסיס הגדרה שמורה יש להשתמש ב-`setFilterByTk(uid)` (ה-uid של תבנית ה-SQL); לצורך ניפוי שגיאות (Debugging), ניתן להשתמש ב-`setDebug(true)` + `setSQL(sql)` לביצוע SQL ישיר; ב-RunJS, ה-`ctx.api` מוזרק על ידי סביבת ההרצה.

---

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **דוחות / סטטיסטיקות** | אגרגציות מורכבות, שאילתות חוצות טבלאות ומדדים סטטיסטיים מותאמים אישית. |
| **רשימות מותאמות אישית ב-JSBlock** | מימוש סינון, מיון או קשרים מיוחדים באמצעות SQL עם רינדור מותאם אישית. |
| **בלוקים של תרשימים** | הנעת מקורות נתונים לתרשימים באמצעות תבניות SQL שמורות, כולל תמיכה בעימוד. |
| **בחירה בין SQLResource ל-ctx.sql** | השתמשו ב-SQLResource כאשר נדרשים עימוד, אירועים (Events) או נתונים ריאקטיביים; השתמשו ב-`ctx.sql.run()` / `ctx.sql.runById()` לשאילתות חד-פעמיות פשוטות. |

---

## פורמט נתונים

- `getData()` מחזיר פורמטים שונים בהתאם ל-`setSQLType()`:
  - `selectRows` (ברירת מחדל): **מערך**, תוצאות של מספר שורות.
  - `selectRow`: **אובייקט בודד**.
  - `selectVar`: **ערך סקלארי** (למשל COUNT, SUM).
- `getMeta()` מחזיר מטא-דאטה כגון עימוד: `page`, `pageSize`, `count`, `totalPage` וכו'.

---

## הגדרות SQL ומצבי הרצה

| מתודה | הסבר |
|------|------|
| `setFilterByTk(uid)` | הגדרת ה-uid של תבנית ה-SQL לביצוע (תואם ל-runById; יש לשמור תחילה בממשק הניהול). |
| `setSQL(sql)` | הגדרת ה-SQL הגולמי (משמש ל-runBySQL רק כאשר מצב debug מופעל באמצעות `setDebug(true)`). |
| `setSQLType(type)` | סוג התוצאה: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | כאשר מוגדר כ-`true`, ה-`refresh` יבצע `runBySQL()`; אחרת, יבצע `runById()`. |
| `run()` | קורא ל-`runBySQL()` או `runById()` בהתאם למצב ה-debug. |
| `runBySQL()` | מבצע הרצה באמצעות ה-SQL שהוגדר ב-`setSQL` (דורש `setDebug(true)`). |
| `runById()` | מבצע הרצה של תבנית ה-SQL השמורה באמצעות ה-uid הנוכחי. |

---

## פרמטרים והקשר (Context)

| מתודה | הסבר |
|------|------|
| `setBind(bind)` | קישור משתנים. אובייקט עבור מצייני מקום מסוג `:name`, או מערך עבור מצייני מקום מסוג `?`. |
| `setLiquidContext(ctx)` | הקשר תבנית (Liquid), משמש לפענוח `{{ctx.xxx}}`. |
| `setFilter(filter)` | תנאי סינון נוספים (מועברים בנתוני הבקשה). |
| `setDataSourceKey(key)` | מזהה **מקור נתונים** (בשימוש בסביבות עם מספר מקורות נתונים). |

---

## עימוד (Pagination)

| מתודה | הסבר |
|------|------|
| `setPage(page)` / `getPage()` | העמוד הנוכחי (ברירת מחדל היא 1). |
| `setPageSize(size)` / `getPageSize()` | מספר פריטים לעמוד (ברירת מחדל היא 20). |
| `next()` / `previous()` / `goto(page)` | ניווט בין עמודים והפעלת `refresh`. |

בתוך ה-SQL, ניתן להשתמש ב-`{{ctx.limit}}` ו-`{{ctx.offset}}` כדי להתייחס לפרמטרי העימוד. SQLResource מזריק את `limit` ו-`offset` להקשר באופן אוטומטי.

---

## משיכת נתונים ואירועים

| מתודה | הסבר |
|------|------|
| `refresh()` | מבצע את ה-SQL (דרך `runById` או `runBySQL`), כותב את התוצאה ל-`setData(data)`, מעדכן את המטא-דאטה ומפעיל את האירוע `'refresh'`. |
| `runAction(actionName, options)` | קורא לפעולות תשתיתיות (כגון `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | מופעל כאשר הרענון הסתיים או כאשר הטעינה מתחילה. |

---

## דוגמאות

### הרצה לפי תבנית שמורה (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // uid של תבנית SQL שמורה
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count וכו'
```

### מצב Debug: הרצת SQL ישירות (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### עימוד וניווט

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// ניווט
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### סוגי תוצאות

```js
// מספר שורות (ברירת מחדל)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// שורה בודדת
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// ערך בודד (למשל COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### שימוש במשתני תבנית

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### האזנה לאירוע refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## הערות

- **runById דורש שמירה מראש של התבנית**: ה-uid ב-`setFilterByTk(uid)` חייב להיות מזהה של תבנית SQL שכבר נשמרה בממשק הניהול. ניתן לשמור אותה באמצעות `ctx.sql.save({ uid, sql })`.
- **מצב Debug דורש הרשאות**: `setDebug(true)` משתמש ב-`flowSql:run`, מה שדורש שלתפקיד הנוכחי יהיו הרשאות להגדרת SQL. `runById` דורש רק שהמשתמש יהיה מחובר.
- **מניעת כפילויות ברענון (Debouncing)**: קריאות מרובות ל-`refresh()` בתוך אותו מחזור אירועים (event loop) יבצעו רק את הקריאה האחרונה כדי למנוע בקשות מיותרות.
- **קישור פרמטרים למניעת הזרקות (Injection)**: השתמשו ב-`setBind()` עם מצייני מקום `:name` או `?` במקום שרשור מחרוזות כדי למנוע הזרקת SQL.

---

## נושאים קשורים

- [ctx.sql](../context/sql.md) - ניהול וביצוע SQL; `ctx.sql.runById` מתאים לשאילתות חד-פעמיות פשוטות.
- [ctx.resource](../context/resource.md) - מופע המשאב בהקשר הנוכחי.
- [ctx.initResource()](../context/init-resource.md) - אתחול וקישור ל-`ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) - יצירת מופע משאב חדש ללא קישור.
- [APIResource](./api-resource.md) - משאב API כללי.
- [MultiRecordResource](./multi-record-resource.md) - מיועד עבור אוספים ורשימות.