:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# בלוק JS

## מבוא

בלוק JS הוא "בלוק רינדור מותאם אישית" גמיש במיוחד, המאפשר לכתוב סקריפטים של JavaScript ישירות כדי ליצור ממשקים, לקשור אירועים, לקרוא לממשקי API של נתונים או לשלב ספריות צד שלישי. הוא מתאים לתרחישי ויזואליזציה מותאמים אישית, ניסויים זמניים והרחבות קלות משקל שקשה לכסות באמצעות בלוקים מובנים.

## API של סביבת הריצה (Runtime Context)

סביבת הריצה של בלוק JS כוללת יכולות נפוצות שהוזרקו וניתן להשתמש בהן ישירות:

- `ctx.element`: מיכל ה-DOM של הבלוק (עטוף בצורה בטוחה כ-ElementProxy), תומך ב-`innerHTML`, `querySelector`, `addEventListener` ועוד.
- `ctx.requireAsync(url)`: טוען ספריית AMD/UMD באופן אסינכרוני לפי URL.
- `ctx.importAsync(url)`: מייבא מודול ESM באופן דינמי לפי URL.
- `ctx.openView`: פותח תצוגה מוגדרת (חלון קופץ/מגירה/עמוד).
- `ctx.useResource(...)` + `ctx.resource`: ניגש לנתונים כמשאב.
- `ctx.i18n.t()` / `ctx.t()`: יכולת בינאום מובנית.
- `ctx.onRefReady(ctx.ref, cb)`: מבצע רינדור לאחר שהקונטיינר מוכן, כדי למנוע בעיות תזמון.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: ספריות מובנות כמו React, ReactDOM, Ant Design, אייקוני Ant Design ו-dayjs, המשמשות לרינדור JSX וטיפול בזמן. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` נשמרו לתאימות לאחור.)
- `ctx.render(vnode)`: מרנדר אלמנט React, מחרוזת HTML או צומת DOM למיכל ברירת המחדל `ctx.element`; קריאות מרובות ישתמשו באותו React Root וידרסו את התוכן הקיים של המיכל.

## הוספת בלוק

ניתן להוסיף בלוק JS לעמוד או לחלון קופץ.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## עורך וקטעי קוד (Snippets)

עורך הסקריפטים של בלוק JS תומך בהדגשת תחביר, רמזי שגיאות וקטעי קוד מובנים (Snippets), המאפשרים הוספה מהירה של דוגמאות נפוצות כמו: רינדור גרפים, קישור אירועי כפתורים, טעינת ספריות חיצוניות, רינדור רכיבי React/Vue, צירי זמן, כרטיסי מידע ועוד.

- `Snippets`: פותח את רשימת קטעי הקוד המובנים. ניתן לחפש ולהוסיף קטע נבחר לעורך הקוד במיקום הסמן הנוכחי בלחיצה אחת.
- `Run`: מריץ ישירות את הקוד בעורך הנוכחי ומוציא את יומני הריצה ללוח `Logs` בתחתית. תומך בהצגת `console.log/info/warn/error`, ושגיאות יודגשו וניתן יהיה לאתר אותן לשורה ולעמודה הספציפיות.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

בנוסף, ניתן לזמן ישירות את עובד ה-AI "מהנדס Frontend · Nathan" מהפינה הימנית העליונה של העורך. Nathan יכול לסייע בכתיבה או שינוי סקריפטים בהתבסס על ההקשר הנוכחי. לאחר מכן, ניתן ללחוץ על "Apply to editor" ולהריץ את הקוד כדי לראות את התוצאה. לפרטים נוספים, ראו:

- [עובד AI · Nathan: מהנדס Frontend](/ai-employees/built-in/ai-coding)

## סביבת ריצה ואבטחה

- **מיכל (Container)**: המערכת מספקת מיכל DOM מאובטח `ctx.element` (ElementProxy) עבור הסקריפט, המשפיע רק על הבלוק הנוכחי ואינו מפריע לאזורים אחרים בעמוד.
- **ארגז חול (Sandbox)**: הסקריפט רץ בסביבה מבוקרת. `window`/`document`/`navigator` משתמשים באובייקטי פרוקסי מאובטחים, המאפשרים שימוש בממשקי API נפוצים תוך הגבלת התנהגויות מסוכנות.
- **רינדור מחדש (Re-rendering)**: הבלוק מבצע רינדור מחדש אוטומטית כאשר הוא מוסתר ולאחר מכן מוצג שוב (כדי למנוע ביצוע חוזר של סקריפט ההרכבה הראשוני).

## שימושים נפוצים (דוגמאות מקוצרות)

### 1) רינדור React (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('נלחץ!'))}>
      {ctx.t('לחץ')}
    </Button>
  </div>
);
```

### 2) תבנית בקשת API

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('הבקשה הסתיימה'));
console.log(ctx.t('נתוני תגובה:'), resp?.data);
```

### 3) טעינת ECharts ורינדור

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) פתיחת תצוגה (מגירה)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('מגירה לדוגמה'), size: 'large' });
```

### 5) קריאת משאב ורינדור JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## הערות

- מומלץ להשתמש ב-CDNs אמינים לטעינת ספריות חיצוניות.
- **עצות לשימוש בסלקטורים**: תעדיפו להשתמש בסלקטורי `class` או תכונה `[name=...]`. הימנעו משימוש ב-`id` קבועים כדי למנוע התנגשויות עקב `id` כפולים כאשר ישנם מספר בלוקים או חלונות קופצים.
- **ניקוי אירועים**: מכיוון שהבלוק עשוי לבצע רינדור מחדש מספר פעמים, יש לנקות או לבטל כפילויות של מאזיני אירועים לפני הקישור כדי למנוע הפעלות חוזרות. ניתן להשתמש בגישת "הסר ואז הוסף", במאזין חד-פעמי, או להוסיף דגל למניעת כפילויות.

## מסמכים קשורים

- [משתנים והקשר](/interface-builder/variables)
- [כללי קישוריות](/interface-builder/linkage-rule)
- [תצוגות וחלונות קופצים](/interface-builder/actions/types/view)