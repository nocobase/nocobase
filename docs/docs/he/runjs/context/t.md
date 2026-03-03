:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/t).
:::

# ctx.t()

פונקציית קיצור ל-i18n המשמשת ב-RunJS לתרגום טקסט בהתבסס על הגדרות השפה של ההקשר הנוכחי. היא מתאימה לבינאום (internationalization) של טקסטים פנימיים כגון כפתורים, כותרות והודעות.

## מצבי שימוש

ניתן להשתמש ב-`ctx.t()` בכל סביבות ההרצה של RunJS.

## הגדרת טיפוסים (Type Definition)

```ts
t(key: string, options?: Record<string, any>): string
```

## פרמטרים

| פרמטר | טיפוס | הסבר |
|------|------|------|
| `key` | `string` | מפתח תרגום או תבנית עם מצייני מיקום (למשל, `Hello {{name}}`, `{{count}} rows`) |
| `options` | `object` | אופציונלי. משתני אינטרפולציה (למשל, `{ name: 'John', count: 5 }`), או אפשרויות i18n (למשל, `defaultValue`, `ns`) |

## ערך חזרה

- מחזירה את המחרוזת המתורגמת; אם לא קיים תרגום למפתח ולא סופק `defaultValue`, ייתכן שיוחזר המפתח עצמו או המחרוזת לאחר אינטרפולציה.

## מרחב שמות (ns)

**מרחב השמות (namespace) כברירת מחדל עבור סביבת RunJS הוא `runjs`**. כאשר לא מצוין `ns`, הפונקציה `ctx.t(key)` תחפש את המפתח במרחב השמות `runjs`.

```ts
// חיפוש המפתח במרחב השמות 'runjs' כברירת מחדל
ctx.t('Submit'); // שווה ערך ל- ctx.t('Submit', { ns: 'runjs' })

// חיפוש המפתח במרחב שמות ספציפי
ctx.t('Submit', { ns: 'myModule' });

// חיפוש במספר מרחבי שמות לפי הסדר (תחילה ב-'runjs', לאחר מכן ב-'common')
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## דוגמאות

### מפתח פשוט

```ts
ctx.t('Submit');
ctx.t('No data');
```

### עם משתני אינטרפולציה

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### טקסט דינמי (למשל זמן יחסי)

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### ציון מרחב שמות

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## הערות

- **תוסף לוקליזציה**: כדי לתרגם טקסט, יש להפעיל תחילה את תוסף הלוקליזציה. מפתחות תרגום חסרים יחולצו באופן אוטומטי לרשימת ניהול הלוקליזציה לצורך תחזוקה ותרגום מרכזיים.
- תמיכה באינטרפולציה בסגנון i18next: השתמשו ב-`{{variableName}}` במפתח והעבירו את המשתנה המתאים ב-`options` כדי להחליפו.
- השפה נקבעת על פי ההקשר הנוכחי (למשל, `ctx.i18n.language`, הגדרות האזור של המשתמש).

## נושאים קשורים

- [ctx.i18n](./i18n.md): קריאה או החלפת שפות