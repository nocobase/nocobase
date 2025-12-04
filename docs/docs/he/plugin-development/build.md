:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# בנייה

## הגדרות בנייה מותאמות אישית

אם ברצונכם להתאים אישית את הגדרות הבנייה, תוכלו ליצור קובץ `build.config.ts` בתיקיית הבסיס של ה**תוסף** עם התוכן הבא:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // Vite משמש לאריזת קוד צד-לקוח (client) מתוך `src/client`

    // כדי לשנות את הגדרות Vite, ראו: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup משמש לאריזת קוד צד-שרת (server) מתוך `src/server`

    // כדי לשנות את הגדרות tsup, ראו: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // פונקציית קריאה חוזרת (callback) המופעלת לפני תחילת הבנייה, ומאפשרת לבצע פעולות מקדימות.
  },
  afterBuild: (log: PkgLog) => {
    // פונקציית קריאה חוזרת המופעלת לאחר השלמת הבנייה, ומאפשרת לבצע פעולות לאחר הבנייה.
  };
});
```