:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/interface-builder/actions/types/js-action).
:::

# JS Action

## 介绍

JS Action 用于按钮点击时执行 JavaScript，自定义任意业务行为。可用于表单工具栏、表格工具栏（集合级）、表格行（记录级）等位置，实现校验、提示、接口调用、打开弹窗/抽屉、刷新数据等操作。

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API של הקשר זמן ריצה (נפוץ)

- `ctx.api.request(options)`: ביצוע בקשת HTTP;
- `ctx.openView(viewUid, options)`: פתיחת תצוגה מוגדרת (מגירה/דיאלוג/דף);
- `ctx.message` / `ctx.notification`: התראות והודעות גלובליות;
- `ctx.t()` / `ctx.i18n.t()`: בינאום;
- `ctx.resource`: משאב נתונים של הקשר ברמת ה**אוסף** (כגון סרגל כלים של טבלה, כולל `getSelectedRows()`, `refresh()` וכו');
- `ctx.record`: רשומת השורה הנוכחית של הקשר ברמת הרשומה (כגון כפתור בשורת טבלה);
- `ctx.form`: מופע AntD Form של הקשר ברמת הטופס (כגון כפתור בסרגל כלים של טופס);
- `ctx.collection`: מטא-נתונים של ה**אוסף** הנוכחי;
- עורך הקוד תומך בקטעי קוד `Snippets` והרצה מוקדמת `Run` (ראו להלן).


- `ctx.requireAsync(url)`: טעינה אסינכרונית של ספריות AMD/UMD לפי URL;
- `ctx.importAsync(url)`: ייבוא דינמי של מודולי ESM לפי URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: ספריות מובנות כגון React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js וכו', המשמשות לרינדור JSX, טיפול בזמן, פעולות בנתונים וחישובים מתמטיים.

> המשתנים הזמינים בפועל ישתנו בהתאם למיקום הכפתור, לעיל מופיעה סקירה של היכולות הנפוצות.

## עורך וקטעי קוד

- `Snippets`: פתיחת רשימת קטעי קוד מובנים, ניתן לחיפוש ולהכנסה בלחיצה אחת למיקום הסמן הנוכחי.
- `Run`: הרצה ישירה של הקוד הנוכחי, ופלט של יומני ההרצה ללוח ה-`Logs` בתחתית; תמיכה ב-`console.log/info/warn/error` ומיקום שגיאות מודגש.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- ניתן לשלב עם עובד AI ליצירת/שינוי סקריפטים: [עובד AI · Nathan: מהנדס Front-end](/ai-employees/features/built-in-employee)

## שימושים נפוצים (דוגמאות תמציתיות)

### 1) בקשת ממשק והתראה

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) כפתור אוסף: אימות בחירה ועיבוד

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: ביצוע לוגיקה עסקית...
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) כפתור רשומה: קריאת רשומת השורה הנוכחית

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) פתיחת תצוגה (מגירה/דיאלוג)

```js
const popupUid = ctx.model.uid + '-open'; // קשור לכפתור הנוכחי, לשמירה על יציבות
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) רענון נתונים לאחר שליחה

```js
// רענון כללי: עדיפות למשאבי טבלה/רשימה, לאחר מכן למשאב הבלוק שבו נמצא הטופס
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## 注意事项

- אידמפוטנטיות של התנהגות: הימנעו משליחות מרובות הנגרמות מלחיצות חוזרות, ניתן להוסיף מתג מצב בלוגיקה או להשבית את הכפתור.
- טיפול בשגיאות: הוסיפו try/catch לקריאות ממשק וספקו התראות למשתמש.
- קישוריות תצוגה: בעת פתיחת חלון קופץ/מגירה דרך `ctx.openView`, מומלץ להעביר פרמטרים בצורה מפורשת, ולרענן באופן יזום את משאב ההורה לאחר שליחה מוצלחת במידת הצורך.

## 相关文档

- [משתנים והקשר](/interface-builder/variables)
- [כללי קישוריות](/interface-builder/linkage-rule)
- [תצוגות וחלונות קופצים](/interface-builder/actions/types/view)