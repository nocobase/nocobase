:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/message).
:::

# ctx.message

ה-API הגלובלי של Ant Design להודעות (message), המשמש להצגת התראות קלות וזמניות במרכז החלק העליון של הדף. ההודעות נסגרות אוטומטית לאחר זמן מסוים או ניתנות לסגירה ידנית על ידי המשתמש.

## תרחישי שימוש

| תרחיש | תיאור |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | משוב על פעולות, הודעות אימות (validation), הצלחת העתקה והתראות קלות אחרות |
| **Form Operations / תהליך עבודה (Workflow)** | משוב על הצלחת שליחה, כשל בשמירה, אי-עמידה בתנאי אימות וכו' |
| **Action Events (JSAction)** | משוב מיידי על לחיצות, סיום פעולות אצווה (batch) וכו' |

## הגדרת טיפוסים (Type Definition)

```ts
message: MessageInstance;
```

`MessageInstance` הוא ממשק ה-message של Ant Design, המספק את המתודות הבאות.

## מתודות נפוצות

| מתודה | תיאור |
|------|------|
| `success(content, duration?)` | הצגת הודעת הצלחה |
| `error(content, duration?)` | הצגת הודעת שגיאה |
| `warning(content, duration?)` | הצגת הודעת אזהרה |
| `info(content, duration?)` | הצגת הודעת מידע |
| `loading(content, duration?)` | הצגת הודעת טעינה (יש לסגור ידנית) |
| `open(config)` | פתיחת הודעה באמצעות הגדרות מותאמות אישית |
| `destroy()` | סגירת כל ההודעות המוצגות כעת |

**פרמטרים:**

- `content` (`string` \| `ConfigOptions`): תוכן ההודעה או אובייקט הגדרות
- `duration` (`number`, אופציונלי): השהיית סגירה אוטומטית (בשניות), ברירת המחדל היא 3 שניות; הגדרה ל-0 תבטל את הסגירה האוטומטית

**ConfigOptions** (כאשר `content` הוא אובייקט):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // תוכן ההודעה
  duration?: number;        // השהיית סגירה אוטומטית (שניות)
  onClose?: () => void;    // פונקציית callback בעת הסגירה
  icon?: React.ReactNode;  // אייקון מותאם אישית
}
```

## דוגמאות

### שימוש בסיסי

```ts
ctx.message.success('הפעולה הצליחה');
ctx.message.error('הפעולה נכשלה');
ctx.message.warning('אנא בחר נתונים תחילה');
ctx.message.info('מעבד...');
```

### בינאום בשילוב עם ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### טעינה (loading) וסגירה ידנית

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// ביצוע פעולה אסינכרונית
await saveData();
hide();  // סגירה ידנית של הודעת הטעינה
ctx.message.success(ctx.t('Saved'));
```

### הגדרות מותאמות אישית באמצעות open

```ts
ctx.message.open({
  type: 'success',
  content: 'הודעת הצלחה מותאמת אישית',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### סגירת כל ההודעות

```ts
ctx.message.destroy();
```

## ההבדל בין ctx.message ל-ctx.notification

| תכונה | ctx.message | ctx.notification |
|------|--------------|------------------|
| **מיקום** | מרכז החלק העליון של הדף | פינה ימנית עליונה |
| **ייעוד** | התראה קלה וזמנית, נעלמת אוטומטית | פאנל התראות, יכול לכלול כותרת ותיאור, מתאים לתצוגה ממושכת יותר |
| **תרחישים נפוצים** | משוב על פעולות, הודעות אימות, הצלחת העתקה | התראות על סיום משימות, הודעות מערכת, תוכן ארוך הדורש את תשומת לב המשתמש |

## נושאים קשורים

- [ctx.notification](./notification.md) - התראות בפינה הימנית העליונה, מתאים לזמני תצוגה ארוכים יותר
- [ctx.modal](./modal.md) - חלון מודאלי לאישור, אינטראקציה חוסמת (blocking)
- [ctx.t()](./t.md) - בינאום, משמש לעיתים קרובות בשילוב עם message