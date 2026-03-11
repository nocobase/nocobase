:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/location).
:::

# ctx.location

מידע על מיקום הניתוב הנוכחי, המקביל לאובייקט ה-`location` של React Router. בדרך כלל נעשה בו שימוש בשילוב עם `ctx.router` ו-`ctx.route` כדי לקרוא את הנתיב הנוכחי, מחרוזת השאילתה (query string), ה-hash וה-state המועברים דרך הניתוב.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **JSBlock / JSField** | ביצוע רינדור מותנה או פיצול לוגי על סמך הנתיב הנוכחי, פרמטרי שאילתה או hash. |
| **כללי קישור / זרימת אירועים** | קריאת פרמטרי שאילתה מה-URL לצורך סינון קישורים, או קביעת המקור על סמך `location.state`. |
| **טיפול לאחר ניווט** | קבלת נתונים שהועברו מהדף הקודם דרך `ctx.router.navigate` באמצעות `ctx.location.state` בדף היעד. |

> שים לב: `ctx.location` זמין רק בסביבות RunJS הכוללות הקשר ניתוב (כגון JSBlock בתוך דף, זרימת אירועים וכו'); הוא עשוי להיות ריק (null) בהקשרים של צד-שרת בלבד או בהקשרים ללא ניתוב (כגון תהליך עבודה).

## הגדרת סוג (Type Definition)

```ts
location: Location;
```

`Location` מגיע מ-`react-router-dom`, ותואם לערך המוחזר מ-`useLocation()` של React Router.

## שדות נפוצים

| שדה | סוג | הסבר |
|------|------|------|
| `pathname` | `string` | הנתיב הנוכחי, מתחיל ב-`/` (למשל `/admin/users`). |
| `search` | `string` | מחרוזת השאילתה, מתחילה ב-`?` (למשל `?page=1&status=active`). |
| `hash` | `string` | מקטע ה-hash, מתחיל ב-`#` (למשל `#section-1`). |
| `state` | `any` | נתונים שרירותיים המועברים דרך `ctx.router.navigate(path, { state })`, אינם מופיעים ב-URL. |
| `key` | `string` | מזהה ייחודי עבור מיקום זה; בדף הראשוני הערך הוא `"default"`. |

## הקשר בין ctx.router ל-ctx.urlSearchParams

| שימוש | שימוש מומלץ |
|------|----------|
| **קריאת נתיב, hash, state** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **קריאת פרמטרי שאילתה (כאובייקט)** | `ctx.urlSearchParams`, המספק ישירות את האובייקט המנותח. |
| **ניתוח מחרוזת search** | `new URLSearchParams(ctx.location.search)` או שימוש ישיר ב-`ctx.urlSearchParams`. |

`ctx.urlSearchParams` מנותח מתוך `ctx.location.search`. אם דרושים לך רק פרמטרי השאילתה, השימוש ב-`ctx.urlSearchParams` נוח יותר.

## דוגמאות

### פיצול לוגי על סמך נתיב

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('נמצא כעת בדף ניהול משתמשים');
}
```

### ניתוח פרמטרי שאילתה

```ts
// אפשרות 1: שימוש ב-ctx.urlSearchParams (מומלץ)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// אפשרות 2: שימוש ב-URLSearchParams לניתוח search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### קבלת state שהועבר דרך ניווט בניתוב

```ts
// בעת ניווט מהדף הקודם: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('הגעת מלוח הבקרה (dashboard)');
}
```

### איתור עוגנים (Anchors) באמצעות hash

```ts
const hash = ctx.location.hash; // למשל "#edit"
if (hash === '#edit') {
  // גלילה לאזור העריכה או ביצוע לוגיקה מתאימה
}
```

## נושאים קשורים

- [ctx.router](./router.md): ניווט בניתוב; ניתן לאחזר את ה-`state` מ-`ctx.router.navigate` דרך `ctx.location.state` בדף היעד.
- [ctx.route](./route.md): מידע על התאמת הניתוב הנוכחי (פרמטרים, הגדרות וכו'), משמש לעיתים קרובות בשילוב עם `ctx.location`.