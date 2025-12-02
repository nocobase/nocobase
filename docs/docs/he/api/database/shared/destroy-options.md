:::tip הודעת תרגום AI
תיעוד זה תורגם אוטומטית על ידי AI.
:::


**סוג**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**פרטים**

- `filter`: מציין את תנאי הסינון עבור הרשומות למחיקה. לשימוש מפורט ב-`Filter`, עיינו בשיטת [`find()`](#find).
- `filterByTk`: מציין את תנאי הסינון עבור הרשומות למחיקה לפי `TargetKey`.
- `truncate`: האם לרוקן את נתוני האוסף. פרמטר זה תקף רק כאשר הפרמטרים `filter` או `filterByTk` אינם מסופקים.
- `transaction`: אובייקט טרנזקציה. אם לא מועבר פרמטר טרנזקציה, השיטה תיצור באופן אוטומטי טרנזקציה פנימית.