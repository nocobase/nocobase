:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/render).
:::

# ctx.render()

מרנדר אלמנטי React, מחרוזות HTML או צמתי DOM לתוך מיכל (container) מוגדר. אם לא צוין `container`, ברירת המחדל היא רינדור לתוך `ctx.element`, תוך ירושה אוטומטית של הקשר האפליקציה (context), כגון ConfigProvider וערכות נושא (themes).

## תרחישי שימוש

| תרחיש | תיאור |
|------|------|
| **JSBlock** | רינדור תוכן מותאם אישית לבלוקים (תרשימים, רשימות, כרטיסים וכו') |
| **JSField / JSItem / JSColumn** | רינדור תצוגה מותאמת אישית עבור שדות ניתנים לעריכה או עמודות בטבלה |
| **בלוק פרטים** | התאמה אישית של פורמט התצוגה של שדות בדפי פרטים |

> הערה: `ctx.render()` דורש מיכל רינדור. אם לא מועבר `container` ו-`ctx.element` אינו קיים (למשל, בתרחישי לוגיקה טהורה ללא ממשק משתמש), תיזרק שגיאה.

## הגדרת טיפוסים (Type Definition)

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| פרמטר | טיפוס | תיאור |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | התוכן לרינדור |
| `container` | `Element` \| `DocumentFragment` (אופציונלי) | מיכל היעד לרינדור, ברירת המחדל היא `ctx.element` |

**ערך חזרה**:

- בעת רינדור **אלמנט React**: מחזיר `ReactDOMClient.Root`, מה שמאפשר קריאה עתידית ל-`root.render()` לצורך עדכונים.
- בעת רינדור **מחרוזת HTML** או **צומת DOM**: מחזיר `null`.

## הסבר על טיפוסי vnode

| טיפוס | התנהגות |
|------|------|
| `React.ReactElement` (JSX) | מרונדר באמצעות `createRoot` של React, מספק יכולות React מלאות ויורש אוטומטית את הקשר האפליקציה. |
| `string` | מגדיר את ה-`innerHTML` של המיכל לאחר ניקוי (sanitization) באמצעות DOMPurify; כל שורש React קיים יוסר (unmount) תחילה. |
| `Node` (Element, Text וכו') | מתווסף באמצעות `appendChild` לאחר ריקון המיכל; כל שורש React קיים יוסר תחילה. |
| `DocumentFragment` | מוסיף צמתי בנים של הפרגמנט למיכל; כל שורש React קיים יוסר תחילה. |

## דוגמאות

### רינדור אלמנטי React (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('כותרת')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('נלחץ'))}>
      {ctx.t('כפתור')}
    </Button>
  </Card>
);
```

### רינדור מחרוזות HTML

```ts
ctx.render('<h1>Hello World</h1>');

// שילוב עם ctx.t עבור לוקליזציה
ctx.render('<div style="padding:16px">' + ctx.t('תוכן') + '</div>');

// רינדור מותנה
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### רינדור צמתי DOM

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// רינדור מיכל ריק תחילה, ואז העברתו לספריה חיצונית (כגון ECharts) לאתחול
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### הגדרת מיכל מותאם אישית

```ts
// רינדור לאלמנט DOM ספציפי
const customEl = document.getElementById('my-container');
ctx.render(<div>תוכן</div>, customEl);
```

### קריאות מרובות יחליפו את התוכן

```ts
// הקריאה השנייה תחליף את התוכן הקיים במיכל
ctx.render(<div>פעם ראשונה</div>);
ctx.render(<div>פעם שנייה</div>);  // יוצג רק "פעם שנייה"
```

## נקודות לתשומת לב

- **קריאות מרובות יחליפו את התוכן**: כל קריאה ל-`ctx.render()` מחליפה את התוכן הקיים במיכל במקום להוסיף עליו.
- **בטיחות מחרוזות HTML**: מחרוזות HTML המועברות עוברות ניקוי באמצעות DOMPurify כדי להפחית סיכוני XSS, אך עדיין מומלץ להימנע משרשור קלט משתמש שאינו מהימן.
- **אין לשנות את ctx.element ישירות**: השימוש ב-`ctx.element.innerHTML` הופסק (deprecated); יש להשתמש ב-`ctx.render()` באופן עקבי במקום זאת.
- **העברת מיכל כשאין ברירת מחדל**: בתרחישים שבהם `ctx.element` הוא `undefined` (למשל, בתוך מודולים שנטענו באמצעות `ctx.importAsync`), יש לספק `container` באופן מפורש.

## נושאים קשורים

- [ctx.element](./element.md) - מיכל הרינדור כברירת מחדל, משמש כאשר לא מועבר מיכל ל-`ctx.render()`.
- [ctx.libs](./libs.md) - ספריות מובנות כמו React ו-Ant Design, המשמשות לרינדור JSX.
- [ctx.importAsync()](./import-async.md) - משמש בשילוב עם `ctx.render()` לאחר טעינת ספריות React/רכיבים חיצוניות לפי דרישה.