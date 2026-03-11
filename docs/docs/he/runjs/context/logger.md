:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/logger).
:::

# ctx.logger

מעטפת לוגים המבוססת על [pino](https://github.com/pinojs/pino), המספקת לוגים במבנה JSON בעלי ביצועים גבוהים. מומלץ להשתמש ב-`ctx.logger` במקום ב-`console` כדי להקל על איסוף וניתוח לוגים.

## תרחישי שימוש

ניתן להשתמש ב-`ctx.logger` בכל תרחישי RunJS לצורך ניפוי שגיאות (debugging), מעקב אחר שגיאות, ניתוח ביצועים וכו'.

## הגדרת סוג (Type Definition)

```ts
logger: pino.Logger;
```

`ctx.logger` הוא מופע של `engine.logger.child({ module: 'flow-engine' })`, כלומר logger בן של pino עם הקשר (context) של `module`.

## רמות לוג (Log Levels)

pino תומך ברמות הבאות (מהגבוהה לנמוכה):

| רמה | מתודה | תיאור |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | שגיאה קריטית, בדרך כלל גורמת לסיום התהליך |
| `error` | `ctx.logger.error()` | שגיאה, מצביעה על כישלון בבקשה או בפעולה |
| `warn` | `ctx.logger.warn()` | אזהרה, מצביעה על סיכונים פוטנציאליים או מצבים חריגים |
| `info` | `ctx.logger.info()` | מידע כללי על זמן ריצה |
| `debug` | `ctx.logger.debug()` | מידע לניפוי שגיאות, משמש במהלך הפיתוח |
| `trace` | `ctx.logger.trace()` | מעקב מפורט, משמש לאבחון מעמיק |

## צורת כתיבה מומלצת

הפורמט המומלץ הוא `level(msg, meta)`: ההודעה תחילה, ולאחריה אובייקט מטא-דאטה אופציונלי.

```ts
ctx.logger.info('טעינת הבלוק הושלמה');
ctx.logger.info('הפעולה הצליחה', { recordId: 456 });
ctx.logger.warn('אזהרת ביצועים', { duration: 5000 });
ctx.logger.error('הפעולה נכשלה', { userId: 123, action: 'create' });
ctx.logger.error('הבקשה נכשלה', { err });
```

pino תומך גם ב-`level(meta, msg)` (אובייקט תחילה) או ב-`level({ msg, ...meta })` (אובייקט יחיד), וניתן להשתמש בהם לפי הצורך.

## דוגמאות

### שימוש בסיסי

```ts
ctx.logger.info('טעינת הבלוק הושלמה');
ctx.logger.warn('הבקשה נכשלה, משתמש בזיכרון מטמון', { err });
ctx.logger.debug('שומר...', { recordId: ctx.record?.id });
```

### יצירת logger בן באמצעות child()

```ts
// יצירת logger בן עם הקשר עבור הלוגיקה הנוכחית
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('מבצע שלב 1');
log.debug('מבצע שלב 2', { step: 2 });
```

### הקשר ל-console

מומלץ להשתמש ב-`ctx.logger` ישירות כדי לקבל לוגים במבנה JSON. אם אתם רגילים להשתמש ב-`console`, המיפויים הם: `console.log` ← `ctx.logger.info`, `console.error` ← `ctx.logger.error`, `console.warn` ← `ctx.logger.warn`.

## פורמט הלוג

pino מוציא JSON מובנה, כאשר כל רשומת לוג מכילה:

- `level`: רמת הלוג (מספרי)
- `time`: חותמת זמן (במילישניות)
- `msg`: הודעת הלוג
- `module`: קבוע כ-`flow-engine`
- שדות מותאמים אישית אחרים (המועברים דרך אובייקטים)

## נקודות לתשומת לב

- הלוגים הם בפורמט JSON מובנה, מה שמקל על איסוף, חיפוש וניתוח שלהם.
- עבור לוגרים בני שנבנו באמצעות `child()`, מומלצת גם כן צורת הכתיבה `level(msg, meta)`.
- סביבות הרצה מסוימות (כגון תהליך עבודה) עשויות להשתמש בשיטות פלט לוג שונות.

## נושאים קשורים

- [pino](https://github.com/pinojs/pino) — ספריית הלוגים שבבסיס המערכת