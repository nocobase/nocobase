:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/off).
:::

# ctx.off()

מסיר מאזיני אירועים (event listeners) שנרשמו באמצעות `ctx.on(eventName, handler)`. לעיתים קרובות נעשה בו שימוש בשילוב עם [ctx.on](./on.md) כדי לבטל את הרישום (unsubscribe) בזמן המתאים, ובכך למנוע דליפות זיכרון או הפעלות כפולות.

## תרחישי שימוש

| תרחיש | תיאור |
|------|------|
| **ניקוי (Cleanup) ב-React useEffect** | נקרא בתוך פונקציית ה-cleanup של `useEffect` כדי להסיר מאזינים כאשר הרכיב (component) מוסר (unmount). |
| **JSField / JSEditableField** | ביטול הרישום ל-`js-field:value-change` במהלך קישור נתונים דו-כיווני (two-way data binding) עבור שדות. |
| **קשור למשאבים (resource)** | ביטול רישום למאזינים כמו `refresh` או `saved` שנרשמו באמצעות `ctx.resource.on`. |

## הגדרת סוג (Type Definition)

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## דוגמאות

### שימוש משולב ב-React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### ביטול רישום מאירועי משאב (resource)

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// בזמן המתאים
ctx.resource?.off('refresh', handler);
```

## הערות

1. **התאמת הפניה (reference) ל-handler**: ה-`handler` המועבר ל-`ctx.off` חייב להיות אותה הפניה (reference) בדיוק ששימשה ב-`ctx.on`; אחרת, לא ניתן יהיה להסירו כראוי.
2. **ניקוי בזמן**: יש לקרוא ל-`ctx.off` לפני הסרת הרכיב או השמדת ההקשר (context) כדי למנוע דליפות זיכרון.

## מסמכים קשורים

- [ctx.on](./on.md) - הרשמה לאירועים
- [ctx.resource](./resource.md) - מופע משאב (resource) ומתודות ה-`on`/`off` שלו