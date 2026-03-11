:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/get-var).
:::

# ctx.getVar()

קורא ערכי משתנים מתוך הקשר ההרצה (runtime context) הנוכחי באופן **אסינכרוני**. פענוח המשתנים תואם לשימוש ב-`{{ctx.xxx}}` ב-SQL ובתבניות (templates), ובדרך כלל מגיע מהמשתמש הנוכחי, הרשומה הנוכחית, פרמטרים של תצוגה, הקשר של חלון קופץ (popup) וכו'.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **JSBlock / JSField** | קבלת מידע על הרשומה הנוכחית, המשתמש, המשאב וכו' לצורך רינדור או לוגיקה |
| **כללי קישוריות / FlowEngine** | קריאת `ctx.record`, `ctx.formValues` וכו' לצורך בדיקת תנאים |
| **נוסחאות / תבניות** | שימוש באותם כללי פענוח משתנים כמו ב-`{{ctx.xxx}}` |

## הגדרת טיפוסים

```ts
getVar(path: string): Promise<any>;
```

| פרמטר | טיפוס | הסבר |
|------|------|------|
| `path` | `string` | נתיב המשתנה, **חייב להתחיל ב-`.ctx`**, תומך בגישה באמצעות נקודה (dot notation) ובאינדקסים של מערך |

**ערך מוחזר**: `Promise<any>`, יש להשתמש ב-`await` כדי לקבל את הערך המפוענח; מחזיר `undefined` אם המשתנה אינו קיים.

> אם מועבר נתיב שאינו מתחיל ב-`.ctx`, תיזרק שגיאה: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## נתיבי משתנים נפוצים

| נתיב | הסבר |
|------|------|
| `ctx.record` | הרשומה הנוכחית (זמין כאשר הטופס/הפרטים מקושרים לרשומה) |
| `ctx.record.id` | המפתח הראשי של הרשומה הנוכחית |
| `ctx.formValues` | ערכי הטופס הנוכחי (נפוץ בכללי קישוריות וב-FlowEngine; בתרחישי טופס, עדיף להשתמש ב-`ctx.form.getFieldsValue()` לקריאה בזמן אמת) |
| `ctx.user` | המשתמש המחובר הנוכחי |
| `ctx.user.id` | מזהה המשתמש הנוכחי |
| `ctx.user.nickname` | כינוי המשתמש הנוכחי |
| `ctx.user.roles.name` | שמות התפקידים של המשתמש הנוכחי (מערך) |
| `ctx.popup.record` | רשומה בתוך חלון קופץ |
| `ctx.popup.record.id` | המפתח הראשי של הרשומה בתוך חלון קופץ |
| `ctx.urlSearchParams` | פרמטרים של שאילתת URL (מפוענח מתוך `?key=value`) |
| `ctx.token` | ה-API Token הנוכחי |
| `ctx.role` | התפקיד הנוכחי |

## ctx.getVarInfos()

מקבל את **המידע המבני** (טיפוס, כותרת, תתי-מאפיינים וכו') של משתנים הניתנים לפענוח בהקשר הנוכחי, מה שמקל על חקירת נתיבים זמינים. הערך המוחזר הוא תיאור סטטי המבוסס על `meta` ואינו כולל ערכי הרצה בפועל.

### הגדרת טיפוסים

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

בתוצאה המוחזרת, כל מפתח (key) הוא נתיב משתנה, והערך (value) הוא המידע המבני עבור אותו נתיב (כולל `type`, `title`, `properties` וכו').

### פרמטרים

| פרמטר | טיפוס | הסבר |
|------|------|------|
| `path` | `string \| string[]` | נתיב קיצוץ, אוסף רק את מבנה המשתנים תחת נתיב זה. תומך ב-`'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; מערך מייצג מיזוג של מספר נתיבים |
| `maxDepth` | `number` | עומק הרחבה מקסימלי, ברירת המחדל היא `3`. כאשר לא מועבר `path`, למאפיינים ברמה העליונה יש `depth=1`; כאשר מועבר `path`, לצומת המתאים לנתיב יש `depth=1` |

### דוגמה

```ts
// קבלת מבנה המשתנים תחת record (הרחבה עד 3 רמות)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// קבלת המבנה של popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// קבלת מבנה המשתנים המלא ברמה העליונה (ברירת מחדל maxDepth=3)
const vars = await ctx.getVarInfos();
```

## ההבדל מ-ctx.getValue

| מתודה | תרחיש שימוש | הסבר |
|------|----------|------|
| `ctx.getValue()` | שדות ניתנים לעריכה כגון JSField, JSItem | קבלת ערך **השדה הנוכחי** באופן סינכרוני, דורש קישור לטופס |
| `ctx.getVar(path)` | כל הקשר RunJS | קבלת **כל משתנה ctx** באופן אסינכרוני, הנתיב חייב להתחיל ב-`.ctx` |

ב-JSField, השתמשו ב-`getValue`/`setValue` כדי לקרוא/לכתוב את השדה הנוכחי; השתמשו ב-`getVar` כדי לגשת למשתני הקשר אחרים (כמו record, user, formValues).

## הערות חשובות

- **הנתיב חייב להתחיל ב-`.ctx`**: לדוגמה `ctx.record.id`, אחרת תיזרק שגיאה.
- **מתודה אסינכרונית**: יש להשתמש ב-`await` כדי לקבל את התוצאה, לדוגמה `const id = await ctx.getVar('ctx.record.id')`.
- **משתנה לא קיים**: מחזיר `undefined`, ניתן להשתמש ב-`??` לאחר התוצאה כדי להגדיר ערך ברירת מחדל: `(await ctx.getVar('ctx.user.nickname')) ?? 'אורח'`.
- **ערכי טופס**: יש לאחזר את `ctx.formValues` באמצעות `await ctx.getVar('ctx.formValues')`, הוא אינו חשוף ישירות כ-`ctx.formValues`. בהקשר של טופס, עדיף להשתמש ב-`ctx.form.getFieldsValue()` כדי לקרוא את הערכים העדכניים ביותר בזמן אמת.

## דוגמאות

### קבלת מזהה הרשומה הנוכחית

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`רשומה נוכחית: ${recordId}`);
}
```

### קבלת רשומה בתוך חלון קופץ

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`רשומת חלון קופץ נוכחית: ${recordId}`);
}
```

### קריאת תת-פריטים בשדה מערך

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// מחזיר מערך של שמות תפקידים, לדוגמה ['admin', 'member']
```

### הגדרת ערך ברירת מחדל

```ts
// ל-getVar אין פרמטר defaultValue, ניתן להשתמש ב-?? לאחר התוצאה
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'אורח';
```

### קריאת ערך שדה בטופס

```ts
// ctx.formValues ו-ctx.form שניהם שייכים לתרחישי טופס, ניתן להשתמש ב-getVar לקריאת שדות מקוננים
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### קריאת פרמטרים של שאילתת URL

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // מתאים ל-?id=xxx
```

### חקירת משתנים זמינים

```ts
// קבלת מבנה המשתנים תחת record (הרחבה עד 3 רמות)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars ייראה כך: { 'record.id': { type: 'string', title: 'id' }, ... }
```

## נושאים קשורים

- [ctx.getValue()](./get-value.md) - קבלת ערך השדה הנוכחי באופן סינכרוני (JSField/JSItem בלבד)
- [ctx.form](./form.md) - מופע טופס, `ctx.form.getFieldsValue()` יכול לקרוא ערכי טופס בזמן אמת
- [ctx.model](./model.md) - המודל שבו נמצא הקשר ההרצה הנוכחי
- [ctx.blockModel](./block-model.md) - בלוק האב שבו נמצא ה-JS הנוכחי
- [ctx.resource](./resource.md) - מופע ה-resource בהקשר הנוכחי
- `{{ctx.xxx}}` ב-SQL / תבניות - משתמש באותם כללי פענוח כמו `ctx.getVar('ctx.xxx')`