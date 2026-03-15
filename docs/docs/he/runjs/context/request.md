:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/request).
:::

# ctx.request()

ביצוע בקשת HTTP עם אימות בתוך RunJS. הבקשה נושאת באופן אוטומטי את ה-`baseURL`, ה-`Token`, ה-`locale`, ה-`role` וכו' של האפליקציה הנוכחית, ופועלת לפי לוגיקת יירוט הבקשות וטיפול בשגיאות של האפליקציה.

## תרחישי שימוש

רלוונטי לכל תרחיש ב-RunJS שבו יש צורך לבצע בקשת HTTP מרוחקת, כגון JSBlock, JSField, JSItem, JSColumn, תהליך עבודה (Workflow), קישוריות (Linkage), JSAction וכו'.

## הגדרת טיפוסים

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` מרחיב את ה-`AxiosRequestConfig` של Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // האם לדלג על התראות שגיאה גלובליות כאשר הבקשה נכשלת
  skipAuth?: boolean;                                 // האם לדלג על הפניה לאימות (למשל, לא להפנות לדף התחברות בשגיאת 401)
};
```

## פרמטרים נפוצים

| פרמטר | טיפוס | הסבר |
|------|------|------|
| `url` | string | URL של הבקשה. תומך בסגנון משאבים (למשל `users:list`, `posts:create`), או URL מלא |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | מתודת HTTP, ברירת המחדל היא `'get'` |
| `params` | object | פרמטרי שאילתה (Query parameters), עוברים סריאליזציה ל-URL |
| `data` | any | גוף הבקשה (Request body), משמש עבור post/put/patch |
| `headers` | object | כותרות (headers) מותאמות אישית לבקשה |
| `skipNotify` | boolean \| (error) => boolean | אם true או אם הפונקציה מחזירה true, לא יופיעו התראות שגיאה גלובליות במקרה של כישלון |
| `skipAuth` | boolean | אם true, שגיאות 401 וכדומה לא יפעילו הפניה לאימות (כמו הפניה לדף ההתחברות) |

## URL בסגנון משאבים (Resource Style)

API המשאבים של NocoBase תומך בפורמט מקוצר של `resource:action`:

| פורמט | הסבר | דוגמה |
|------|------|------|
| `collection:action` | CRUD של אוסף בודד | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | משאבים קשורים (דורש העברת המפתח הראשי דרך `resourceOf` או ה-URL) | `posts.comments:list` |

נתיבים יחסיים ישורשרו ל-`baseURL` של האפליקציה (בדרך כלל `/api`); בקשות חוצות-מקורות (cross-origin) חייבות להשתמש ב-URL מלא, והשירות המיועד חייב להיות מוגדר עם CORS.

## מבנה התגובה

הערך המוחזר הוא אובייקט תגובה של Axios. שדות נפוצים כוללים:

- `response.data`: גוף התגובה
- ממשקי רשימה (List interfaces) מחזירים בדרך כלל `data.data` (מערך של רשומות) + `data.meta` (דפדוף וכו')
- ממשקי רשומה בודדת/יצירה/עדכון מחזירים בדרך כלל את הרשומה ב-`data.data`

## דוגמאות

### שאילתת רשימה

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // מידע על דפדוף ונתונים נוספים
```

### שליחת נתונים

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'ישראל ישראלי', email: 'israel@example.com' },
});

const newRecord = res?.data?.data;
```

### עם סינון ומיון

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### דילוג על התראת שגיאה

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // לא להקפיץ הודעה גלובלית במקרה של כישלון
});

// או להחליט האם לדלג על סמך סוג השגיאה
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### בקשת חוצת-מקורות (Cross-Origin Request)

כאשר משתמשים ב-URL מלא כדי לבצע בקשה לדומיינים אחרים, שירות היעד חייב להיות מוגדר עם CORS כדי לאפשר את המקור (origin) של האפליקציה הנוכחית. אם ממשק היעד דורש Token משלו, ניתן להעביר אותו דרך ה-headers:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <target_service_token>',
  },
});
```

### הצגה באמצעות ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('רשימת משתמשים') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## הערות

- **טיפול בשגיאות**: כישלון בבקשה יזרוק חריגה (exception), והתראת שגיאה גלובלית תופיע כברירת מחדל. השתמשו ב-`skipNotify: true` כדי לתפוס ולטפל בשגיאה בעצמכם.
- **אימות**: בקשות לאותו מקור (Same-origin) ישאו באופן אוטומטי את ה-Token, ה-locale וה-role של המשתמש הנוכחי; בקשות חוצות-מקורות דורשות שהיעד יתמוך ב-CORS והעברת ה-token ב-headers לפי הצורך.
- **הרשאות משאבים**: הבקשות כפופות למגבלות ACL ויכולות לגשת רק למשאבים שלמשתמש הנוכחי יש הרשאה עבורם.

## נושאים קשורים

- [ctx.message](./message.md) - הצגת הודעות קלות לאחר סיום הבקשה
- [ctx.notification](./notification.md) - הצגת התראות לאחר סיום הבקשה
- [ctx.render](./render.md) - רינדור תוצאות הבקשה לממשק
- [ctx.makeResource](./make-resource.md) - בניית אובייקט משאב לטעינת נתונים משורשרת (חלופה ל-`ctx.request`)