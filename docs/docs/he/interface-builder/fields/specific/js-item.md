:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# פריט JS

## מבוא

פריט JS משמש עבור "פריטים מותאמים אישית" (שאינם מקושרים לשדה) בטופס. אתם יכולים להשתמש ב-JavaScript/JSX כדי לרנדר כל תוכן (כגון טיפים, סטטיסטיקות, תצוגות מקדימות, כפתורים ועוד), ולקיים אינטראקציה עם הקשר הטופס והרשומה. הוא מתאים לתרחישים כמו תצוגות מקדימות בזמן אמת, טיפים והוראות, ורכיבי אינטראקציה קטנים.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API של הקשר זמן ריצה (שימושים נפוצים)

- `ctx.element`: קונטיינר ה-DOM (ElementProxy) של הפריט הנוכחי, תומך ב-`innerHTML`, `querySelector`, `addEventListener` ועוד.
- `ctx.form`: מופע ה-AntD Form, מאפשר פעולות כמו `getFieldValue / getFieldsValue / setFieldsValue / validateFields` ועוד.
- `ctx.blockModel`: מודל בלוק הטופס אליו הוא שייך, יכול להאזין ל-`formValuesChange` כדי ליישם קישוריות (linkage).
- `ctx.record` / `ctx.collection`: הרשומה הנוכחית ומטא-נתוני ה**אוסף** (זמינים בתרחישים מסוימים).
- `ctx.requireAsync(url)`: טוען ספריית AMD/UMD באופן אסינכרוני לפי URL.
- `ctx.importAsync(url)`: מייבא מודול ESM באופן דינמי לפי URL.
- `ctx.openView(viewUid, options)`: פותח תצוגה מוגדרת (מגירה/דיאלוג/עמוד).
- `ctx.message` / `ctx.notification`: הודעה והתראה גלובליות.
- `ctx.t()` / `ctx.i18n.t()`: בינאום (Internationalization).
- `ctx.onRefReady(ctx.ref, cb)`: מרנדר לאחר שהקונטיינר מוכן.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: ספריות מובנות כמו React, ReactDOM, Ant Design, אייקוני Ant Design ו-dayjs, המשמשות לרינדור JSX ולטיפול בתאריכים ושעות. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` נשמרו לתאימות לאחור.)
- `ctx.render(vnode)`: מרנדר אלמנט React/HTML/DOM לקונטיינר ברירת המחדל `ctx.element`. רינדורים מרובים יעשו שימוש חוזר ב-Root וידרסו את התוכן הקיים בקונטיינר.

## עורך וקטעי קוד (Snippets)

- `Snippets`: פותח רשימה של קטעי קוד מובנים, ומאפשר לכם לחפש ולהוסיף אותם במיקום הסמן הנוכחי בלחיצה אחת.
- `Run`: מריץ את הקוד הנוכחי ישירות ומוציא את יומני ההרצה ללוח ה-`Logs` בתחתית. הוא תומך ב-`console.log/info/warn/error` ובהדגשת שגיאות.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- ניתן להשתמש עם עובד AI כדי ליצור/לשנות סקריפטים: [עובד AI · נתן: מהנדס פרונטאנד](/ai-employees/built-in/ai-coding)

## שימושים נפוצים (דוגמאות פשוטות)

### 1) תצוגה מקדימה בזמן אמת (קריאת ערכי טופס)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) פתיחת תצוגה (מגירה)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) טעינה ורינדור של ספריות חיצוניות

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## הערות

- מומלץ להשתמש ב-CDN אמין לטעינת ספריות חיצוניות, ולדאוג למנגנון גיבוי לתרחישי כשל (לדוגמה, `if (!lib) return;`).
- מומלץ לתעדף שימוש ב-`class` או `[name=...]` עבור סלקטורים ולהימנע משימוש ב-`id` קבועים, כדי למנוע כפילויות של `id` בבלוקים/חלונות קופצים מרובים.
- ניקוי אירועים: שינויים תכופים בערכי הטופס יפעילו רינדורים מרובים. לפני קישור אירוע, יש לנקות אותו או למנוע כפילויות (לדוגמה, `remove` לפני `add`, שימוש ב-`{ once: true }`, או שימוש בתכונת `dataset` למניעת כפילויות).

## תיעוד קשור

- [משתנים והקשר](/interface-builder/variables)
- [כללי קישוריות](/interface-builder/linkage-rule)
- [תצוגות וחלונות קופצים](/interface-builder/actions/types/view)