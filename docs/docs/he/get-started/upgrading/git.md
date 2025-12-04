:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# שדרוג התקנת Git מקוד מקור

:::warning הכנה לפני שדרוג

- ודאו שגיביתם את מסד הנתונים קודם.
- עצרו את מופע NocoBase הפועל (`Ctrl + C`).

:::

## 1. עברו לספריית הפרויקט של NocoBase

```bash
cd my-nocobase-app
```

## 2. משכו את הקוד העדכני ביותר

```bash
git pull
```

## 3. מחקו מטמון ותלויות ישנות (אופציונלי)

אם תהליך השדרוג הרגיל נכשל, תוכלו לנסות לנקות את המטמון והתלויות ולאחר מכן להוריד אותם מחדש.

```bash
# נקו את מטמון nocobase
yarn nocobase clean
# מחקו תלויות
yarn rimraf -rf node_modules # שקול ל-rm -rf node_modules
```

## 4. עדכנו תלויות

📢 בשל גורמים כמו סביבת רשת ותצורת מערכת, שלב זה עשוי להימשך למעלה מעשר דקות.

```bash
yarn install
```

## 5. הריצו את פקודת השדרוג

```bash
yarn nocobase upgrade
```

## 6. הפעילו את NocoBase

```bash
yarn dev
```

:::tip טיפ לסביבת ייצור

לא מומלץ לפרוס התקנת NocoBase מקוד מקור ישירות בסביבת ייצור (למידע נוסף על סביבות ייצור, עיינו ב-[פריסה בסביבת ייצור](../deployment/production.md)).

:::

## 7. שדרוג תוספים של צד שלישי

עיינו ב-[התקנה ושדרוג תוספים](../install-upgrade-plugins.mdx).