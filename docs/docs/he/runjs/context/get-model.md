:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/get-model).
:::

# ctx.getModel()

מאחזר מופע של מודל (כגון `BlockModel`, `PageModel`, `ActionModel` וכו') מתוך המנוע הנוכחי או מחסנית התצוגות (view stack) על בסיס ה-`uid` של המודל. פונקציה זו משמשת ב-RunJS לגישה למודלים אחרים בין בלוקים, דפים או חלונות קופצים (popups).

אם דרוש לכם רק המודל או הבלוק שבו נמצא הקשר הביצוע (execution context) הנוכחי, העדיפו להשתמש ב-`ctx.model` או ב-`ctx.blockModel` במקום ב-`ctx.getModel`.

## תרחישי שימוש

| תרחיש | תיאור |
|------|------|
| **JSBlock / JSAction** | קבלת מודלים של בלוקים אחרים על בסיס `uid` ידוע כדי לקרוא או לכתוב ב-`resource`, `form`, `setProps` וכו'. |
| **RunJS בחלונות קופצים** | כאשר יש צורך לגשת למודל בדף שפתח את החלון הקופץ, העבירו `searchInPreviousEngines: true`. |
| **פעולות מותאמות אישית** | איתור טפסים או תתי-מודלים בפאנל ההגדרות לפי `uid` לאורך מחסניות תצוגה כדי לקרוא את התצורה או המצב שלהם. |

## הגדרת טיפוסים (Type Definition)

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## פרמטרים

| פרמטר | סוג | תיאור |
|------|------|------|
| `uid` | `string` | המזהה הייחודי של מופע המודל המיועד, כפי שהוגדר בעת התצורה או היצירה (למשל `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | אופציונלי, ברירת מחדל `false`. כאשר הערך הוא `true`, החיפוש מתבצע מהמנוע הנוכחי ומעלה עד לשורש ב"מחסנית התצוגות", מה שמאפשר גישה למודלים במנועים ברמה גבוהה יותר (למשל, הדף שפתח חלון קופץ). |

## ערך חזרה

- מחזיר את המופע המתאים של תת-מחלקה של `FlowModel` (כגון `BlockModel`, `FormBlockModel`, `ActionModel`) אם נמצא.
- מחזיר `undefined` אם לא נמצא.

## טווח חיפוש

- **ברירת מחדל (`searchInPreviousEngines: false`)**: חיפוש בתוך ה**מנוע הנוכחי** בלבד לפי `uid`. בחלונות קופצים או בתצוגות רב-שכבתיות, לכל תצוגה יש מנוע עצמאי; כברירת מחדל, החיפוש מתבצע רק בתוך התצוגה הנוכחית.
- **`searchInPreviousEngines: true`**: חיפוש כלפי מעלה לאורך שרשרת ה-`previousEngine` החל מהמנוע הנוכחי, והחזרת ההתאמה הראשונה. שימושי לגישה למודל בדף שפתח את החלון הקופץ הנוכחי.

## דוגמאות

### קבלת בלוק אחר ורענונו

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### גישה למודל בדף מתוך חלון קופץ

```ts
// גישה לבלוק בדף שפתח את החלון הקופץ הנוכחי
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### קריאה/כתיבה בין מודלים והפעלת רינדור מחדש (rerender)

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### בדיקת בטיחות

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('מודל היעד אינו קיים');
  return;
}
```

## נושאים קשורים

- [ctx.model](./model.md): המודל שבו נמצא הקשר הביצוע הנוכחי.
- [ctx.blockModel](./block-model.md): מודל הבלוק האב שבו נמצא ה-JS הנוכחי; בדרך כלל נגיש ללא צורך ב-`getModel`.