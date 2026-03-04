:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/jsx).
:::

# JSX

RunJS תומך בתחביר JSX, המאפשר לכתוב קוד בדומה לרכיבי React. ה-JSX מקומפל באופן אוטומטי לפני הביצוע.

## הערות קומפילציה

- משתמש ב-[sucrase](https://github.com/alangpierce/sucrase) כדי להמיר JSX.
- JSX מקומפל ל-`ctx.libs.React.createElement` ול-`ctx.libs.React.Fragment`.
- **אין צורך לייבא (import) את React**: ניתן לכתוב JSX ישירות; הוא ישתמש אוטומטית ב-`ctx.libs.React` לאחר הקומפילציה.
- בעת טעינת React חיצוני באמצעות `ctx.importAsync('react@x.x.x')`, ה-JSX יעבור להשתמש במתודה `createElement` של אותו מופע ספציפי.

## שימוש ב-React וברכיבים מובנים

RunJS כולל את React וספריות UI נפוצות מובנות. ניתן לגשת אליהן ישירות דרך `ctx.libs` ללא צורך ב-`import`:

- **ctx.libs.React** — ליבת React
- **ctx.libs.ReactDOM** — ReactDOM (ניתן לשימוש עם `createRoot` במידת הצורך)
- **ctx.libs.antd** — רכיבי Ant Design
- **ctx.libs.antdIcons** — סמלי Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>לחץ כאן</Button>);
```

בעת כתיבת JSX ישירות, אין צורך לבצע Destructuring ל-React. יש צורך ב-Destructuring מתוך `ctx.libs` רק בעת שימוש ב-**Hooks** (כגון `useState`, `useEffect`) או ב-**Fragment** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**הערה**: לא ניתן לערבב בין React המובנה לבין React חיצוני המיובא באמצעות `ctx.importAsync()`. אם משתמשים בספריית UI חיצונית, יש לייבא גם את React מאותו מקור חיצוני.

## שימוש ב-React וברכיבים חיצוניים

בעת טעינת גרסה ספציפית של React וספריות UI באמצעות `ctx.importAsync()`, ה-JSX ישתמש במופע ה-React הזה:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>לחץ כאן</Button>);
```

אם antd תלוי ב-react/react-dom, ניתן לציין את אותה הגרסה דרך `deps` כדי למנוע מופעים מרובים:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**הערה**: בעת שימוש ב-React חיצוני, יש לייבא גם ספריות UI כמו antd באמצעות `ctx.importAsync()`. אין לערבב אותן עם `ctx.libs.antd`.

## נקודות מפתח בתחביר JSX

- **רכיבים ופרופס (props)**: `<Button type="primary">טקסט</Button>`
- **Fragment**: `<>...</>` או `<React.Fragment>...</React.Fragment>` (דורש ביצוע Destructuring ל-`const { React } = ctx.libs` בעת השימוש ב-Fragment).
- **ביטויים**: השתמשו ב-`{expression}` בתוך JSX כדי להזין משתנים או פעולות, כגון `{ctx.user.name}` או `{count + 1}`. אין להשתמש בתחביר תבנית של `{{ }}`.
- **רינדור מותנה**: `{flag && <span>תוכן</span>}` או `{flag ? <A /> : <B />}`.
- **רינדור רשימות**: השתמשו ב-`array.map()` כדי להחזיר רשימת אלמנטים, וודאו שלכל אלמנט יש `key` יציב.

```tsx
const { React } = ctx.libs;
const items = ['a', 'b', 'c'];

ctx.render(
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```