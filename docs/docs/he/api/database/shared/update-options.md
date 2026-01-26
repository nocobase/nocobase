:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

## סוג

```typescript
interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

## פרטים

- `values`: אובייקט הנתונים של הרשומה לעדכון.
- `filter`: מציין את תנאי הסינון לרשומות שיש לעדכן. לשימוש מפורט ב-Filter, עיין בשיטת [`find()`](#find).
- `filterByTk`: מציין את תנאי הסינון לרשומות שיש לעדכן לפי TargetKey.
- `whitelist`: רשימה לבנה (whitelist) עבור שדות ה-`values`. רק שדות הנמצאים ברשימה זו ייכתבו.
- `blacklist`: רשימה שחורה (blacklist) עבור שדות ה-`values`. שדות הנמצאים ברשימה זו לא ייכתבו.
- `transaction`: אובייקט הטרנזקציה. אם לא מועבר פרמטר טרנזקציה, השיטה תיצור באופן אוטומטי טרנזקציה פנימית.

יש להעביר לפחות אחד מבין `filterByTk` או `filter`.