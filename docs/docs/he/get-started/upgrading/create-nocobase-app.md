:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# שדרוג התקנת create-nocobase-app

:::warning הכנה לפני השדרוג

- הקפידו לגבות את מסד הנתונים תחילה
- עצרו את מופע NocoBase הפועל

:::

## 1. עצירת מופע NocoBase הפועל

אם התהליך אינו רץ ברקע, עצרו אותו באמצעות `Ctrl + C`. בסביבת ייצור, הפעילו את הפקודה `pm2-stop` כדי לעצור אותו.

```bash
yarn nocobase pm2-stop
```

## 2. הפעלת פקודת השדרוג

פשוט הפעילו את הפקודה `yarn nocobase upgrade`.

```bash
# עברו לספרייה המתאימה
cd my-nocobase-app
# הפעילו את פקודת השדרוג
yarn nocobase upgrade
# הפעלה
yarn dev
```

### שדרוג לגרסה ספציפית

שנו את קובץ `package.json` בספריית הבסיס של הפרויקט, ושנו את מספרי הגרסה עבור `@nocobase/cli` ו-`@nocobase/devtools` (ניתן רק לשדרג, לא לשנמך). לדוגמה:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

לאחר מכן, הפעילו את פקודת השדרוג:

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```