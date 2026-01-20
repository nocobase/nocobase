:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# הרחבת סוגי טריגרים

כל תהליך עבודה חייב להיות מוגדר עם טריגר ספציפי, המשמש כנקודת הכניסה להפעלת התהליך.

סוג טריגר מייצג בדרך כלל אירוע סביבתי ספציפי במערכת. במהלך מחזור החיים של הפעלת היישום, כל חלק שמספק אירועים הניתנים להרשמה יכול לשמש להגדרת סוג טריגר. לדוגמה: קבלת בקשות, פעולות על אוספים, משימות מתוזמנות ועוד.

סוגי טריגרים נרשמים בטבלת הטריגרים של התוסף בהתבסס על מזהה מחרוזת. תוסף תהליך העבודה כולל מספר טריגרים מובנים:

- `'collection'`: מופעל על ידי פעולות אוסף;
- `'schedule'`: מופעל על ידי משימות מתוזמנות;
- `'action'`: מופעל על ידי אירועים לאחר פעולה;

סוגי טריגרים מורחבים צריכים להבטיח שהמזהים שלהם יהיו ייחודיים. המימוש להרשמה/ביטול הרשמה של הטריגר נרשם בצד השרת, והמימוש לממשק התצורה נרשם בצד הלקוח.

## צד השרת

כל טריגר צריך לרשת ממחלקת הבסיס `Trigger` ולממש את מתודות `on`/`off`, המשמשות בהתאמה להרשמה וביטול הרשמה לאירועים סביבתיים ספציפיים. במתודת `on`, עליכם לקרוא ל-`this.workflow.trigger()` בתוך פונקציית הקריאה החוזרת (callback) של האירוע הספציפי, כדי להפעיל את האירוע בסופו של דבר. בנוסף, במתודת `off`, עליכם לבצע את עבודות הניקוי הרלוונטיות לביטול ההרשמה.

ה-`this.workflow` הוא מופע תוסף תהליך העבודה המועבר למחלקת הבסיס `Trigger` בקונסטרוקטור.

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.workflow.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

לאחר מכן, בתוסף המרחיב את תהליך העבודה, רשמו את מופע הטריגר במנוע תהליך העבודה:

```ts
import WorkflowPlugin from '@nocobase/plugin-workflow';

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    // register trigger
    workflowPlugin.registerTrigger('interval', MyTrigger);
  }
}
```

לאחר שהשרת מופעל ונטען, ניתן להוסיף ולהפעיל את הטריגר מסוג `'interval'`.

## צד הלקוח

חלק הלקוח מספק בעיקר ממשק תצורה בהתבסס על פריטי התצורה הנדרשים על ידי סוג הטריגר. כל סוג טריגר צריך גם לרשום את תצורת הסוג המתאימה שלו בתוסף תהליך העבודה.

לדוגמה, עבור הטריגר המתוזמן שהוזכר לעיל, הגדירו את פריט התצורה הנדרש לזמן המרווח (`interval`) בטופס ממשק התצורה:

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';
  // fields of trigger config
  fieldset = {
    interval: {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    },
  };
}
```

לאחר מכן, רשמו את סוג הטריגר הזה במופע תוסף תהליך העבודה בתוך התוסף המורחב:

```ts
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import MyTrigger from './MyTrigger';

export default class extends Plugin {
  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

לאחר מכן, סוג הטריגר החדש יהיה גלוי בממשק התצורה של תהליך העבודה.

:::info{title=הערה}
מזהה סוג הטריגר שנרשם בצד הלקוח חייב להיות תואם לזה שבצד השרת, אחרת יגרמו שגיאות.
:::

לפרטים נוספים על הגדרת סוגי טריגרים, עיינו בסעיף [תיעוד API של תהליך העבודה](./api#pluginregisterTrigger).