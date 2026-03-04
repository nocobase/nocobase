:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/route).
:::

# ctx.route

מידע על התאמת הניתוב הנוכחי, המקביל למושג ה-`route` ב-React Router. הוא משמש לקבלת הגדרות הניתוב התואמות, פרמטרים ועוד. בדרך כלל נעשה בו שימוש בשילוב עם `ctx.router` ו-`ctx.location`.

## מקרי בוחן

| תרחיש | הסבר |
|------|------|
| **JSBlock / JSField** | ביצוע רינדור מותנה או הצגת מזהה הדף הנוכחי בהתבסס על `route.pathname` או `route.params`. |
| **כללי קישור / תהליך עבודה** | קריאת פרמטרי ניתוב (למשל `params.name`) עבור פיצול לוגי או העברתם לרכיבי בן. |
| **ניווט תצוגה** | השוואה פנימית של `ctx.route.pathname` עם נתיב יעד כדי לקבוע אם להפעיל את `ctx.router.navigate`. |

> **הערה:** `ctx.route` זמין רק בסביבות RunJS הכוללות הקשר ניתוב (כגון JSBlocks בתוך דף, דפי תהליך עבודה וכו'); הוא עשוי להיות ריק (null) בהקשרים של צד-שרת טהור או ללא ניתוב (כגון תהליכי עבודה ברקע).

## הגדרת טיפוסים (Type Definition)

```ts
type RouteOptions = {
  name?: string;   // מזהה ניתוב ייחודי
  path?: string;   // תבנית ניתוב (למשל /admin/:name)
  params?: Record<string, any>;  // פרמטרי ניתוב (למשל { name: 'users' })
  pathname?: string;  // הנתיב המלא של הניתוב הנוכחי (למשל /admin/users)
};
```

## שדות נפוצים

| שדה | טיפוס | הסבר |
|------|------|------|
| `pathname` | `string` | הנתיב המלא של הניתוב הנוכחי, תואם ל-`ctx.location.pathname` |
| `params` | `Record<string, any>` | פרמטרים דינמיים שחולצו מתבנית הניתוב, כגון `{ name: 'users' }` |
| `path` | `string` | תבנית הניתוב, כגון `/admin/:name` |
| `name` | `string` | מזהה ניתוב ייחודי, משמש לעיתים קרובות בתרחישים של ריבוי טאבים או ריבוי תצוגות |

## היחס בין ctx.router ל-ctx.location

| שימוש | שימוש מומלץ |
|------|----------|
| **קריאת הנתיב הנוכחי** | `ctx.route.pathname` או `ctx.location.pathname`; שניהם עקביים בזמן ההתאמה |
| **קריאת פרמטרי ניתוב** | `ctx.route.params`, למשל `params.name` המייצג את ה-UID של הדף הנוכחי |
| **ניווט (Navigation)** | `ctx.router.navigate(path)` |
| **קריאת פרמטרי שאילתה, state** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` מתמקד ב"הגדרות הניתוב שהותאמו", בעוד ש-`ctx.location` מתמקד ב"מיקום ה-URL הנוכחי". יחד, הם מספקים תיאור מלא של מצב הניתוב הנוכחי.

## דוגמאות

### קריאת pathname

```ts
// הצגת הנתיב הנוכחי
ctx.message.info('הדף הנוכחי: ' + ctx.route.pathname);
```

### פיצול לוגי בהתבסס על params

```ts
// params.name הוא בדרך כלל ה-UID של הדף הנוכחי (למשל מזהה דף תהליך עבודה)
if (ctx.route.params?.name === 'users') {
  // ביצוע לוגיקה ספציפית בדף ניהול משתמשים
}
```

### הצגה בדף תהליך עבודה (Flow)

```tsx
<div>
  <h1>הדף הנוכחי - {ctx.route.pathname}</h1>
  <p>מזהה ניתוב: {ctx.route.params?.name}</p>
</div>
```

## נושאים קשורים

- [ctx.router](./router.md): ניווט בניתוב. כאשר `ctx.router.navigate()` משנה את הנתיב, `ctx.route` יתעדכן בהתאם.
- [ctx.location](./location.md): מיקום ה-URL הנוכחי (pathname, search, hash, state), משמש בשילוב עם `ctx.route`.