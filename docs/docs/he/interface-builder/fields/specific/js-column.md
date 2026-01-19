:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# עמודת JS

## מבוא

עמודת JS משמשת עבור "עמודות מותאמות אישית" בטבלאות, ומאפשרת לרנדר את תוכן התא בכל שורה באמצעות JavaScript. היא אינה קשורה לשדה ספציפי ומתאימה לתרחישים כמו עמודות נגזרות, הצגה משולבת של נתונים מכמה שדות, תגיות סטטוס, כפתורי פעולה וסיכום נתונים ממקורות מרוחקים.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API של הקשר זמן ריצה

בעת רינדור כל תא, עמודת JS מספקת את יכולות הקשר (context) הבאות:

- `ctx.element`: מיכל ה-DOM של התא הנוכחי (ElementProxy), תומך ב-`innerHTML`, `querySelector`, `addEventListener` ועוד.
- `ctx.record`: אובייקט הרשומה של השורה הנוכחית (לקריאה בלבד).
- `ctx.recordIndex`: אינדקס השורה בתוך העמוד הנוכחי (מתחיל מ-0, עשוי להיות מושפע מחלוקה לעמודים).
- `ctx.collection`: מטא-המידע של ה**אוסף** הקשור לטבלה (לקריאה בלבד).
- `ctx.requireAsync(url)`: טוען ספריית AMD/UMD באופן אסינכרוני לפי URL.
- `ctx.importAsync(url)`: מייבא מודול ESM באופן דינמי לפי URL.
- `ctx.openView(options)`: פותח תצוגה מוגדרת (חלון קופץ/מגירה/עמוד).
- `ctx.i18n.t()` / `ctx.t()`: בינאום.
- `ctx.onRefReady(ctx.ref, cb)`: מרנדר לאחר שהמיכל מוכן.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: ספריות מובנות כמו React, ReactDOM, Ant Design, Ant Design Icons ו-dayjs, המשמשות לרינדור JSX וטיפול בזמן-תאריך. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` נשמרים לתאימות לאחור).
- `ctx.render(vnode)`: מרנדר אלמנט React/HTML/DOM למיכל ברירת המחדל `ctx.element` (התא הנוכחי). רינדורים מרובים יעשו שימוש חוזר ב-Root וידרסו את התוכן הקיים של המיכל.

## עורך וקטעי קוד

עורך הסקריפטים של עמודת JS תומך בהדגשת תחביר, רמזי שגיאות וקטעי קוד (Snippets) מובנים.

- `Snippets`: פותח את רשימת קטעי הקוד המובנים, ומאפשר לכם לחפש ולהוסיף אותם במיקום הסמן הנוכחי בלחיצה אחת.
- `Run`: מריץ את הקוד הנוכחי ישירות. יומן ההרצה מוצג בלוח `Logs` בתחתית, ותומך ב-`console.log/info/warn/error` ובהדגשת שגיאות.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

באפשרותכם גם להשתמש בעובד AI כדי ליצור קוד:

- [עובד AI · נתן: מהנדס פרונטאנד](/ai-employees/built-in/ai-coding)

## שימושים נפוצים

### 1) רינדור בסיסי (קריאת רשומת השורה הנוכחית)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) שימוש ב-JSX לרינדור רכיבי React

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) פתיחת חלון קופץ/מגירה מתא (צפייה/עריכה)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>צפייה</a>
);
```

### 4) טעינת ספריות צד שלישי (AMD/UMD או ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## הערות

- מומלץ להשתמש ב-CDN מהימן לטעינת ספריות חיצוניות, ולדאוג למנגנון גיבוי לתרחישי כשל (לדוגמה, `if (!lib) return;`).
- מומלץ להעדיף שימוש בסלקטורים מסוג `class` או `[name=...]` במקום `id` קבועים, כדי למנוע כפילויות `id` בין בלוקים או חלונות קופצים שונים.
- ניקוי אירועים: שורות הטבלה עשויות להשתנות באופן דינמי עם חלוקה לעמודים או רענון, מה שגורם לתאים לעבור רינדור מרובה. יש לנקות או להסיר כפילויות של מאזיני אירועים לפני קישורם, כדי למנוע הפעלות חוזרות.
- טיפ לביצועים: הימנעו מטעינה חוזרת ונשנית של ספריות גדולות בכל תא. במקום זאת, שמרו את הספרייה במטמון ברמה גבוהה יותר (לדוגמה, באמצעות משתנה גלובלי או משתנה ברמת הטבלה) ועשו בה שימוש חוזר.