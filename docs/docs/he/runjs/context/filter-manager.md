:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/runjs/context/filter-manager).
:::

# ctx.filterManager

מנהל חיבורי הסינון (Filter Connection Manager) משמש לניהול קשרי הסינון בין טפסי סינון (FilterForm) לבין בלוקי נתונים (טבלאות, רשימות, תרשימים וכו'). הוא מסופק על ידי `BlockGridModel` וזמין רק בתוך ההקשר שלו (למשל, בלוקים של טפסי סינון, בלוקי נתונים).

## תרחישי שימוש

| תרחיש | הסבר |
|------|------|
| **בלוק טופס סינון** | מנהל את הגדרות החיבור בין פריטי הסינון לבלוקי היעד; מרענן את נתוני היעד כאשר המסננים משתנים. |
| **בלוק נתונים (טבלה/רשימה)** | משמש כיעד לסינון, תוך קישור תנאי הסינון באמצעות `bindToTarget`. |
| **כללי קישור / FilterModel מותאם אישית** | קורא ל-`refreshTargetsByFilter` בתוך `doFilter` או `doReset` כדי להפעיל רענון של יעדי הסינון. |
| **הגדרת שדות חיבור** | משתמש ב-`getConnectFieldsConfig` וב-`saveConnectFieldsConfig` כדי לתחזק מיפויי שדות בין מסננים ליעדים. |

> הערה: `ctx.filterManager` זמין רק בהקשרי RunJS הכוללים `BlockGridModel` (למשל, בתוך דף המכיל טופס סינון); הוא יהיה `undefined` ב-JSBlocks רגילים או בדפים עצמאיים. מומלץ להשתמש ב-optional chaining לפני הגישה אליו.

## הגדרות טיפוסים (Type Definitions)

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID של מודל המסנן
  targetId: string;   // UID של מודל בלוק נתוני היעד
  filterPaths?: string[];  // נתיבי השדות של בלוק היעד
  operator?: string;  // אופרטור סינון
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## מתודות נפוצות

| מתודה | הסבר |
|------|------|
| `getFilterConfigs()` | מחזיר את כל הגדרות חיבורי הסינון הנוכחיות. |
| `getConnectFieldsConfig(filterId)` | מחזיר את הגדרת שדות החיבור עבור מסנן ספציפי. |
| `saveConnectFieldsConfig(filterId, config)` | שומר את הגדרת שדות החיבור עבור מסנן. |
| `addFilterConfig(config)` | מוסיף הגדרת סינון (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | מסיר הגדרות סינון לפי filterId, targetId, או שניהם. |
| `bindToTarget(targetId)` | מקשר את הגדרת הסינון לבלוק יעד, ומפעיל את ה-resource שלו להחלת המסנן. |
| `unbindFromTarget(targetId)` | מבטל את קישור הסינון מבלוק היעד. |
| `refreshTargetsByFilter(filterId | filterId[])` | מרענן נתונים של בלוקי יעד הקשורים למסנן או למסננים שצוינו. |

## מושגי ליבה

- **FilterModel**: מודל המספק תנאי סינון (למשל, FilterFormItemModel), אשר חייב לממש את `getFilterValue()` כדי להחזיר את ערך הסינון הנוכחי.
- **TargetModel**: בלוק הנתונים שמסונן; ה-`resource` שלו חייב לתמוך ב-`addFilterGroup`, `removeFilterGroup`, ו-`refresh`.

## דוגמאות

### הוספת הגדרת סינון

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### רענון בלוקי יעד

```ts
// בתוך doFilter / doReset של טופס סינון
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// רענון יעדים הקשורים למספר מסננים
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### הגדרת שדות חיבור

```ts
// קבלת הגדרת חיבור
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// שמירת הגדרת חיבור
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### הסרת הגדרה

```ts
// מחיקת כל ההגדרות עבור מסנן ספציפי
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// מחיקת כל הגדרות הסינון עבור יעד ספציפי
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## נושאים קשורים

- [ctx.resource](./resource.md): ה-resource של בלוק היעד חייב לתמוך בממשק הסינון.
- [ctx.model](./model.md): משמש לקבלת ה-UID של המודל הנוכחי עבור filterId / targetId.