:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/index).
:::

# סקירת RunJS

RunJS היא סביבת הרצת ה-JavaScript המשמשת ב-NocoBase עבור תרחישים כגון **בלוקי JS**, **שדות JS** ו-**פעולות JS**. הקוד רץ בתוך ארגז חול (sandbox) מוגבל, המאפשר גישה בטוחה ל-`ctx` (Context API) וכולל את היכולות הבאות:

- `await` ברמה העליונה (Top-level `await`)
- ייבוא מודולים חיצוניים
- רינדור בתוך מכולות (containers)
- משתנים גלובליים

## `await` ברמה העליונה (Top-level await)

RunJS תומך ב-`await` ברמה העליונה, מה שמבטל את הצורך בעטיפת הקוד בתוך IIFE.

**לא מומלץ**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**מומלץ**

```js
async function test() {}
await test();
```

## ייבוא מודולים חיצוניים

- השתמשו ב-`ctx.importAsync()` עבור מודולי ESM (מומלץ)
- השתמשו ב-`ctx.requireAsync()` עבור מודולי UMD/AMD

## רינדור בתוך מכולות (containers)

השתמשו ב-`ctx.render()` כדי לרנדר תוכן לתוך המכולה הנוכחית (`ctx.element`). הפונקציה תומכת בשלושת הפורמטים הבאים:

### רינדור JSX

```jsx
ctx.render(<button>Button</button>);
```

### רינדור צמתי DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### רינדור מחרוזות HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## משתנים גלובליים

- `window`
- `document`
- `navigator`
- `ctx`