:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

## סוג

```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

## פרטים

*   `values`: אובייקט הנתונים של הרשומה ליצירה.
*   `whitelist`: מציין אילו שדות באובייקט הנתונים של הרשומה ליצירה **ניתנים לכתיבה**. אם פרמטר זה אינו מועבר, כל השדות מותרים לכתיבה כברירת מחדל.
*   `blacklist`: מציין אילו שדות באובייקט הנתונים של הרשומה ליצירה **אינם מותרים לכתיבה**. אם פרמטר זה אינו מועבר, כל השדות מותרים לכתיבה כברירת מחדל.
*   `transaction`: אובייקט הטרנזקציה (transaction). אם לא מועבר פרמטר טרנזקציה, שיטה זו תיצור באופן אוטומטי טרנזקציה פנימית.