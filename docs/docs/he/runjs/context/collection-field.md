:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/collection-field).
:::

# ctx.collectionField

מופע של `CollectionField` המשויך להקשר ההרצה (execution context) הנוכחי של RunJS, המשמש לגישה למטא-דאטה של השדה, סוגים, כללי אימות (validation) ומידע על קשרים (associations). הוא קיים רק כאשר השדה קשור להגדרה של אוסף (Collection); שדות מותאמים אישית או וירטואליים עשויים להיות `null`.

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **JSField** | ביצוע קישוריות (linkage) או אימות בשדות טופס בהתבסס על `interface`, `enum`, `targetCollection` וכו'. |
| **JSItem** | גישה למטא-דאטה של השדה המתאים לעמודה הנוכחית בפריטים של תת-טבלה. |
| **JSColumn** | בחירת שיטות רינדור בהתבסס על `collectionField.interface` או גישה ל-`targetCollection` בעמודות טבלה. |

> הערה: `ctx.collectionField` זמין רק כאשר השדה קשור להגדרה של אוסף (Collection); הוא בדרך כלל `undefined` בתרחישים כמו בלוקים עצמאיים של JSBlock או אירועי פעולה (action events) ללא קישור לשדה. מומלץ לבדוק קיום ערך לפני השימוש.

## הגדרת טיפוס (Type Definition)

```ts
collectionField: CollectionField | null | undefined;
```

## מאפיינים נפוצים

| מאפיין | טיפוס | הסבר |
|------|------|------|
| `name` | `string` | שם השדה (למשל, `status`, `userId`) |
| `title` | `string` | כותרת השדה (כולל תרגום בינלאומי) |
| `type` | `string` | סוג הנתונים של השדה (`string`, `integer`, `belongsTo` וכו') |
| `interface` | `string` | סוג ממשק השדה (`input`, `select`, `m2o`, `o2m`, `m2m` וכו') |
| `collection` | `Collection` | האוסף אליו השדה שייך |
| `targetCollection` | `Collection` | אוסף היעד של שדה הקשר (רק עבור סוגי קשרים) |
| `target` | `string` | שם אוסף היעד (עבור שדות קשר) |
| `enum` | `array` | אפשרויות בחירה (select, radio וכו') |
| `defaultValue` | `any` | ערך ברירת מחדל |
| `collectionName` | `string` | שם האוסף אליו הוא שייך |
| `foreignKey` | `string` | שם שדה מפתח זר (belongsTo וכו') |
| `sourceKey` | `string` | מפתח מקור הקשר (hasMany וכו') |
| `targetKey` | `string` | מפתח יעד הקשר |
| `fullpath` | `string` | נתיב מלא (למשל, `main.users.status`), משמש ל-API או להתייחסות למשתנים |
| `resourceName` | `string` | שם המשאב (למשל, `users.status`) |
| `readonly` | `boolean` | האם השדה לקריאה בלבד |
| `titleable` | `boolean` | האם ניתן להציג אותו ככותרת |
| `validation` | `object` | הגדרות כללי אימות |
| `uiSchema` | `object` | הגדרות UI |
| `targetCollectionTitleField` | `CollectionField` | שדה הכותרת של אוסף היעד (עבור שדות קשר) |

## מתודות נפוצות

| מתודה | הסבר |
|------|------|
| `isAssociationField(): boolean` | האם זהו שדה קשר (belongsTo, hasMany, hasOne, belongsToMany וכו') |
| `isRelationshipField(): boolean` | האם זהו שדה יחסים (כולל o2o, m2o, o2m, m2m וכו') |
| `getComponentProps(): object` | קבלת ה-props ברירת המחדל של רכיב השדה |
| `getFields(): CollectionField[]` | קבלת רשימת השדות של אוסף היעד (שדות קשר בלבד) |
| `getFilterOperators(): object[]` | קבלת אופרטורי הסינון הנתמכים על ידי שדה זה (למשל, `$eq`, `$ne` וכו') |

## דוגמאות

### רינדור מותנה לפי סוג השדה

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // שדה קשר: הצגת רשומות קשורות
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### בדיקה האם מדובר בשדה קשר וגישה לאוסף היעד

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // עיבוד לפי מבנה אוסף היעד
}
```

### קבלת אפשרויות בחירה (enum)

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### רינדור מותנה לפי מצב קריאה בלבד/תצוגה

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### קבלת שדה הכותרת של אוסף היעד

```ts
// בעת הצגת שדה קשר, השתמש ב-targetCollectionTitleField כדי לקבל את שם שדה הכותרת
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## הקשר עם ctx.collection

| צורך | שימוש מומלץ |
|------|----------|
| **האוסף של השדה הנוכחי** | `ctx.collectionField?.collection` או `ctx.collection` |
| **מטא-דאטה של השדה (שם, סוג, ממשק, enum וכו')** | `ctx.collectionField` |
| **אוסף היעד** | `ctx.collectionField?.targetCollection` |

`ctx.collection` מייצג בדרך כלל את האוסף הקשור לבלוק הנוכחי; `ctx.collectionField` מייצג את ההגדרה של השדה הנוכחי בתוך האוסף. בתרחישים כמו תתי-טבלאות או שדות קשר, השניים עשויים להיות שונים.

## נקודות לתשומת לב

- בתרחישים כגון **JSBlock** או **JSAction (ללא קישור לשדה)**, `ctx.collectionField` הוא בדרך כלל `undefined`. מומלץ להשתמש ב-optional chaining לפני הגישה.
- אם שדה JS מותאם אישית אינו קשור לשדה באוסף, `ctx.collectionField` עשוי להיות `null`.
- `targetCollection` קיים רק עבור שדות מסוג קשר (למשל, m2o, o2m, m2m); `enum` קיים רק עבור שדות עם אפשרויות בחירה כמו select או radioGroup.

## נושאים קשורים

- [ctx.collection](./collection.md): האוסף המשויך להקשר הנוכחי
- [ctx.model](./model.md): המודל שבו נמצא הקשר ההרצה הנוכחי
- [ctx.blockModel](./block-model.md): בלוק האב המכיל את ה-JS הנוכחי
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): קריאה וכתיבה של ערך השדה הנוכחי