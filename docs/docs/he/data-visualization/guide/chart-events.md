:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# אירועי אינטראקציה מותאמים אישית

כתבו קוד JS בעורך האירועים ורשמו אינטראקציות באמצעות מופע ECharts בשם `chart` כדי לאפשר פעולות משולבות. לדוגמה, ניווט לדף חדש או פתיחת חלון קופץ לניתוח מעמיק.

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## רישום וביטול רישום אירועים
- רישום: `chart.on(eventName, handler)`
- ביטול רישום: `chart.off(eventName, handler)` או `chart.off(eventName)` כדי לנקות אירועים בעלי אותו שם.

**שימו לב:**
מטעמי בטיחות, מומלץ בחום לבטל את רישום האירוע לפני רישומו מחדש!

## מבנה הנתונים של הפרמטרים (params) בפונקציית ה-handler

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

שדות נפוצים כוללים את `params.data` ו-`params.name`.

## דוגמה: לחיצה להדגשת בחירה
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // הדגשת נקודת הנתונים הנוכחית
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // הסרת הדגשה מאחרים
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## דוגמה: לחיצה לניווט לדף אחר
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // אפשרות 1: ניווט פנימי בתוך היישום, ללא רענון מלא של הדף, לחוויה טובה יותר (מומלץ). נדרש רק נתיב יחסי.
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // אפשרות 2: ניווט לדף חיצוני, נדרש קישור מלא.
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // אפשרות 3: פתיחת דף חיצוני בלשונית חדשה, נדרש קישור מלא.
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## דוגמה: לחיצה לפתיחת חלון קופץ עם פרטים (ניתוח מעמיק)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // רישום משתני הקשר (context variables) לשימוש בחלון הקופץ החדש.
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

בחלון הקופץ החדש שנפתח, השתמשו במשתני הקשר של התרשים באמצעות `ctx.view.inputArgs.XXX`.

## תצוגה מקדימה ושמירה
- לחצו על "תצוגה מקדימה" (Preview) כדי לטעון ולהריץ את קוד האירוע.
- לחצו על "שמור" (Save) כדי לשמור את הגדרות האירוע הנוכחיות.
- לחצו על "ביטול" (Cancel) כדי לחזור למצב השמור האחרון.

**המלצות:**
- השתמשו תמיד ב-`chart.off('event')` לפני הקישור (binding) כדי למנוע הרצות כפולות או גידול בשימוש בזיכרון.
- השתמשו בפעולות קלות משקל (לדוגמה, `dispatchAction`, `setOption`) בתוך פונקציות ה-handler של האירועים כדי למנוע חסימת תהליך הרינדור.
- ודאו מול אפשרויות התרשים ושאילתות הנתונים שהשדות המטופלים באירוע תואמים לנתונים הנוכחיים.