:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/collection).
:::

# ctx.collection

מופע של האוסף (Collection) המשויך להקשר ההרצה הנוכחי של RunJS, המשמש לגישה למטא-נתונים של האוסף, הגדרות שדות, מפתחות ראשיים והגדרות נוספות. בדרך כלל מגיע מ-`ctx.blockModel.collection` או מ-`ctx.collectionField?.collection`.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **JSBlock** | האוסף המקושר לבלוק; ניתן לגשת ל-`name`, `getFields`, `filterTargetKey` וכו'. |
| **JSField / JSItem / JSColumn** | האוסף אליו שייך השדה הנוכחי (או האוסף של בלוק האב), משמש לאחזור רשימות שדות, מפתחות ראשיים וכו'. |
| **עמודת טבלה / בלוק פירוט** | משמש לרינדור על סמך מבנה האוסף או להעברת `filterByTk` בעת פתיחת חלונות קופצים (popups). |

> שימו לב: `ctx.collection` זמין בתרחישים שבהם בלוק נתונים, בלוק טופס או בלוק טבלה מקושרים לאוסף. בבלוק JS עצמאי שאינו מקושר לאוסף, הוא עשוי להיות `null`. מומלץ לבצע בדיקת ערך ריק לפני השימוש.

## הגדרת טיפוס (Type Definition)

```ts
collection: Collection | null | undefined;
```

## מאפיינים נפוצים

| מאפיין | טיפוס | הסבר |
|------|------|------|
| `name` | `string` | שם האוסף (למשל `users`, `orders`) |
| `title` | `string` | כותרת האוסף (כולל תרגום) |
| `filterTargetKey` | `string \| string[]` | שם שדה המפתח הראשי, משמש עבור `filterByTk` ו-`getFilterByTK` |
| `dataSourceKey` | `string` | מפתח מקור הנתונים (למשל `main`) |
| `dataSource` | `DataSource` | מופע מקור הנתונים אליו הוא שייך |
| `template` | `string` | תבנית האוסף (למשל `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | רשימת שדות שניתן להציג ככותרות |
| `titleCollectionField` | `CollectionField` | מופע שדה הכותרת |

## מתודות נפוצות

| מתודה | הסבר |
|------|------|
| `getFields(): CollectionField[]` | קבלת כל השדות (כולל שדות מורשים) |
| `getField(name: string): CollectionField \| undefined` | קבלת שדה בודד לפי שם השדה |
| `getFieldByPath(path: string): CollectionField \| undefined` | קבלת שדה לפי נתיב (תומך בקשרים, למשל `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | קבלת שדות קשר; `types` יכול להיות `['one']`, `['many']` וכו'. |
| `getFilterByTK(record): any` | חילוץ ערך המפתח הראשי מתוך רשומה, משמש עבור `filterByTk` ב-API. |

## הקשר בין ctx.collectionField ל-ctx.blockModel

| צורך | שימוש מומלץ |
|------|----------|
| **האוסף המשויך להקשר הנוכחי** | `ctx.collection` (שווה ערך ל-`ctx.blockModel?.collection` או `ctx.collectionField?.collection`) |
| **הגדרת האוסף של השדה הנוכחי** | `ctx.collectionField?.collection` (האוסף אליו השדה שייך) |
| **אוסף היעד של הקשר** | `ctx.collectionField?.targetCollection` (אוסף היעד של שדה קשר) |

בתרחישים כמו תת-טבלאות, `ctx.collection` עשוי להיות אוסף היעד של הקשר; בטפסים או טבלאות רגילים, הוא בדרך כלל האוסף המקושר לבלוק.

## דוגמאות

### קבלת מפתח ראשי ופתיחת חלון קופץ

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### מעבר על שדות לצורך אימות או קישוריות (Linkage)

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} הוא שדה חובה`);
    return;
  }
}
```

### קבלת שדות קשר

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// משמש לבניית תת-טבלאות, משאבים קשורים וכו'.
```

## הערות

- `filterTargetKey` הוא שם שדה המפתח הראשי של האוסף; חלק מהאוספים עשויים להשתמש ב-`string[]` עבור מפתחות ראשיים מורכבים; כאשר לא מוגדר, נהוג להשתמש ב-`id` כברירת מחדל.
- בתרחישים כמו **תת-טבלאות או שדות קשר**, `ctx.collection` עשוי להצביע על אוסף היעד של הקשר, מה ששונה מ-`ctx.blockModel.collection`.
- `getFields()` ממזג שדות מאוספים מורשים; שדות מקומיים דורסים שדות מורשים בעלי אותו שם.

## נושאים קשורים

- [ctx.collectionField](./collection-field.md): הגדרת שדה האוסף של השדה הנוכחי
- [ctx.blockModel](./block-model.md): בלוק האב המארח את ה-JS הנוכחי, מכיל את `collection`
- [ctx.model](./model.md): המודל הנוכחי, עשוי להכיל את `collection`