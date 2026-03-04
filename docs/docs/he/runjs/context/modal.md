:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/modal).
:::

# ctx.modal

API מקוצר המבוסס על Ant Design Modal, המשמש לפתיחה יזומה של תיבות מודאליות (הודעות מידע, חלונות אישור וכו') בתוך RunJS. הוא מיושם על ידי `ctx.viewer` / מערכת התצוגה.

## מקרי בוחן

| תרחיש | תיאור |
|------|------|
| **JSBlock / JSField** | הצגת תוצאות פעולה, הודעות שגיאה או אישור משני לאחר אינטראקציה של המשתמש. |
| **תהליך עבודה / אירועי פעולה** | חלון אישור קופץ לפני שליחה; סיום שלבים עוקבים באמצעות `ctx.exit()` אם המשתמש מבטל. |
| **כללי קישור** | הצגת הודעות למשתמש כאשר האימות נכשל. |

> **שימו לב:** `ctx.modal` זמין בסביבות RunJS הכוללות הקשר תצוגה (כגון JSBlocks בתוך דף, תהליכי עבודה וכו'); ייתכן שהוא לא יהיה קיים בצד השרת או בהקשרים ללא ממשק משתמש (UI). מומלץ להשתמש ב-optional chaining (`ctx.modal?.confirm?.()`) בעת הקריאה לו.

## הגדרת טיפוסים (Type Definition)

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // מחזיר true אם המשתמש לוחץ על אישור, false אם הוא מבטל
};
```

`ModalConfig` תואם להגדרות של המתודות הסטטיות של Ant Design `Modal`.

## מתודות נפוצות

| מתודה | ערך חזרה | תיאור |
|------|--------|------|
| `info(config)` | `Promise<void>` | מודאל הודעת מידע |
| `success(config)` | `Promise<void>` | מודאל הודעת הצלחה |
| `error(config)` | `Promise<void>` | מודאל הודעת שגיאה |
| `warning(config)` | `Promise<void>` | מודאל הודעת אזהרה |
| `confirm(config)` | `Promise<boolean>` | מודאל אישור; מחזיר `true` אם המשתמש לוחץ על אישור, ו-`false` אם הוא מבטל |

## פרמטרי תצורה

בהתאם ל-Ant Design `Modal`, השדות הנפוצים כוללים:

| פרמטר | טיפוס | תיאור |
|------|------|------|
| `title` | `ReactNode` | כותרת |
| `content` | `ReactNode` | תוכן |
| `okText` | `string` | טקסט כפתור אישור |
| `cancelText` | `string` | טקסט כפתור ביטול (עבור `confirm` בלבד) |
| `onOk` | `() => void \| Promise<void>` | מבוצע בעת לחיצה על אישור |
| `onCancel` | `() => void` | מבוצע בעת לחיצה על ביטול |

## הקשר בין ctx.message ל-ctx.openView

| שימוש | שימוש מומלץ |
|------|----------|
| **הודעה זמנית קלה** | `ctx.message`, נעלמת אוטומטית |
| **מודאל מידע/הצלחה/שגיאה/אזהרה** | `ctx.modal.info` / `success` / `error` / `warning` |
| **אישור משני (דורש בחירת משתמש)** | `ctx.modal.confirm`, בשימוש עם `ctx.exit()` לשליטה בזרימה |
| **אינטראקציות מורכבות כמו טפסים או רשימות** | `ctx.openView` לפתיחת תצוגה מותאמת אישית (דף/מגירה/מודאל) |

## דוגמאות

### מודאל מידע פשוט

```ts
ctx.modal.info({
  title: 'הודעה',
  content: 'הפעולה הושלמה',
});
```

### מודאל אישור ושליטה בזרימה

```ts
const confirmed = await ctx.modal.confirm({
  title: 'אישור מחיקה',
  content: 'האם אתה בטוח שברצונך למחוק רשומה זו?',
  okText: 'אישור',
  cancelText: 'ביטול',
});
if (!confirmed) {
  ctx.exit();  // סיום שלבים עוקבים אם המשתמש מבטל
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### מודאל אישור עם onOk

```ts
await ctx.modal.confirm({
  title: 'אישור שליחה',
  content: 'לא ניתן יהיה לשנות את הנתונים לאחר השליחה. האם להמשיך?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### הודעת שגיאה

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'הצלחה', content: 'הפעולה הושלמה בהצלחה' });
} catch (e) {
  ctx.modal.error({ title: 'שגיאה', content: e.message });
}
```

## נושאים קשורים

- [ctx.message](./message.md): הודעה זמנית קלה, נעלמת אוטומטית
- [ctx.exit()](./exit.md): משמש בדרך כלל כ-`if (!confirmed) ctx.exit()` כדי לסיים את הזרימה כאשר משתמש מבטל אישור
- [ctx.openView()](./open-view.md): פותח תצוגה מותאמת אישית, מתאים לאינטראקציות מורכבות