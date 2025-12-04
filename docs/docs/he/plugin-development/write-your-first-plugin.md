:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# כתיבת ה**תוסף** הראשון שלכם

מדריך זה ילווה אתכם צעד אחר צעד ביצירת **תוסף** בלוק שניתן להשתמש בו בדפים, ויעזור לכם להבין את המבנה הבסיסי ו**תהליך עבודה** הפיתוח של **תוספים** ב-NocoBase.

## דרישות קדם

לפני שמתחילים, ודאו שהתקנתם את NocoBase בהצלחה. אם עדיין לא עשיתם זאת, תוכלו להיעזר במדריכי ההתקנה הבאים:

- [התקנה באמצעות create-nocobase-app](/get-started/installation/create-nocobase-app)
- [התקנה מקוד המקור של Git](/get-started/installation/git)

לאחר השלמת ההתקנה, תוכלו להתחיל רשמית את מסע פיתוח ה**תוספים** שלכם.

## שלב 1: יצירת שלד ה**תוסף** באמצעות CLI

בצעו את הפקודה הבאה בספריית השורש של המאגר כדי ליצור במהירות **תוסף** ריק:

```bash
yarn pm create @my-project/plugin-hello
```

לאחר שהפקודה תרוץ בהצלחה, ייווצרו קבצים בסיסיים בספרייה `packages/plugins/@my-project/plugin-hello`. המבנה המוגדר כברירת מחדל הוא כדלקמן:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Default export server-side plugin
     ├─ client                   # Client-side code location
     │  ├─ index.tsx             # Default exported client-side plugin class
     │  ├─ plugin.tsx            # Plugin entry (extends @nocobase/client Plugin)
     │  ├─ models                # Optional: frontend models (such as flow nodes)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Server-side code location
     │  ├─ index.ts              # Default exported server-side plugin class
     │  ├─ plugin.ts             # Plugin entry (extends @nocobase/server Plugin)
     │  ├─ collections           # Optional: server-side collections
     │  ├─ migrations            # Optional: data migrations
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Optional: multi-language
        ├─ en-US.json
        └─ zh-CN.json
```

לאחר היצירה, תוכלו לגשת לדף מנהל ה**תוספים** בדפדפן שלכם (כתובת ברירת המחדל: http://localhost:13000/admin/settings/plugin-manager) כדי לוודא שה**תוסף** מופיע ברשימה.

## שלב 2: הטמעת בלוק צד-לקוח פשוט

כעת נוסיף ל**תוסף** מודל בלוק מותאם אישית, שיציג הודעת ברכה.

1.  **צרו קובץ מודל בלוק חדש** `client/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2.  **רשמו את מודל הבלוק**. ערכו את `client/models/index.ts` כדי לייצא את המודל החדש, לצורך טעינה בזמן ריצה בצד-לקוח:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

לאחר שמירת הקוד, אם אתם מריצים סקריפט פיתוח, אמורים להופיע יומני טעינה חמה (hot-reload) בפלט הטרמינל.

## שלב 3: הפעלה ובדיקת ה**תוסף**

תוכלו להפעיל את ה**תוסף** באמצעות שורת הפקודה או דרך הממשק:

-   **שורת הפקודה**

    ```bash
    yarn pm enable @my-project/plugin-hello
    ```

-   **ממשק הניהול**: גשו למנהל ה**תוספים**, מצאו את `@my-project/plugin-hello`, ולחצו על "הפעלה".

לאחר ההפעלה, צרו דף חדש מסוג "Modern page (v2)". בעת הוספת בלוקים, תראו את "Hello block". הכניסו אותו לדף כדי לראות את תוכן הברכה שכתבתם זה עתה.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## שלב 4: בנייה ואריזה

כאשר אתם מוכנים להפיץ את ה**תוסף** לסביבות אחרות, עליכם קודם כל לבנות ולארוז אותו:

```bash
yarn build @my-project/plugin-hello --tar
# או בצעו בשני שלבים
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> **טיפ**: אם ה**תוסף** נוצר במאגר קוד המקור, הבנייה הראשונה תפעיל בדיקת סוגים מלאה של המאגר כולו, מה שעשוי לקחת זמן רב. מומלץ לוודא שהתלויות מותקנות ושהמאגר נמצא במצב שניתן לבנות אותו.

לאחר השלמת הבנייה, קובץ האריזה ממוקם כברירת מחדל בנתיב `storage/tar/@my-project/plugin-hello.tar.gz`.

## שלב 5: העלאה ליישום NocoBase אחר

העלו וחלצו את הקובץ לספריית `./storage/plugins` של יישום היעד. לפרטים נוספים, ראו [התקנה ושדרוג תוספים](../get-started/install-upgrade-plugins.mdx).