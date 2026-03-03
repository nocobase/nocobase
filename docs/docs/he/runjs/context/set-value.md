:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/set-value).
:::

# ctx.setValue()

מגדיר את הערך של השדה הנוכחי בתרחישי שדות ניתנים לעריכה כגון JSField ו-JSItem. בשילוב עם `ctx.getValue()`, הוא מאפשר קישור דו-כיווני (two-way binding) עם הטופס.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **JSField** | כתיבת ערכים שנבחרו על ידי המשתמש או חושבו לתוך שדות מותאמים אישית ניתנים לעריכה. |
| **JSItem** | עדכון ערך התא הנוכחי בפריטים ניתנים לעריכה של טבלאות/תתי-טבלאות. |
| **JSColumn** | עדכון ערך השדה של השורה המתאימה בהתבסס על לוגיקה במהלך רינדור עמודת טבלה. |

> **הערה**: `ctx.setValue(v)` זמין רק בהקשרי RunJS עם קישור לטופס. הוא אינו זמין בתרחישים ללא קישור לשדה, כגון תהליכי עבודה (Workflow), כללי קישור (linkage rules) או JSBlock. מומלץ להשתמש ב-optional chaining לפני השימוש: `ctx.setValue?.(value)`.

## הגדרת טיפוסים (Type Definition)

```ts
setValue<T = any>(value: T): void;
```

- **פרמטרים**: `value` הוא ערך השדה שייכתב. הסוג נקבע על ידי סוג פריט הטופס של השדה.

## התנהגות

- `ctx.setValue(v)` מעדכן את ערך השדה הנוכחי ב-Ant Design Form ומפעיל לוגיקת קישור ואימות (validation) רלוונטית של הטופס.
- אם הטופס טרם סיים להתרנדר או שהשדה אינו רשום, הקריאה עשויה שלא להשפיע. מומלץ להשתמש ב-`ctx.getValue()` כדי לאשר את תוצאת הכתיבה.

## דוגמאות

### קישור דו-כיווני עם getValue

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### הגדרת ערכי ברירת מחדל על סמך תנאים

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### כתיבה חזרה לשדה הנוכחי בעת קישור לשדות אחרים

```ts
// עדכון סנכרוני של השדה הנוכחי כאשר שדה אחר משתנה
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Custom', value: 'custom' });
}
```

## הערות

- בשדות שאינם ניתנים לעריכה (למשל, JSField במצב קריאה בלבד, JSBlock), `ctx.setValue` עשוי להיות `undefined`. מומלץ להשתמש ב-`ctx.setValue?.(value)` כדי למנוע שגיאות.
- בעת הגדרת ערכים לשדות קשר (M2O, O2M וכו'), יש להעביר מבנה התואם לסוג השדה (למשל, `{ id, [titleField]: label }`), בהתאם להגדרות השדה הספציפיות.

## נושאים קשורים

- [ctx.getValue()](./get-value.md) - קבלת ערך השדה הנוכחי, משמש עם setValue לקישור דו-כיווני.
- [ctx.form](./form.md) - מופע של Ant Design Form, משמש לקריאה או כתיבה של שדות אחרים.
- `js-field:value-change` - אירוע קונטיינר המופעל כאשר ערך חיצוני משתנה, משמש לעדכון התצוגה.