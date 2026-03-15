:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/make-resource).
:::

# ctx.makeResource()

**יוצר** ומחזיר מופע (instance) חדש של משאב (resource), **מבלי** לכתוב או לשנות את `ctx.resource`. מתאים לתרחישים הדורשים מספר משאבים עצמאיים או לשימוש זמני.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **מספר משאבים** | טעינת מספר מקורות נתונים בו-זמנית (למשל, רשימת משתמשים + רשימת הזמנות), כאשר כל אחד משתמש במשאב עצמאי. |
| **שאילתות זמניות** | שאילתות חד-פעמיות שנזרקות לאחר השימוש, ללא צורך בשיוך ל-`ctx.resource`. |
| **נתוני עזר** | שימוש ב-`ctx.resource` עבור הנתונים הראשיים ושימוש ב-`makeResource` ליצירת מופעים עבור נתונים נוספים. |

אם דרוש לכם משאב יחיד בלבד ואתם מעוניינים לשייך אותו ל-`ctx.resource`, השימוש ב-[ctx.initResource()](./init-resource.md) מתאים יותר.

## הגדרת טיפוסים (Type Definition)

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| פרמטר | טיפוס | הסבר |
|------|------|------|
| `resourceType` | `string` | סוג המשאב: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**ערך מוחזר**: מופע המשאב החדש שנוצר.

## ההבדל מ-ctx.initResource()

| מתודה | התנהגות |
|------|------|
| `ctx.makeResource(type)` | יוצר ומחזיר מופע חדש בלבד, **אינו** כותב ל-`ctx.resource`. ניתן לקרוא לו מספר פעמים כדי לקבל מספר משאבים עצמאיים. |
| `ctx.initResource(type)` | יוצר ומשייך אם `ctx.resource` אינו קיים; מחזיר אותו ישירות אם הוא כבר קיים. מבטיח ש-`ctx.resource` יהיה זמין. |

## דוגמאות

### משאב יחיד

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource נשאר בערכו המקורי (אם קיים)
```

### מספר משאבים

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>מספר משתמשים: {usersRes.getData().length}</p>
    <p>מספר הזמנות: {ordersRes.getData().length}</p>
  </div>
);
```

### שאילתה זמנית

```ts
// שאילתה חד-פעמית, אינה "מזהמת" את ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## הערות

- המשאב החדש שנוצר צריך לקרוא ל-`setResourceName(name)` כדי לציין את האוסף (collection), ולאחר מכן לטעון נתונים באמצעות `refresh()`.
- כל מופע של משאב הוא עצמאי ואינו משפיע על אחרים; מתאים לטעינה מקבילית של מספר מקורות נתונים.

## נושאים קשורים

- [ctx.initResource()](./init-resource.md): אתחול ושיוך ל-`ctx.resource`
- [ctx.resource](./resource.md): מופע המשאב בהקשר (context) הנוכחי
- [MultiRecordResource](../resource/multi-record-resource) — רשומות מרובות/רשימה
- [SingleRecordResource](../resource/single-record-resource) — רשומה בודדת
- [APIResource](../resource/api-resource) — משאב API כללי
- [SQLResource](../resource/sql-resource) — משאב שאילתת SQL