:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/block-model).
:::

# ctx.blockModel

מודל הבלוק האב (מופע של BlockModel) שבו נמצא ה-JS Field / JS Block הנוכחי. בתרחישים כגון JSField, JSItem ו-JSColumn, ה-`ctx.blockModel` מצביע על בלוק הטופס או בלוק הטבלה הנושא את לוגיקת ה-JS הנוכחית. ב-JSBlock עצמאי, הוא עשוי להיות `null` או זהה ל-`ctx.model`.

## תרחישי שימוש

| תרחיש | תיאור |
|------|------|
| **JSField** | גישה ל-`form`, ל-`collection` ול-`resource` של בלוק הטופס האב בתוך שדה טופס לצורך מימוש קישוריות (linkage) או אימות (validation). |
| **JSItem** | גישה למידע על המשאב והאוסף של בלוק הטבלה/טופס האב בתוך פריט של תת-טבלה. |
| **JSColumn** | גישה ל-`resource` (למשל `getSelectedRows`) ול-`collection` של בלוק הטבלה האב בתוך עמודת טבלה. |
| **פעולות טופס / FlowEngine** | גישה ל-`form` לצורך אימות לפני שליחה, ל-`resource` לצורך רענון וכו'. |

> הערה: `ctx.blockModel` זמין רק בהקשרי RunJS שבהם קיים בלוק אב. ב-JSBlocks עצמאיים (ללא טופס/טבלה אב), הוא עשוי להיות `null`. מומלץ לבצע בדיקת null לפני השימוש.

## הגדרת טיפוס (Type Definition)

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

הטיפוס הספציפי תלוי בסוג בלוק האב: בלוקי טופס הם לרוב `FormBlockModel` או `EditFormModel`, בעוד שבלוקי טבלה הם לרוב `TableBlockModel`.

## מאפיינים נפוצים

| מאפיין | טיפוס | תיאור |
|------|------|------|
| `uid` | `string` | מזהה ייחודי של מודל הבלוק. |
| `collection` | `Collection` | האוסף (collection) המקושר לבלוק הנוכחי. |
| `resource` | `Resource` | מופע המשאב (resource) שבו משתמש הבלוק (`SingleRecordResource` / `MultiRecordResource` וכו'). |
| `form` | `FormInstance` | בלוק טופס: מופע של Ant Design Form, התומך ב-`getFieldsValue`, `validateFields`, `setFieldsValue` וכו'. |
| `emitter` | `EventEmitter` | פולט אירועים (Event emitter), משמש להאזנה ל-`formValuesChange`, `onFieldReset` וכו'. |

## היחס בין ctx.model ל-ctx.form

| צורך | שימוש מומלץ |
|------|----------|
| **בלוק האב של ה-JS הנוכחי** | `ctx.blockModel` |
| **קריאה/כתיבה של שדות טופס** | `ctx.form` (שווה ערך ל-`ctx.blockModel?.form`, נוח יותר בבלוקי טופס) |
| **המודל של הקשר הביצוע הנוכחי** | `ctx.model` (מודל שדה ב-JSField, מודל בלוק ב-JSBlock) |

ב-JSField, ה-`ctx.model` הוא מודל השדה, ו-`ctx.blockModel` הוא בלוק הטופס או הטבלה הנושא את אותו שדה; `ctx.form` הוא בדרך כלל `ctx.blockModel.form`.

## דוגמאות

### טבלה: קבלת שורות נבחרות ועיבודן

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('נא לבחור נתונים תחילה');
  return;
}
```

### תרחיש טופס: אימות ורענון

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### האזנה לשינויים בטופס

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // מימוש קישוריות או רינדור מחדש על סמך ערכי הטופס העדכניים
});
```

### הפעלת רינדור מחדש של הבלוק

```ts
ctx.blockModel?.rerender?.();
```

## הערות

- ב-**JSBlock עצמאי** (ללא בלוק טופס או טבלה אב), `ctx.blockModel` עשוי להיות `null`. מומלץ להשתמש ב-optional chaining בעת גישה למאפיינים שלו: `ctx.blockModel?.resource?.refresh?.()`.
- ב-**JSField / JSItem / JSColumn**, ה-`ctx.blockModel` מתייחס לבלוק הטופס או הטבלה הנושא את השדה הנוכחי. ב-**JSBlock**, הוא עשוי להיות הוא עצמו או בלוק ברמה גבוהה יותר, תלוי בהיררכיה בפועל.
- `resource` קיים רק בבלוקי נתונים; `form` קיים רק בבלוקי טופס. לבלוקי טבלה בדרך כלל אין `form`.

## נושאים קשורים

- [ctx.model](./model.md): המודל של הקשר הביצוע הנוכחי.
- [ctx.form](./form.md): מופע טופס, נפוץ בשימוש בבלוקי טופס.
- [ctx.resource](./resource.md): מופע משאב (שווה ערך ל-`ctx.blockModel?.resource`, השתמש ישירות אם זמין).
- [ctx.getModel()](./get-model.md): קבלת מודלים של בלוקים אחרים לפי UID.