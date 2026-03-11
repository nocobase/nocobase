:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

משאב (Resource) המיועד לאוספי נתונים (Collections): הבקשות מחזירות מערך ותומכות בעימוד (Pagination), סינון, מיון ופעולות CRUD. הוא מתאים לתרחישים של "רשומות מרובות" כגון טבלאות ורשימות. בניגוד ל-[APIResource](./api-resource.md), ה-MultiRecordResource מגדיר את שם המשאב באמצעות `setResourceName()`, בונה באופן אוטומטי כתובות URL כגון `users:list` ו-`users:create`, וכולל יכולות מובנות לעימוד, סינון ובחירת שורות.

**ירושה**: FlowResource ← APIResource ← BaseRecordResource ← MultiRecordResource.

**אופן היצירה**: `ctx.makeResource('MultiRecordResource')` או `ctx.initResource('MultiRecordResource')`. לפני השימוש, יש לקרוא ל-`setResourceName('collectionName')` (למשל, `'users'`); ב-RunJS, ה-`ctx.api` מוזרק על ידי סביבת ההרצה.

---

## תרחישי שימוש

| תרחיש | תיאור |
|------|------|
| **בלוקי טבלה** | בלוקים של טבלה ורשימה משתמשים ב-MultiRecordResource כברירת מחדל, ותומכים בעימוד, סינון ומיון. |
| **רשימות JSBlock** | טעינת נתונים מאוספים כמו משתמשים או הזמנות בתוך JSBlock וביצוע רינדור מותאם אישית. |
| **פעולות בכמות גדולה** | שימוש ב-`getSelectedRows()` לקבלת השורות הנבחרות וב-`destroySelectedRows()` למחיקה המונית. |
| **משאבי קשר (Association)** | טעינת אוספים קשורים בפורמטים כמו `users.tags`, הדורשת שימוש ב-`setSourceId(parentRecordId)`. |

---

## פורמט הנתונים

- `getData()` מחזיר **מערך של רשומות**, שהוא שדה ה-`data` מתוך תגובת ה-API של הרשימה.
- `getMeta()` מחזיר מטא-נתונים של עימוד ומידע נוסף: `page`, `pageSize`, `count`, `totalPage` וכו'.

---

## שם משאב ומקור נתונים

| מתודה | תיאור |
|------|------|
| `setResourceName(name)` / `getResourceName()` | שם המשאב, למשל `'users'`, `'users.tags'` (משאב קשר). |
| `setSourceId(id)` / `getSourceId()` | מזהה רשומת האב עבור משאבי קשר (למשל, עבור `users.tags`, יש להעביר את המפתח הראשי של המשתמש). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | מזהה מקור הנתונים (בשימוש בתרחישים של ריבוי מקורות נתונים). |

---

## פרמטרים של בקשה (סינון / שדות / מיון)

| מתודה | תיאור |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | סינון לפי מפתח ראשי (עבור `get` של רשומה בודדת וכו'). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | תנאי סינון, תמיכה באופרטורים כמו `$eq`, `$ne`, `$in` וכו'. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | קבוצות סינון (לשילוב של מספר תנאים). |
| `setFields(fields)` / `getFields()` | השדות המבוקשים (רשימה לבנה). |
| `setSort(sort)` / `getSort()` | מיון, למשל `['-createdAt']` לסדר יורד לפי זמן יצירה. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | טעינת קשרים (למשל, `['user', 'tags']`). |

---

## עימוד (Pagination)

| מתודה | תיאור |
|------|------|
| `setPage(page)` / `getPage()` | העמוד הנוכחי (מתחיל מ-1). |
| `setPageSize(size)` / `getPageSize()` | מספר פריטים לעמוד, ברירת המחדל היא 20. |
| `getTotalPage()` | מספר העמודים הכולל. |
| `getCount()` | מספר הרשומות הכולל (מתוך ה-meta של השרת). |
| `next()` / `previous()` / `goto(page)` | מעבר עמוד והפעלת `refresh`. |

---

## שורות נבחרות (תרחישי טבלה)

| מתודה | תיאור |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | נתוני השורות שנבחרו כעת, משמש למחיקה המונית ופעולות אחרות. |

---

## פעולות CRUD ורשימה

| מתודה | תיאור |
|------|------|
| `refresh()` | מבצע בקשה לרשימה עם הפרמטרים הנוכחיים, מעדכן את `getData()` ואת ה-meta של העימוד, ומפעיל את האירוע `'refresh'`. |
| `get(filterByTk)` | מבקש רשומה בודדת ומחזיר אותה (לא כותב ל-`getData`). |
| `create(data, options?)` | יוצר רשומה. האופציה `{ refresh: false }` מונעת רענון אוטומטי. מפעיל את האירוע `'saved'`. |
| `update(filterByTk, data, options?)` | מעדכן רשומה לפי המפתח הראשי שלה. |
| `destroy(target)` | מוחק רשומות; `target` יכול להיות מפתח ראשי, אובייקט שורה, או מערך של מפתחות ראשיים/אובייקטי שורה (מחיקה המונית). |
| `destroySelectedRows()` | מוחק את השורות שנבחרו כעת (זורק שגיאה אם לא נבחרו שורות). |
| `setItem(index, item)` | מחליף שורת נתונים ספציפית באופן מקומי (לא מבצע בקשה לשרת). |
| `runAction(actionName, options)` | קורא לכל פעולת משאב (action) שהיא (למשל, פעולות מותאמות אישית). |

---

## הגדרות ואירועים

| מתודה | תיאור |
|------|------|
| `setRefreshAction(name)` | הפעולה הנקראת בזמן רענון, ברירת המחדל היא `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | הגדרות בקשה עבור יצירה/עדכון. |
| `on('refresh', fn)` / `on('saved', fn)` | מופעל לאחר סיום הרענון או לאחר שמירה. |

---

## דוגמאות

### רשימה בסיסית

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### סינון ומיון

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### טעינת קשרים (Association Loading)

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### יצירה ועימוד

```js
await ctx.resource.create({ name: 'John Doe', email: 'john.doe@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### מחיקה המונית של שורות נבחרות

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('אנא בחר נתונים תחילה');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('נמחק בהצלחה'));
```

### האזנה לאירוע refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### משאב קשר (טבלת משנה)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## הערות חשובות

- **חובה להגדיר setResourceName**: יש לקרוא ל-`setResourceName('collectionName')` לפני השימוש, אחרת לא ניתן יהיה לבנות את כתובת ה-URL לבקשה.
- **משאבי קשר**: כאשר שם המשאב הוא בפורמט `parent.child` (למשל, `users.tags`), יש לקרוא ל-`setSourceId(parentPrimaryKey)` תחילה.
- **מניעת כפילויות ברענון (Debouncing)**: קריאות מרובות ל-`refresh()` בתוך אותה לולאת אירועים (event loop) יבצעו רק את האחרונה שבהן כדי למנוע בקשות מיותרות.
- **getData מחזיר מערך**: ה-`data` המוחזר על ידי ה-API של הרשימה הוא מערך של רשומות, ו-`getData()` מחזיר מערך זה ישירות.

---

## נושאים קשורים

- [ctx.resource](../context/resource.md) - מופע המשאב בהקשר הנוכחי
- [ctx.initResource()](../context/init-resource.md) - אתחול וקישור ל-ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - יצירת מופע משאב חדש ללא קישור
- [APIResource](./api-resource.md) - משאב API כללי לפי כתובת URL
- [SingleRecordResource](./single-record-resource.md) - מיועד לרשומה בודדת