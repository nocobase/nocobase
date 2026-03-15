:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/resource).
:::

# ctx.resource

מופע ה-**FlowResource** בהקשר (context) הנוכחי, המשמש לגישה וביצוע פעולות על נתונים. ברוב הבלוקים (טפסים, טבלאות, פרטים וכו') ובתרחישי חלונות קופצים (pop-ups), סביבת ההרצה קושרת מראש את `ctx.resource`. בתרחישים כמו JSBlock שבהם אין resource כברירת מחדל, יש לקרוא תחילה ל-[ctx.initResource()](./init-resource.md) כדי לאתחל אותו לפני השימוש דרך `ctx.resource`.

## תרחישים רלוונטיים

ניתן להשתמש ב-`ctx.resource` בכל תרחיש RunJS הדורש גישה לנתונים מובנים (רשימות, רשומות בודדות, ממשקי API מותאמים אישית, SQL). בלוקים של טפסים, טבלאות, פרטים וחלוניות קופצות בדרך כלל קשורים מראש. עבור JSBlock, JSField, JSItem, JSColumn וכו', אם נדרשת טעינת נתונים, ניתן לקרוא ל-`ctx.initResource(type)` תחילה ולאחר מכן לגשת ל-`ctx.resource`.

## הגדרת טיפוס (Type Definition)

```ts
resource: FlowResource | undefined;
```

- בהקשרים עם קישור מראש, `ctx.resource` הוא מופע ה-resource המתאים.
- בתרחישים כמו JSBlock שבהם אין resource כברירת מחדל, הערך הוא `undefined` עד לקריאה ל-`ctx.initResource(type)`.

## מתודות נפוצות

המתודות החשופות על ידי סוגי resource שונים (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) משתנות מעט. להלן המתודות האוניברסליות או הנפוצות:

| מתודה | הסבר |
|------|------|
| `getData()` | קבלת הנתונים הנוכחיים (רשימה או רשומה בודדת) |
| `setData(value)` | הגדרת נתונים מקומיים |
| `refresh()` | ביצוע בקשה עם הפרמטרים הנוכחיים לרענון הנתונים |
| `setResourceName(name)` | הגדרת שם המשאב (למשל `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | הגדרת סינון לפי מפתח ראשי (עבור `get` של רשומה בודדת וכו') |
| `runAction(actionName, options)` | קריאה לכל פעולת (action) משאב (למשל `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | הרשמה/ביטול הרשמה לאירועים (למשל `refresh`, `saved`) |

**ייחודי ל-MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()` וכו'.

## דוגמאות

### נתוני רשימה (דורש initResource תחילה)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### תרחיש טבלה (קשור מראש)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Deleted'));
```

### רשומה בודדת

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### קריאה ל-action מותאם אישית

```js
await ctx.resource.runAction('create', { data: { name: 'John Doe' } });
```

## היחס בין ctx.initResource ל-ctx.makeResource

- **ctx.initResource(type)**: אם `ctx.resource` אינו קיים, הוא יוצר וקושר אחד; אם הוא כבר קיים, הוא מחזיר את המופע הקיים. זה מבטיח ש-`ctx.resource` יהיה זמין.
- **ctx.makeResource(type)**: יוצר מופע resource חדש ומחזיר אותו, אך **לא** כותב אותו ל-`ctx.resource`. מתאים לתרחישים הדורשים מספר משאבים עצמאיים או שימוש זמני.
- **ctx.resource**: גישה ל-resource שכבר קשור להקשר הנוכחי. רוב הבלוקים/חלונות הקופצים קשורים מראש; אחרת, הערך הוא `undefined` ודורש `ctx.initResource`.

## הערות

- מומלץ לבצע בדיקת ערך ריק (null check) לפני השימוש: `ctx.resource?.refresh()`, במיוחד בתרחישים כמו JSBlock שבהם ייתכן שלא קיים קישור מראש.
- לאחר האתחול, יש לקרוא ל-`setResourceName(name)` כדי לציין את ה**אוסף** (collection) לפני טעינת הנתונים באמצעות `refresh()`.
- עבור ה-API המלא של כל סוג Resource, עיינו בקישורים למטה.

## נושאים קשורים

- [ctx.initResource()](./init-resource.md) - אתחול וקשירת resource להקשר הנוכחי
- [ctx.makeResource()](./make-resource.md) - יצירת מופע resource חדש מבלי לקשור אותו ל-`ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - רשומות מרובות/רשימות
- [SingleRecordResource](../resource/single-record-resource.md) - רשומה בודדת
- [APIResource](../resource/api-resource.md) - משאב API כללי
- [SQLResource](../resource/sql-resource.md) - משאב שאילתת SQL