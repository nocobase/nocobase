:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/on).
:::

# ctx.on()

הרשמה לאירועי הקשר (context) ב-RunJS (כגון שינויי ערכי שדות, שינויי מאפיינים, רענון משאבים וכו'). האירועים ממופים לפי סוגם לאירועי DOM מותאמים אישית ב-`ctx.element` או לאפיק האירועים (event bus) הפנימי של `ctx.resource`.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **JSField / JSEditableField** | האזנה לשינויים בערכי שדות ממקורות חיצוניים (טפסים, קישורים וכו') כדי לעדכן את ממשק המשתמש בצורה סינכרונית, להשגת קישור דו-כיווני (two-way binding). |
| **JSBlock / JSItem / JSColumn** | האזנה לאירועים מותאמים אישית במיכל (container) כדי להגיב לשינויי נתונים או מצב. |
| **resource קשור** | האזנה לאירועי מחזור חיים של משאבים (resource) כגון רענון או שמירה כדי לבצע לוגיקה לאחר עדכון הנתונים. |

## הגדרת טיפוסים

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## אירועים נפוצים

| שם האירוע | הסבר | מקור האירוע |
|--------|------|----------|
| `js-field:value-change` | ערך השדה שונה חיצונית (למשל, קישור בטופס, עדכון ערך ברירת מחדל) | CustomEvent ב-`ctx.element`, כאשר `ev.detail` הוא הערך החדש |
| `resource:refresh` | נתוני המשאב רועננו | אפיק האירועים של `ctx.resource` |
| `resource:saved` | שמירת המשאב הושלמה | אפיק האירועים של `ctx.resource` |

> כללי מיפוי אירועים: אירועים עם הקידומת `resource:` עוברים דרך `ctx.resource.on`, בעוד שאחרים עוברים בדרך כלל דרך אירועי DOM ב-`ctx.element` (אם קיים).

## דוגמאות

### קישור דו-כיווני של שדה (React useEffect + ניקוי)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### האזנה ל-DOM מקורי (חלופה כאשר ctx.on אינו זמין)

```ts
// כאשר ctx.on אינו מסופק, ניתן להשתמש ב-ctx.element ישירות
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// בזמן הניקוי: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### עדכון ממשק המשתמש לאחר רענון משאב

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // עדכון הרינדור בהתבסס על הנתונים
});
```

## שילוב עם ctx.off

- מאזינים שנרשמו באמצעות `ctx.on` יש להסיר בזמן המתאים דרך [ctx.off](./off.md) כדי למנוע דליפות זיכרון או הפעלות כפולות.
- ב-React, `ctx.off` נקרא בדרך כלל בתוך פונקציית הניקוי (cleanup) של `useEffect`.
- ייתכן ש-`ctx.off` לא יהיה קיים; מומלץ להשתמש בשרשור אופציונלי (optional chaining): `ctx.off?.('eventName', handler)`.

## נקודות לתשומת לב

1. **ביטול תואם**: לכל `ctx.on(eventName, handler)` צריכה להיות קריאת `ctx.off(eventName, handler)` תואמת, וההפניה (reference) ל-`handler` המועברת חייבת להיות זהה.
2. **מחזור חיים**: הסר מאזינים לפני הסרת הרכיב (unmount) או השמדת ההקשר (context) כדי למנוע דליפות זיכרון.
3. **זמינות אירועים**: סוגי הקשר שונים תומכים באירועים שונים. אנא עיינו בתיעוד הרכיב הספציפי לפרטים.

## תיעוד קשור

- [ctx.off](./off.md) - הסרת מאזיני אירועים
- [ctx.element](./element.md) - מיכל רינדור ואירועי DOM
- [ctx.resource](./resource.md) - מופע משאב ומתודות ה-`on`/`off` שלו
- [ctx.setValue](./set-value.md) - הגדרת ערך שדה (מפעיל את `js-field:value-change`)