:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/open-view).
:::

# ctx.openView()

פתיחת תצוגה מוגדרת באופן תכנותי (מגירה, חלונית קופצת, דף מוטמע וכו'). הפונקציה מסופקת על ידי `FlowModelContext`, ומשמשת לפתיחת תצוגות `ChildPage` או `PopupAction` שהוגדרו בתרחישים כגון `JSBlock`, תאי טבלה, ותהליכי עבודה.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **JSBlock** | פתיחת חלונית פרטים/עריכה לאחר לחיצה על כפתור, תוך העברת ה-`filterByTk` של השורה הנוכחית. |
| **תא טבלה** | רינדור כפתור בתוך תא שפותח חלונית פרטי שורה בעת לחיצה. |
| **תהליך עבודה / JSAction** | פתיחת התצוגה הבאה או חלונית קופצת לאחר ביצוע פעולה מוצלחת. |
| **שדה קשר** | פתיחת חלונית בחירה/עריכה באמצעות `ctx.runAction('openView', params)`. |

> הערה: `ctx.openView` זמין בסביבת RunJS שבה קיים הקשר (context) של `FlowModel`; אם המודל המתאים ל-`uid` אינו קיים, ייווצר `PopupActionModel` באופן אוטומטי והוא יישמר.

## חתימה

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## הסבר פרמטרים

### uid

המזהה הייחודי של מודל התצוגה. אם אינו קיים, הוא ייווצר ויישמר אוטומטית. מומלץ להשתמש ב-UID יציב, כגון `${ctx.model.uid}-detail`, כדי שניתן יהיה לעשות שימוש חוזר בהגדרות בעת פתיחת אותה חלונית מספר פעמים.

### שדות נפוצים ב-options

| שדה | סוג | הסבר |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | אופן הפתיחה: מגירה (drawer), חלונית (dialog) או מוטמע (embed). ברירת מחדל: `drawer`. |
| `size` | `small` / `medium` / `large` | גודל החלונית או המגירה. ברירת מחדל: `medium`. |
| `title` | `string` | כותרת התצוגה. |
| `params` | `Record<string, any>` | פרמטרים שרירותיים המועברים לתצוגה. |
| `filterByTk` | `any` | ערך המפתח הראשי, משמש לתרחישי פרטים/עריכה של רשומה בודדת. |
| `sourceId` | `string` | מזהה רשומת המקור, משמש בתרחישי קשרים (associations). |
| `dataSourceKey` | `string` | מקור נתונים. |
| `collectionName` | `string` | שם האוסף. |
| `associationName` | `string` | שם שדה הקשר. |
| `navigation` | `boolean` | האם להשתמש בניווט נתיבים (routing). כאשר מועברים `defineProperties` או `defineMethods`, ערך זה ייקבע כ-`false` באופן כפוי. |
| `preventClose` | `boolean` | האם למנוע סגירה. |
| `defineProperties` | `Record<string, PropertyOptions>` | הזרקת מאפיינים (properties) באופן דינמי למודל שבתוך התצוגה. |
| `defineMethods` | `Record<string, Function>` | הזרקת מתודות (methods) באופן דינמי למודל שבתוך התצוגה. |

## דוגמאות

### שימוש בסיסי: פתיחת מגירה

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Details'),
});
```

### העברת הקשר (context) של השורה הנוכחית

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Row Details'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### פתיחה באמצעות runAction

כאשר מודל מוגדר עם פעולת `openView` (כגון שדות קשר או שדות לחיצים), ניתן לקרוא ל:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### הזרקת הקשר (context) מותאם אישית

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## היחס בין ctx.openView, ctx.viewer ו-ctx.view

| שימוש | שיטה מומלצת |
|------|----------|
| **פתיחת תצוגת תהליך מוגדרת** | `ctx.openView(uid, options)` |
| **פתיחת תוכן מותאם אישית (ללא תהליך)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **פעולה על התצוגה הפתוחה כעת** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` פותח `FlowPage` (`ChildPageModel`), המרנדר דף תהליך מלא באופן פנימי; `ctx.viewer` פותח תוכן React שרירותי.

## נקודות לתשומת לב

- מומלץ לקשר את ה-`uid` ל-`ctx.model.uid` (למשל `${ctx.model.uid}-xxx`), כדי למנוע התנגשויות בין בלוקים שונים.
- בעת העברת `defineProperties` או `defineMethods`, ה-`navigation` ייקבע כ-`false` באופן כפוי כדי למנוע אובדן הקשר לאחר רענון.
- בתוך החלונית, `ctx.view` מתייחס למופע התצוגה הנוכחי, וניתן להשתמש ב-`ctx.view.inputArgs` כדי לקרוא את הפרמטרים שהועברו בעת הפתיחה.

## נושאים קשורים

- [ctx.view](./view.md): מופע התצוגה הפתוחה כעת.
- [ctx.model](./model.md): המודל הנוכחי, משמש לבניית `popupUid` יציב.