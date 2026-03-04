:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/interface-builder/fields/specific/js-field).
:::

# שדה JS

## מבוא

שדה JS (JS Field) משמש לרינדור תוכן מותאם אישית באמצעות JavaScript במיקום השדה, נפוץ בבלוקי פרטים, פריטים לקריאה בלבד בטפסים, או כ"פריטים מותאמים אישית אחרים" בעמודות טבלה. מתאים לתצוגה מותאמת אישית, שילוב מידע נגזר, תגי סטטוס, טקסט עשיר או תרשימים.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## סוגים

- סוג לקריאה בלבד: משמש לתצוגה שאינה ניתנת לעריכה, קורא את `ctx.value` לרינדור הפלט.
- סוג ניתן לעריכה: משמש לאינטראקציות קלט מותאמות אישית, מספק את `ctx.getValue()`/`ctx.setValue(v)` ואירוע קונטיינר `js-field:value-change`, המקל על סנכרון דו-כיווני עם ערכי הטופס.

## תרחישי שימוש

- סוג לקריאה בלבד
  - בלוק פרטים: הצגת תוכן לקריאה בלבד כגון תוצאות חישוב, תגי סטטוס, קטעי טקסט עשיר, תרשימים וכו';
  - בלוק טבלה: משמש כ"עמודה מותאמת אישית אחרת > שדה JS" לתצוגה לקריאה בלבד (אם נדרשת עמודה שאינה קשורה לשדה, אנא השתמשו ב-JS Column);

- סוג ניתן לעריכה
  - בלוק טופס (CreateForm/EditForm): משמש לבקרות קלט מותאמות אישית או קלט מורכב, המאומתים ונשלחים עם הטופס;
  - תרחישים מתאימים: רכיבי קלט מספריות חיצוניות, עורכי טקסט עשיר/קוד, רכיבים דינמיים מורכבים וכו';

## API של קונטקסט זמן ריצה

קוד זמן הריצה של שדה JS יכול להשתמש ישירות ביכולות הקונטקסט הבאות:

- `ctx.element`: קונטיינר ה-DOM של השדה (ElementProxy), תומך ב-`innerHTML`, `querySelector`, `addEventListener` וכו';
- `ctx.value`: ערך השדה הנוכחי (לקריאה בלבד);
- `ctx.record`: אובייקט הרשומה הנוכחי (לקריאה בלבד);
- `ctx.collection`: מטא-נתונים של ה**אוסף** (Collection) אליו שייך השדה (לקריאה בלבד);
- `ctx.requireAsync(url)`: טעינה אסינכרונית של ספריית AMD/UMD לפי URL;
- `ctx.importAsync(url)`: ייבוא דינמי של מודול ESM לפי URL;
- `ctx.openView(options)`: פתיחת תצוגה מוגדרת (חלון קופץ/מגירה/דף);
- `ctx.i18n.t()` / `ctx.t()`: בינאום (Internationalization);
- `ctx.onRefReady(ctx.ref, cb)`: רינדור לאחר שהקונטיינר מוכן;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: ספריות מובנות כגון React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js לרינדור JSX, טיפול בזמן, פעולות בנתונים וחישובים מתמטיים. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` נשמרים לצורך תאימות.)
- `ctx.render(vnode)`: מרנדר אלמנט React, מחרוזת HTML או צומת DOM לתוך קונטיינר ברירת המחדל `ctx.element`; רינדור חוזר יעשה שימוש חוזר ב-Root וידרוס את התוכן הקיים בקונטיינר.

ייחודי לסוג ניתן לעריכה (JSEditableField):

- `ctx.getValue()`: קבלת ערך הטופס הנוכחי (עדיפות למצב הטופס, ולאחר מכן חזרה ל-props של השדה).
- `ctx.setValue(v)`: הגדרת ערך הטופס ו-props של השדה, תוך שמירה על סנכרון דו-כיווני.
- אירוע קונטיינר `js-field:value-change`: מופעל כאשר ערך חיצוני משתנה, מה שמקל על הסקריפט לעדכן את תצוגת הקלט.

## עורך וקטעי קוד

עורך הסקריפטים של שדה JS תומך בהדגשת תחביר, רמזי שגיאות וקטעי קוד מובנים (Snippets).

- `Snippets`: פותח רשימה של קטעי קוד מובנים, שניתן לחפש ולהוסיף בלחיצה אחת למיקום הסמן הנוכחי.
- `Run`: מריץ ישירות את הקוד הנוכחי, יומן ההרצה מוצג בלוח `Logs` בתחתית, תומך ב-`console.log/info/warn/error` ובהדגשת שגיאות לאיתור.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

ניתן לשלב עם עובד AI ליצירת קוד:

- [עובד AI · Nathan: מהנדס פרונטאנד](/ai-employees/features/built-in-employee)

## שימושים נפוצים

### 1) רינדור בסיסי (קריאת ערך שדה)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) שימוש ב-JSX לרינדור רכיב React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) טעינת ספריות צד שלישי (AMD/UMD או ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) לחיצה לפתיחת חלון קופץ/מגירה (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">צפה בפרטים</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) קלט ניתן לעריכה (JSEditableFieldModel)

```js
// רינדור קלט פשוט באמצעות JSX וסנכרון ערך הטופס
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// סנכרון הקלט כאשר הערך החיצוני משתנה (אופציונלי)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## הערות

- מומלץ להשתמש ב-CDN מהימן לטעינת ספריות חיצוניות, ולדאוג למנגנון גיבוי לתרחישי כשל (כגון `if (!lib) return;`).
- מומלץ להשתמש ב-`class` או `[name=...]` עבור סלקטורים ולהימנע משימוש ב-`id` קבוע, כדי למנוע כפילויות `id` בבלוקים/חלונות קופצים מרובים.
- ניקוי אירועים: שדה עשוי לעבור רינדור מחדש מספר פעמים עקב שינויי נתונים או מעבר בין תצוגות. לפני קישור אירוע, יש לנקות אותו או למנוע כפילויות כדי למנוע הפעלה חוזרת. ניתן "להסיר תחילה ואז להוסיף".