:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/resource/api-resource).
:::

# APIResource

**משאב API כללי** המבוסס על URL לביצוע בקשות, מתאים לכל ממשק HTTP. הוא יורש ממחלקת הבסיס `FlowResource` ומרחיב אותה עם הגדרות בקשה ומתודת `refresh()`. בניגוד ל-[MultiRecordResource](./multi-record-resource.md) ו-[SingleRecordResource](./single-record-resource.md), ה-`APIResource` אינו תלוי בשם משאב; הוא מבצע בקשות ישירות לפי URL, מה שהופך אותו למתאים לממשקים מותאמים אישית, ממשקי API של צד שלישי ותרחישים דומים.

**אופן היצירה**: `ctx.makeResource('APIResource')` או `ctx.initResource('APIResource')`. יש להשתמש ב-`setURL()` לפני השימוש; בהקשר של RunJS, ה-`ctx.api` (APIClient) מוזרק אוטומטית, כך שאין פורך להגדיר ידנית את `setAPIClient`.

---

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **ממשק מותאם אישית** | קריאה לממשקי API של משאבים לא סטנדרטיים (למשל, `/api/custom/stats`, `/api/reports/summary`) |
| **API של צד שלישי** | ביצוע בקשות לשירותים חיצוניים באמצעות URL מלא (דורש תמיכה ב-CORS מהיעד) |
| **שאילתה חד-פעמית** | שליפת נתונים זמנית לשימוש מיידי, ללא צורך בקישור ל-`ctx.resource` |
| **בחירה בין APIResource ל-ctx.request** | השתמשו ב-`APIResource` כאשר יש צורך בנתונים ריאקטיביים, אירועים או ניהול מצבי שגיאה; השתמשו ב-`ctx.request()` עבור בקשות חד-פעמיות פשוטות |

---

## יכולות מחלקת הבסיס (FlowResource)

כל ה-Resources כוללים:

| מתודה | הסבר |
|------|------|
| `getData()` | קבלת הנתונים הנוכחיים |
| `setData(value)` | הגדרת נתונים (מקומי בלבד) |
| `hasData()` | האם קיימים נתונים |
| `getMeta(key?)` / `setMeta(meta)` | קריאה/כתיבה של מטא-נתונים |
| `getError()` / `setError(err)` / `clearError()` | ניהול מצב שגיאה |
| `on(event, callback)` / `once` / `off` / `emit` | רישום והפעלת אירועים |

---

## הגדרות בקשה

| מתודה | הסבר |
|------|------|
| `setAPIClient(api)` | הגדרת מופע APIClient (בדרך כלל מוזרק אוטומטית ב-RunJS) |
| `getURL()` / `setURL(url)` | URL של הבקשה |
| `loading` | קריאה/כתיבה של מצב טעינה (get/set) |
| `clearRequestParameters()` | ניקוי פרמטרי הבקשה |
| `setRequestParameters(params)` | מיזוג והגדרת פרמטרי בקשה |
| `setRequestMethod(method)` | הגדרת מתודת הבקשה (למשל `'get'`, `'post'`, ברירת המחדל היא `'get'`) |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | כותרות בקשה (Headers) |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | הוספה, מחיקה או שאילתה של פרמטר בודד |
| `setRequestBody(data)` | גוף הבקשה (בשימוש ב-POST/PUT/PATCH) |
| `setRequestOptions(key, value)` / `getRequestOptions()` | אפשרויות בקשה כלליות |

---

## פורמט URL

- **סגנון משאב (Resource Style)**: תמיכה בקיצורי דרך של משאבי NocoBase, כגון `users:list` או `posts:get`, אשר ישורשרו ל-`baseURL`.
- **נתיב יחסי**: למשל `/api/custom/endpoint`, משורשר ל-`baseURL` של האפליקציה.
- **URL מלא**: שימוש בכתובת מלאה עבור בקשות חוצות-מקורות (cross-origin); על היעד להיות מוגדר עם CORS.

---

## שליפת נתונים

| מתודה | הסבר |
|------|------|
| `refresh()` | מבצע בקשה בהתבסס על ה-URL, המתודה, הפרמטרים, הכותרות והנתונים הנוכחיים. כותב את ה-`data` מהתגובה לתוך `setData(data)` ומפעיל את האירוע `'refresh'`. במקרה של כישלון, מגדיר `setError(err)` וזורק `ResourceError`, ללא הפעלת אירוע `refresh`. דורש הגדרה מראש של `api` ו-URL. |

---

## דוגמאות

### בקשת GET בסיסית

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL בסגנון משאב

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### בקשת POST (עם גוף בקשה)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'בדיקה', type: 'report' });
await res.refresh();
const result = res.getData();
```

### האזנה לאירוע refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>סטטיסטיקה: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### טיפול בשגיאות

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'הבקשה נכשלה');
}
```

### כותרות בקשה (Headers) מותאמות אישית

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## הערות

- **תלות ב-ctx.api**: ב-RunJS, ה-`ctx.api` מוזרק על ידי הסביבה; בדרך כלל אין צורך ב-`setAPIClient` ידני. אם נעשה שימוש בתרחיש ללא הקשר (context), יש להגדיר אותו באופן עצמאי.
- **Refresh משמעו בקשה**: המתודה `refresh()` מבצעת בקשה לפי ההגדרות הנוכחיות; יש להגדיר את המתודה, הפרמטרים, הנתונים וכו' לפני הקריאה לה.
- **שגיאות אינן מעדכנות נתונים**: במקרה של כישלון, `getData()` שומר על ערכו הקודם; ניתן לקבל מידע על השגיאה דרך `getError()`.
- **בהשוואה ל-ctx.request**: השתמשו ב-`ctx.request()` עבור בקשות חד-פעמיות פשוטות; השתמשו ב-`APIResource` כאשר נדרשים נתונים ריאקטיביים, אירועים וניהול מצבי שגיאה.

---

## נושאים קשורים

- [ctx.resource](../context/resource.md) - מופע המשאב בהקשר הנוכחי
- [ctx.initResource()](../context/init-resource.md) - אתחול וקישור ל-`ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - יצירת מופע משאב חדש ללא קישור
- [ctx.request()](../context/request.md) - בקשת HTTP כללית, מתאימה לקריאות חד-פעמיות פשוטות
- [MultiRecordResource](./multi-record-resource.md) - מיועד לאוספים/רשימות, תומך ב-CRUD ודפדוף
- [SingleRecordResource](./single-record-resource.md) - מיועד לרשומה בודדת