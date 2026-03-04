:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/interface-builder/fields/specific/js-item).
:::

# JS Item

##介绍 (מבוא)

JS Item משמש עבור "פריטים מותאמים אישית" (שאינם קשורים לשדה) בטופס. ניתן להשתמש ב-JavaScript/JSX כדי לרנדר כל תוכן (הנחיות, סטטיסטיקות, תצוגה מקדימה, כפתורים וכו') ולקיים אינטראקציה עם הקשר הטופס והרשומה, מתאים לתרחישים כמו תצוגה מקדימה בזמן אמת, הנחיות הסבר, רכיבי אינטראקציה קטנים וכו'.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## 运行时上下文 API（常用） (API של הקשר זמן ריצה - שימושים נפוצים)

- `ctx.element`: מכולת ה-DOM (ElementProxy) של הפריט הנוכחי, תומך ב-`innerHTML`, `querySelector`, `addEventListener` וכו';
- `ctx.form`: מופע AntD Form, מאפשר `getFieldValue / getFieldsValue / setFieldsValue / validateFields` וכו';
- `ctx.blockModel`: מודל בלוק הטופס שבו הוא נמצא, ניתן להאזין ל-`formValuesChange` כדי לממש קישוריות;
- `ctx.record` / `ctx.collection`: מידע מטא של הרשומה וה**אוסף** הנוכחיים (זמין בתרחישים מסוימים);
- `ctx.requireAsync(url)`: טעינה אסינכרונית של ספריית AMD/UMD לפי URL;
- `ctx.importAsync(url)`: ייבוא דינמי של מודול ESM לפי URL;
- `ctx.openView(viewUid, options)`: פתיחת תצוגה שהוגדרה (מגירה/תיבת דו-שיח/דף);
- `ctx.message` / `ctx.notification`: הודעות והתראות גלובליות;
- `ctx.t()` / `ctx.i18n.t()`: בינאום;
- `ctx.onRefReady(ctx.ref, cb)`: רינדור לאחר שהמכולה מוכנה;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: ספריות מובנות כגון React / ReactDOM / Ant Design / אייקוני Ant Design / dayjs / lodash / math.js / formula.js וכו', המשמשות לרינדור JSX, טיפול בזמן, מניפולציה של נתונים וחישובים מתמטיים. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` נשמרים לצורך תאימות.)
- `ctx.render(vnode)`: מרנדר אלמנט React/HTML/DOM למכולת ברירת המחדל `ctx.element`; רינדורים מרובים יעשו שימוש חוזר ב-Root וידרסו את התוכן הקיים במכולה.

## 编辑器与片段 (עורך וקטעי קוד)

- `Snippets`: פותח רשימה של קטעי קוד מובנים, ניתן לחיפוש ולהכנסה בלחיצה אחת במיקום הסמן הנוכחי.
- `Run`: מריץ את הקוד הנוכחי ישירות ומציג את יומני ההרצה בחלונית ה-`Logs` בתחתית; תומך ב-`console.log/info/warn/error` ומיקום שגיאות מודגש.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- ניתן לשלב עם עובד AI ליצירה/שינוי של סקריפטים: [עובד AI · Nathan: מהנדס פרונטאנד](/ai-employees/features/built-in-employee)

## 常见用法（精简示例） (שימושים נפוצים - דוגמאות תמציתיות)

### 1) 实时预览（读取表单值） (תצוגה מקדימה בזמן אמת - קריאת ערכי טופס)

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

### 2) 打开视图（抽屉） (פתיחת תצוגה - מגירה)

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

### 3) 加载外部库并渲染 (טעינת ספריות חיצוניות ורינדור)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## 注意事项 (הערות)

- טעינת ספריות חיצוניות מומלצת באמצעות CDN מהימן, ויש להכין פתרון חלופי למקרה של כשל (למשל `if (!lib) return;`).
- מומלץ לתעדף שימוש ב-`class` או `[name=...]` עבור סלקטורים, ולהימנע משימוש ב-`id` קבוע כדי למנוע כפילות `id` במספר בלוקים/חלונות קופצים.
- ניקוי אירועים: שינויים תכופים בערכי הטופס יפעילו רינדורים מרובים, יש לנקות או למנוע כפילות לפני הצמדת אירועים (למשל `remove` לפני `add`, או `{ once: true }`, או סימון `dataset` למניעת כפילות).

## 相关文档 (תיעוד קשור)

- [משתנים והקשר](/interface-builder/variables)
- [כללי קישוריות](/interface-builder/linkage-rule)
- [תצוגות וחלונות קופצים](/interface-builder/actions/types/view)