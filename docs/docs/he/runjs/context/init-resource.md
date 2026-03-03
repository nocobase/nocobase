:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/init-resource).
:::

# ctx.initResource()

**מאתחל** את ה-resource עבור ההקשר (context) הנוכחי: אם `ctx.resource` אינו קיים עדיין, הפונקציה יוצרת אחד מהסוג שצוין וקושרת אותו להקשר; אם הוא כבר קיים, נעשה בו שימוש ישיר. לאחר מכן, ניתן לגשת אליו דרך `ctx.resource`.

## תרחישי שימוש

בדרך כלל נעשה בו שימוש בתרחישי **JSBlock** (בלוק עצמאי). ברוב הבלוקים, חלונות קופצים (popups) ורכיבים אחרים, `ctx.resource` כבר קשור מראש ואין צורך בקריאות ידניות. ל-JSBlock אין resource כברירת מחדל, לכן יש לקרוא ל-`ctx.initResource(type)` לפני טעינת נתונים דרך `ctx.resource`.

## הגדרת סוג (Type Definition)

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| פרמטר | סוג | תיאור |
|------|------|------|
| `type` | `string` | סוג המשאב: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**ערך חזרה**: מופע ה-resource בהקשר הנוכחי (כלומר, `ctx.resource`).

## ההבדל מ-ctx.makeResource()

| מתודה | התנהגות |
|--------|----------|
| `ctx.initResource(type)` | יוצר וקושר אם `ctx.resource` אינו קיים; מחזיר את הקיים אם הוא כבר שם. מבטיח ש-`ctx.resource` יהיה זמין. |
| `ctx.makeResource(type)` | יוצר ומחזיר מופע חדש בלבד, **לא** כותב ל-`ctx.resource`. מתאים לתרחישים הדורשים מספר משאבים עצמאיים או שימוש זמני. |

## דוגמאות

### נתוני רשימה (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### רשומה בודדת (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // ציון מפתח ראשי
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### ציון מקור נתונים

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## נקודות לתשומת לב

- ברוב תרחישי הבלוקים (טפסים, טבלאות, פרטים וכו') וחלונות קופצים, `ctx.resource` כבר קשור מראש על ידי סביבת ההרצה, ולכן הקריאה ל-`ctx.initResource` אינה נחוצה.
- אתחול ידני נדרש רק בהקשרים כמו JSBlock שבהם אין resource כברירת מחדל.
- לאחר האתחול, יש לקרוא ל-`setResourceName(name)` כדי לציין את ה**אוסף** (collection), ולאחר מכן לקרוא ל-`refresh()` כדי לטעון את הנתונים.

## קשור

- [ctx.resource](./resource.md) — מופע ה-resource בהקשר הנוכחי
- [ctx.makeResource()](./make-resource.md) — יוצר מופע resource חדש מבלי לקשור אותו ל-`ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — רשומות מרובות/רשימה
- [SingleRecordResource](../resource/single-record-resource.md) — רשומה בודדת
- [APIResource](../resource/api-resource.md) — משאב API כללי
- [SQLResource](../resource/sql-resource.md) — משאב שאילתת SQL