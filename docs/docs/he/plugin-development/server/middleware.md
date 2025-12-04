:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# תווכה (Middleware)

התווכה (Middleware) בשרת NocoBase היא למעשה **תווכה של Koa**. באפשרותכם לתפעל את אובייקט ה-`ctx` כדי לטפל בבקשות ובתגובות, בדיוק כמו ב-Koa. אך מכיוון ש-NocoBase צריכה לנהל לוגיקה בשכבות עסקיות שונות, אם כל התווכות ימוקמו יחד, יהיה קשה מאוד לתחזק ולנהל אותן.

לשם כך, NocoBase מחלקת את התווכה ל**ארבע רמות**:

1.  **תווכה ברמת מקור נתונים**: `app.dataSourceManager.use()`  
    פועלת רק על בקשות עבור **מקור נתונים ספציפי**, ומשמשת בדרך כלל ללוגיקה של חיבורי מסד נתונים, אימות שדות או טיפול בטרנזקציות עבור אותו מקור נתונים.

2.  **תווכה ברמת משאב**: `app.resourceManager.use()`  
    חלה רק על משאבים מוגדרים (Resource), ומתאימה לטיפול בלוגיקה ברמת משאב, כגון הרשאות נתונים, עיצוב ועוד.

3.  **תווכה ברמת הרשאות**: `app.acl.use()`  
    מבוצעת לפני בדיקות הרשאות, ומשמשת לאימות הרשאות משתמש או תפקידים.

4.  **תווכה ברמת יישום**: `app.use()`  
    מבוצעת עבור כל בקשה, ומתאימה לרישום יומן (logging), טיפול כללי בשגיאות, עיבוד תגובות ועוד.

## רישום תווכה

תווכה נרשמת בדרך כלל במתודת ה-`load` של ה**תוסף**, לדוגמה:

```ts
export class MyPlugin extends Plugin {
  load() {
    // תווכה ברמת יישום
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // תווכה ברמת מקור נתונים
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // תווכה ברמת הרשאות
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // תווכה ברמת משאב
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### סדר ביצוע

סדר ביצוע התווכה הוא כדלקמן:

1.  ראשית, מבוצעת תווכת ההרשאות שנוספה באמצעות `acl.use()`.
2.  לאחר מכן, מבוצעת תווכת המשאבים שנוספה באמצעות `resourceManager.use()`.
3.  לאחר מכן, מבוצעת תווכת מקור הנתונים שנוספה באמצעות `dataSourceManager.use()`.
4.  ולבסוף, מבוצעת תווכת היישום שנוספה באמצעות `app.use()`.

## מנגנון הוספה באמצעות before / after / tag

כדי לשלוט בצורה גמישה יותר בסדר התווכה, NocoBase מספקת את הפרמטרים `before`, `after` ו-`tag`:

-   **tag**: מסמן את התווכה בתווית (tag) לשימוש על ידי תווכות עוקבות.
-   **before**: מוסיף את התווכה לפני התווכה עם התווית שצוינה.
-   **after**: מוסיף את התווכה אחרי התווכה עם התווית שצוינה.

דוגמה:

```ts
// תווכה רגילה
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 ימוקם לפני m1
app.use(m4, { before: 'restApi' });

// m5 יוחדר בין m2 ל-m3
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

אם לא צוין מיקום, סדר הביצוע ברירת המחדל עבור תווכות חדשות הוא:  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  

:::

## דוגמה למודל הבצל

סדר ביצוע התווכה עוקב אחר **מודל הבצל** של Koa, כלומר, התווכות נכנסות למחסנית התווכה ראשונות ויוצאות אחרונות.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourceManager.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

דוגמאות לפלט עבור ממשקים שונים:

-   **בקשה רגילה**: `/api/hello`  
    פלט: `[1,2]` (משאב לא מוגדר, לא מבוצעות תווכות `resourceManager` ו-`acl`)  

-   **בקשת משאב**: `/api/test:list`  
    פלט: `[5,3,7,1,2,8,4,6]`  
    התווכה מבוצעת לפי סדר השכבות ומודל הבצל.

## סיכום

-   תווכת NocoBase היא הרחבה של תווכת Koa.
-   ארבע רמות: יישום -> מקור נתונים -> משאב -> הרשאות.
-   ניתן להשתמש ב-`before` / `after` / `tag` כדי לשלוט באופן גמיש בסדר הביצוע.
-   עוקבת אחר מודל הבצל של Koa, מה שמבטיח שהתווכה ניתנת להרכבה וקינון.
-   תווכה ברמת מקור נתונים פועלת רק על בקשות של מקור נתונים ספציפי, ותווכה ברמת משאב פועלת רק על בקשות של משאבים מוגדרים.