:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/view).
:::

# ctx.view

בקר התצוגה הפעיל כרגע (דיאלוג, מגירה, חלונית קופצת, אזור מוטמע וכו'), המשמש לגישה למידע ופעולות ברמת התצוגה. מסופק על ידי `FlowViewContext`, וזמין רק בתוך תוכן תצוגה שנפתח באמצעות `ctx.viewer` או `ctx.openView`.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **תוכן דיאלוג/מגירה** | שימוש ב-`ctx.view.close()` בתוך ה-`content` כדי לסגור את התצוגה הנוכחית, או שימוש ב-`Header` ו-`Footer` לרינדור כותרות עליונות ותחתונות. |
| **לאחר שליחת טופס** | קריאה ל-`ctx.view.close(result)` לאחר שליחה מוצלחת כדי לסגור את התצוגה ולהחזיר את התוצאה. |
| **JSBlock / פעולה (Action)** | קביעת סוג התצוגה הנוכחי באמצעות `ctx.view.type`, או קריאת פרמטרי פתיחה מתוך `ctx.view.inputArgs`. |
| **בחירת קשרים, טבלאות משנה** | קריאת `collectionName`, `filterByTk`, `parentId` וכו', מתוך `inputArgs` לצורך טעינת נתונים. |

> שימו לב: `ctx.view` זמין רק בסביבות RunJS עם הקשר תצוגה (למשל, בתוך ה-`content` של `ctx.viewer.dialog()`, בטפסי דיאלוג, או בתוך בוררי קשרים). בדפים רגילים או בהקשר של Backend, הערך הוא `undefined`. מומלץ להשתמש ב-optional chaining (`ctx.view?.close?.()`).

## הגדרת טיפוס (Type Definition)

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // זמין בתצוגות תצורת תהליך עבודה
};
```

## מאפיינים ומתודות נפוצים

| מאפיין/מתודה | טיפוס | הסבר |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | סוג התצוגה הנוכחית |
| `inputArgs` | `Record<string, any>` | פרמטרים שהועברו בעת פתיחת התצוגה (ראו להלן) |
| `Header` | `React.FC \| null` | רכיב כותרת עליונה, משמש לרינדור כותרות ואזורי פעולה |
| `Footer` | `React.FC \| null` | רכיב כותרת תחתונה, משמש לרינדור כפתורים וכו' |
| `close(result?, force?)` | `void` | סוגר את התצוגה הנוכחית; ניתן להעביר את `result` חזרה לקורא |
| `update(newConfig)` | `void` | מעדכן את תצורת התצוגה (למשל רוחב, כותרת) |
| `navigation` | `ViewNavigation \| undefined` | ניווט תצוגה בתוך הדף, כולל החלפת לשוניות (Tabs) וכו' |

> כרגע, רק `dialog` ו-`drawer` תומכים ב-`Header` ו-`Footer`.

## שדות נפוצים ב-inputArgs

השדות ב-`inputArgs` משתנים בהתאם לתרחיש הפתיחה. שדות נפוצים כוללים:

| שדה | הסבר |
|------|------|
| `viewUid` | UID של התצוגה |
| `collectionName` | שם האוסף |
| `filterByTk` | סינון לפי מפתח ראשי (עבור פרטי רשומה בודדת) |
| `parentId` | מזהה הורה (עבור תרחישי קשרים) |
| `sourceId` | מזהה רשומת מקור |
| `parentItem` | נתוני פריט הורה |
| `scene` | סצנה (למשל `create`, `edit`, `select`) |
| `onChange` | Callback לאחר בחירה או שינוי |
| `tabUid` | UID של הלשונית הנוכחית (בתוך דף) |

ניתן לגשת אליהם באמצעות `ctx.getVar('ctx.view.inputArgs.xxx')` או `ctx.view.inputArgs.xxx`.

## דוגמאות

### סגירת התצוגה הנוכחית

```ts
// סגירת הדיאלוג לאחר שליחה מוצלחת
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// סגירה והחזרת תוצאות
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### שימוש ב-Header / Footer בתוך התוכן

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="עריכה" extra={<Button size="small">עזרה</Button>} />
      <div>תוכן הטופס...</div>
      <Footer>
        <Button onClick={() => close()}>ביטול</Button>
        <Button type="primary" onClick={handleSubmit}>אישור</Button>
      </Footer>
    </div>
  );
}
```

### התניית לוגיקה לפי סוג התצוגה או inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // הסתרת הכותרת בתצוגות מוטמעות
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // תרחיש של בורר משתמשים
}
```

## היחס בין ctx.viewer ל-ctx.openView

| שימוש | שימוש מומלץ |
|------|----------|
| **פתיחת תצוגה חדשה** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` או `ctx.openView()` |
| **פעולה על התצוגה הנוכחית** | `ctx.view.close()`, `ctx.view.update()` |
| **קבלת פרמטרי פתיחה** | `ctx.view.inputArgs` |

`ctx.viewer` אחראי על "פתיחת" תצוגה, בעוד ש-`ctx.view` מייצג את מופע התצוגה ה"נוכחי"; `ctx.openView` משמש לפתיחת תצוגות תהליך עבודה שהוגדרו מראש.

## הערות

- `ctx.view` זמין רק בתוך תצוגה; הוא יהיה `undefined` בדפים רגילים.
- השתמשו ב-optional chaining: `ctx.view?.close?.()` כדי למנוע שגיאות כאשר אין הקשר תצוגה.
- ה-`result` מ-`close(result)` מועבר ל-Promise המוחזר על ידי `ctx.viewer.open()`.

## נושאים קשורים

- [ctx.openView()](./open-view.md): פתיחת תצוגת תהליך עבודה שהוגדרה מראש
- [ctx.modal](./modal.md): חלונות קופצים קלים (מידע, אישור וכו')

> `ctx.viewer` מספק מתודות כמו `dialog()`, `drawer()`, `popover()`, ו-`embed()` לפתיחת תצוגות. ה-`content` שנפתח על ידי מתודות אלו יכול לגשת ל-`ctx.view`.