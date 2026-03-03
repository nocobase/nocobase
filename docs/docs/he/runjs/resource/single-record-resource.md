:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

Resource המיועד ל**רשומה בודדת**: הנתונים הם אובייקט יחיד, התומך באחזור לפי מפתח ראשי, יצירה/עדכון (save) ומחיקה. הוא מתאים לתרחישים של "רשומה בודדת" כגון פרטי רשומה וטפסים. בניגוד ל-[MultiRecordResource](./multi-record-resource.md), המתודה `getData()` של `SingleRecordResource` מחזירה אובייקט בודד. ניתן לציין את המפתח הראשי באמצעות `setFilterByTk(id)`, והמתודה `save()` תקרא באופן אוטומטי ל-`create` או `update` בהתאם למצב של `isNewRecord`.

**יחסי ירושה**: FlowResource ← APIResource ← BaseRecordResource ← SingleRecordResource.

**דרכי יצירה**: `ctx.makeResource('SingleRecordResource')` או `ctx.initResource('SingleRecordResource')`. יש להשתמש ב-`setResourceName('שם האוסף')` לפני השימוש; בעת ביצוע פעולות לפי מפתח ראשי, יש להשתמש ב-`setFilterByTk(id)`; ב-RunJS, האובייקט `ctx.api` מוזרק על ידי סביבת ההרצה.

---

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **בלוק פרטים** | בלוק פרטים משתמש ב-SingleRecordResource כברירת מחדל לטעינת רשומה בודדת לפי מפתח ראשי. |
| **בלוק טופס** | טפסי יצירה/עריכה משתמשים ב-SingleRecordResource, כאשר `save()` מבחין אוטומטית בין `create` ל-`update`. |
| **פרטים ב-JSBlock** | טעינת משתמש בודד, הזמנה וכו' בתוך JSBlock והצגתם באופן מותאם אישית. |
| **משאבי קשר (Association)** | טעינת רשומות קשורות בודדות בפורמט כגון `users.profile`, הדורשת שימוש ב-`setSourceId(מזהה רשומת אב)`. |

---

## פורמט נתונים

- `getData()` מחזירה **אובייקט רשומה בודד**, התואם לשדה `data` בתגובת ה-API של ממשק ה-get.
- `getMeta()` מחזירה מטא-נתונים (אם קיימים).

---

## שם משאב ומפתח ראשי

| מתודה | הסבר |
|------|------|
| `setResourceName(name)` / `getResourceName()` | שם המשאב, לדוגמה `'users'`, `'users.profile'` (משאב קשר). |
| `setSourceId(id)` / `getSourceId()` | מזהה רשומת האב עבור משאבי קשר (לדוגמה, `users.profile` דורש את המפתח הראשי של רשומת ה-users). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | מזהה מקור נתונים (בשימוש בסביבות עם מספר מקורות נתונים). |
| `setFilterByTk(tk)` / `getFilterByTk()` | המפתח הראשי של הרשומה הנוכחית; לאחר הגדרתו, `isNewRecord` הופך ל-`false`. |

---

## מצב (State)

| מאפיין/מתודה | הסבר |
|----------|------|
| `isNewRecord` | האם המשאב במצב "חדש" (true אם לא הוגדר `filterByTk` או אם הרשומה נוצרה זה עתה). |

---

## פרמטרי בקשה (סינון / שדות)

| מתודה | הסבר |
|------|------|
| `setFilter(filter)` / `getFilter()` | סינון (זמין כאשר המשאב אינו במצב "חדש"). |
| `setFields(fields)` / `getFields()` | השדות המבוקשים בבקשה. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | טעינת קשרים (appends). |

---

## CRUD

| מתודה | הסבר |
|------|------|
| `refresh()` | מבצע בקשת `get` לפי ה-`filterByTk` הנוכחי ומעדכן את `getData()`; לא מבצע בקשה במצב "חדש". |
| `save(data, options?)` | קורא ל-`create` במצב "חדש", אחרת קורא ל-`update`; האופציה `{ refresh: false }` מונעת רענון אוטומטי. |
| `destroy(options?)` | מוחק את הרשומה לפי ה-`filterByTk` הנוכחי ומנקה את הנתונים המקומיים. |
| `runAction(actionName, options)` | קורא לכל פעולת (action) משאב שהיא. |

---

## הגדרות ואירועים

| מתודה | הסבר |
|------|------|
| `setSaveActionOptions(options)` | הגדרות הבקשה עבור פעולת ה-`save`. |
| `on('refresh', fn)` / `on('saved', fn)` | מופעל לאחר סיום הרענון או לאחר השמירה. |

---

## דוגמאות

### אחזור ועדכון בסיסי

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// עדכון
await ctx.resource.save({ name: 'ישראל ישראלי' });
```

### יצירת רשומה חדשה

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'פלוני אלמוני', email: 'ploni@example.com' });
```

### מחיקת רשומה

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// לאחר destroy, המתודה getData() תחזיר null
```

### טעינת קשרים ושדות

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### משאבי קשר (לדוגמה users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // מפתח ראשי של רשומת האב
res.setFilterByTk(profileId);    // ניתן להשמיט את filterByTk אם הפרופיל הוא בקשר של hasOne
await res.refresh();
const profile = res.getData();
```

### שמירה ללא רענון אוטומטי

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// המתודה getData() תשמור על הערך הישן כיוון שלא הופעל רענון לאחר השמירה
```

### האזנה לאירועי refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>משתמש: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('נשמר בהצלחה');
});
await ctx.resource?.refresh?.();
```

---

## הערות

- **חובה להגדיר את setResourceName**: יש לקרוא ל-`setResourceName('שם האוסף')` לפני השימוש, אחרת לא ניתן יהיה לבנות את כתובת ה-URL לבקשה.
- **filterByTk ו-isNewRecord**: אם לא הוגדר `setFilterByTk`, המשתנה `isNewRecord` יהיה `true`, והמתודה `refresh()` לא תבצע בקשה; המתודה `save()` תבצע פעולת `create`.
- **משאבי קשר**: כאשר שם המשאב הוא בפורמט `parent.child` (כגון `users.profile`), יש להגדיר תחילה את `setSourceId(מפתח ראשי של האב)`.
- **getData מחזירה אובייקט**: ה-`data` המוחזר מממשקי API של רשומה בודדת הוא אובייקט רשומה; `getData()` מחזירה אובייקט זה ישירות. לאחר `destroy()`, הערך יהיה `null`.

---

## נושאים קשורים

- [ctx.resource](../context/resource.md) - מופע ה-resource בהקשר הנוכחי
- [ctx.initResource()](../context/init-resource.md) - אתחול וקישור ל-`ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - יצירת מופע resource חדש ללא קישור
- [APIResource](./api-resource.md) - משאב API כללי המבוסס על כתובת URL
- [MultiRecordResource](./multi-record-resource.md) - מיועד לאוספים/רשימות, תומך ב-CRUD ודפדוף (pagination)