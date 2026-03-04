:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` הוא מרחב השמות (namespace) המאוחד עבור ספריות מובנות ב-RunJS, המכיל ספריות נפוצות כגון React, Ant Design, dayjs ו-lodash. **אין צורך ב-`import` או בטעינה אסינכרונית**; ניתן להשתמש בהן ישירות דרך `ctx.libs.xxx`.

## תרחישי שימוש

| תרחיש | תיאור |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | שימוש ב-React + Ant Design לרינדור ממשק משתמש (UI), ב-dayjs לטיפול בתאריכים וב-lodash לעיבוד נתונים. |
| **נוסחה / חישוב** | שימוש ב-formula או math עבור נוסחאות דמויות Excel ופעולות של ביטויים מתמטיים. |
| **תהליך עבודה / כללי קישור (Linkage Rules)** | קריאה לספריות עזר כמו lodash, dayjs ו-formula בתרחישי לוגיקה טהורה. |

## סקירת ספריות מובנות

| מאפיין | תיאור | תיעוד |
|------|------|------|
| `ctx.libs.React` | ליבת React, משמשת עבור JSX ו-Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | API של ReactDOM לצד לקוח (כולל `createRoot`), משמש עם React לרינדור | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | ספריית הרכיבים Ant Design (Button, Card, Table, Form, Input, Modal וכו') | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | ספריית האייקונים של Ant Design (למשל PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | ספריית עזר לתאריכים וזמנים | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | ספריית עזר (get, set, debounce וכו') | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | ספריית פונקציות ונוסחאות דמויות Excel (SUM, AVERAGE, IF וכו') | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | ספריית ביטויים מתמטיים וחישובים | [Math.js](https://mathjs.org/docs/) |

## כינויים (Aliases) ברמה העליונה

לצורך תאימות עם קוד ישן, חלק מהספריות חשופות גם ברמה העליונה: `ctx.React`, `ctx.ReactDOM`, `ctx.antd` ו-`ctx.dayjs`. **מומלץ להשתמש באופן עקבי ב-`ctx.libs.xxx`** לצורך תחזוקה קלה יותר וחיפוש בתיעוד.

## טעינה מושהית (Lazy Loading)

הספריות `lodash`, `formula` ו-`math` משתמשות ב-**טעינה מושהית**: ייבוא דינמי מופעל רק כאשר ניגשים ל-`ctx.libs.lodash` בפעם הראשונה, ולאחר מכן נעשה שימוש חוזר במטמון (cache). `React`, `antd`, `dayjs` ו-`antdIcons` מוגדרים מראש על ידי ההקשר וזמינים לשימוש מיידי.

## דוגמאות

### רינדור עם React ו-Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="כותרת">
    <Button type="primary">לחץ כאן</Button>
  </Card>
);
```

### שימוש ב-Hooks

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### שימוש באייקונים

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>משתמש</Button>);
```

### עיבוד תאריכים עם dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### פונקציות עזר עם lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### חישובי נוסחאות

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### ביטויים מתמטיים עם math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## נקודות לתשומת לב

- **ערבוב עם ctx.importAsync**: אם נטען React חיצוני דרך `ctx.importAsync('react@19')`, ה-JSX ישתמש במופע (instance) הזה. במקרה כזה, **אין** לערבב אותו עם `ctx.libs.antd`. יש לטעון את Ant Design כך שיתאים לגרסת ה-React הזו (למשל, `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **מופעי React מרובים**: אם מופיעה השגיאה "Invalid hook call" או שה-hook dispatcher הוא null, זה נגרם בדרך כלל ממופעי React מרובים. לפני קריאה ל-`ctx.libs.React` או שימוש ב-Hooks, בצעו תחילה `await ctx.importAsync('react@version')` כדי להבטיח שנעשה שימוש באותו מופע React המשותף לדף.

## נושאים קשורים

- [ctx.importAsync()](./import-async.md) - טעינת מודולי ESM חיצוניים לפי דרישה (למשל, גרסאות ספציפיות של React, Vue)
- [ctx.render()](./render.md) - רינדור תוכן לתוך קונטיינר