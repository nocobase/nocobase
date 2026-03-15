:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/notification).
:::

# ctx.notification

ה-API הגלובלי להודעות (Notification), המבוסס על Ant Design Notification, משמש להצגת פאנלי הודעות ב**פינה הימנית העליונה** של הדף. בהשוואה ל-`ctx.message`, הודעות אלו יכולות לכלול כותרת ותיאור, מה שהופך אותן למתאימות לתוכן שצריך להופיע לזמן ממושך יותר או דורש את תשומת לב המשתמש.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **JSBlock / אירועי פעולה** | הודעות על סיום משימה, תוצאות פעולה קבוצתית, סיום ייצוא וכו'. |
| **תהליך עבודה (FlowEngine)** | התראות ברמת המערכת לאחר סיום תהליכים אסינכרוניים. |
| **תוכן הדורש תצוגה ממושכת** | הודעות מלאות הכוללות כותרת, תיאור וכפתורי פעולה. |

## הגדרת סוג (Type Definition)

```ts
notification: NotificationInstance;
```

`NotificationInstance` הוא ממשק ה-notification של Ant Design, המספק את המתודות הבאות.

## מתודות נפוצות

| מתודה | הסבר |
|------|------|
| `open(config)` | פותח הודעה עם הגדרות מותאמות אישית |
| `success(config)` | מציג הודעה מסוג הצלחה (success) |
| `info(config)` | מציג הודעה מסוג מידע (info) |
| `warning(config)` | מציג הודעה מסוג אזהרה (warning) |
| `error(config)` | מציג הודעה מסוג שגיאה (error) |
| `destroy(key?)` | סוגר את ההודעה עם המפתח (key) שצוין; אם לא צוין מפתח, סוגר את כל ההודעות |

**פרמטרי הגדרה** (תואמים ל-[Ant Design notification](https://ant.design/components/notification)):

| פרמטר | סוג | הסבר |
|------|------|------|
| `message` | `ReactNode` | כותרת ההודעה |
| `description` | `ReactNode` | תיאור ההודעה |
| `duration` | `number` | השהיית סגירה אוטומטית (בשניות). ברירת המחדל היא 4.5 שניות; הגדרה ל-0 תבטל את הסגירה האוטומטית |
| `key` | `string` | מזהה ייחודי להודעה, משמש עבור `destroy(key)` לסגירת הודעה ספציפית |
| `onClose` | `() => void` | פונקציית Callback המופעלת בעת סגירת ההודעה |
| `placement` | `string` | מיקום: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## דוגמאות

### שימוש בסיסי

```ts
ctx.notification.open({
  message: 'הפעולה הצליחה',
  description: 'הנתונים נשמרו בשרת בהצלחה.',
});
```

### קריאה מהירה לפי סוג

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### משך זמן ומפתח מותאמים אישית

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // לא נסגר אוטומטית
});

// סגירה ידנית לאחר סיום המשימה
ctx.notification.destroy('task-123');
```

### סגירת כל ההודעות

```ts
ctx.notification.destroy();
```

## ההבדל בין ctx.notification ל-ctx.message

| מאפיין | ctx.message | ctx.notification |
|------|--------------|------------------|
| **מיקום** | מרכז החלק העליון של הדף | פינה ימנית עליונה (ניתן להגדרה) |
| **מבנה** | שורת טקסט בודדת וקלה | כולל כותרת + תיאור |
| **מטרה** | משוב זמני, נעלם אוטומטית | הודעה מלאה, יכולה להישאר לאורך זמן |
| **תרחישים נפוצים** | הצלחת פעולה, שגיאת אימות, העתקה הצליחה | סיום משימה, הודעות מערכת, תוכן ארוך הדורש תשומת לב |

## נושאים קשורים

- [ctx.message](./message.md) - הודעה קצרה בחלק העליון, מתאימה למשוב מהיר
- [ctx.modal](./modal.md) - חלון אישור (Modal), אינטראקציה חוסמת
- [ctx.t()](./t.md) - בינאום (i18n), משמש לעיתים קרובות בשילוב עם הודעות