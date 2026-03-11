:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/render).
:::

# רינדור בתוך המכולה (Container)

השתמשו ב-`ctx.render()` כדי לרנדר תוכן לתוך המכולה הנוכחית (`ctx.element`). הפונקציה תומכת בשלוש הצורות הבאות:

## `ctx.render()`

### רינדור JSX

```jsx
ctx.render(<button>Button</button>);
```

### רינדור צומתי DOM (DOM Nodes)

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### רינדור מחרוזות HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## הסבר על JSX

RunJS יכול לרנדר JSX ישירות. ניתן להשתמש בספריות ה-React/רכיבים המובנות, או לטעון תלויות חיצוניות לפי הצורך.

### שימוש ב-React ובספריות רכיבים מובנות

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### שימוש ב-React ובספריות רכיבים חיצוניות

טעינת גרסאות ספציפיות לפי דרישה באמצעות `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

מתאים למצבים הדורשים גרסאות ספציפיות או רכיבי צד שלישי.

## ctx.element

שימוש לא מומלץ (מיושן):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

הדרך המומלצת:

```js
ctx.render(<h1>Hello World</h1>);
```