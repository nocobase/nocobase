:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# הרחבת סוגי צמתים

סוג של צומת הוא למעשה הוראת פעולה. הוראות שונות מייצגות פעולות שונות המבוצעות בתהליך העבודה.

בדומה לטריגרים, הרחבת סוגי צמתים מחולקת גם היא לשני חלקים: צד השרת וצד הלקוח. צד השרת צריך לממש את הלוגיקה עבור ההוראה הרשומה, בעוד שצד הלקוח צריך לספק את תצורת הממשק עבור הפרמטרים של הצומת שבו נמצאת ההוראה.

## צד השרת

### הוראת הצומת הפשוטה ביותר

התוכן המרכזי של הוראה הוא פונקציה, כלומר, מתודת `run` במחלקת ההוראה חייבת להיות ממומשת כדי לבצע את הלוגיקה של ההוראה. ניתן לבצע כל פעולה נחוצה בתוך הפונקציה, כגון פעולות מסד נתונים, פעולות קבצים, קריאה ל-API של צד שלישי וכו'.

כל ההוראות צריכות להיות נגזרות ממחלקת הבסיס `Instruction`. ההוראה הפשוטה ביותר צריכה לממש רק פונקציית `run`:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class MyInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
}
```

ולרשום הוראה זו בתוסף תהליך העבודה:

```ts
export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('my-instruction', MyInstruction);
  }
}
```

ערך הסטטוס (`status`) באובייקט ההחזרה של ההוראה הוא חובה וחייב להיות אחד מהערכים של הקבוע `JOB_STATUS`. ערך זה קובע את זרימת ההמשך של עיבוד הצומת בתהליך העבודה. בדרך כלל, משתמשים ב-`JOB_STATUS.RESOVLED`, המציין שהצומת בוצע בהצלחה והביצוע ימשיך לצמתים הבאים. אם יש ערך תוצאה שצריך לשמור מראש, ניתן גם לקרוא למתודת `processor.saveJob` ולהחזיר את אובייקט ההחזרה שלה. המבצע ייצור רשומת תוצאת ביצוע על בסיס אובייקט זה.

### ערך תוצאת הצומת

אם יש תוצאת ביצוע ספציפית, במיוחד נתונים שהוכנו לשימוש על ידי צמתים עוקבים, ניתן להחזיר אותה באמצעות מאפיין `result` ולשמור אותה באובייקט המשימה של הצומת:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class RandomStringInstruction extends Instruction {
  run(node, input, processor) {
    // customized config from node
    const { digit = 1 } = node.config;
    const result = `${Math.round(10 ** digit * Math.random())}`.padStart(
      digit,
      '0',
    );
    return {
      status: JOB_STATUS.RESOVLED,
      result,
    };
  },
};
```

כאן, `node.config` הוא פריט התצורה של הצומת, שיכול להיות כל ערך נדרש. הוא יישמר כשדה מסוג `JSON` ברשומת הצומת המתאימה במסד הנתונים.

### טיפול בשגיאות בהוראה

אם עלולות להתרחש חריגות במהלך הביצוע, ניתן לתפוס אותן מראש ולהחזיר סטטוס כשל:

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const errorInstruction = {
  run(node, input, processor) {
    try {
      throw new Error('exception');
    } catch (error) {
      return {
        status: JOB_STATUS.ERROR,
        result: error,
      };
    }
  },
};
```

אם חריגות צפויות אינן נתפסות, מנוע תהליך העבודה יתפוס אותן אוטומטית ויחזיר סטטוס שגיאה כדי למנוע קריסת התוכנית עקב חריגות שלא נתפסו.

### צמתים אסינכרוניים

כאשר נדרשת בקרת זרימה או פעולות קלט/פלט אסינכרוניות (גוזלות זמן), מתודת `run` יכולה להחזיר אובייקט עם `status` של `JOB_STATUS.PENDING`, המורה למבצע להמתין (להשהות) עד להשלמת פעולה אסינכרונית חיצונית כלשהי, ולאחר מכן להודיע למנוע תהליך העבודה להמשיך בביצוע. אם מוחזר ערך סטטוס ממתין בפונקציית `run`, ההוראה חייבת לממש את מתודת `resume`; אחרת, לא ניתן יהיה לחדש את ביצוע תהליך העבודה:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class PayInstruction extends Instruction {
  async run(node, input, processor) {
    // job could be create first via processor
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
    });

    const { workflow } = processor;
    // do payment asynchronously
    paymentService.pay(node.config, (result) => {
      // notify processor to resume the job
      return workflow.resume(job.id, result);
    });

    // return created job instance
    return job;
  }

  resume(node, job, processor) {
    // check payment status
    job.set('status', job.result.status === 'ok' ? JOB_STATUS.RESOVLED : JOB_STATUS.REJECTED);
    return job;
  },
};
```

כאן, `paymentService` מתייחס לשירות תשלומים כלשהו. בקריאה חוזרת של השירות, תהליך העבודה מופעל כדי לחדש את ביצוע המשימה המתאימה, והתהליך הנוכחי יוצא תחילה. מאוחר יותר, מנוע תהליך העבודה יוצר מעבד חדש ומעביר אותו למתודת `resume` של הצומת כדי להמשיך בביצוע הצומת שהושהה קודם לכן.

:::info{title=הערה}
"פעולה אסינכרונית" המוזכרת כאן אינה מתייחסת לפונקציות `async` ב-JavaScript, אלא לפעולות שאינן מחזירות תוצאה באופן מיידי בעת אינטראקציה עם מערכות חיצוניות אחרות, כגון שירות תשלומים שצריך להמתין להודעה נוספת כדי לדעת את התוצאה.
:::

### סטטוס תוצאת הצומת

סטטוס הביצוע של צומת משפיע על הצלחת או כישלון תהליך העבודה כולו. בדרך כלל, ללא ענפים, כישלון של צומת אחד יגרום ישירות לכישלון של תהליך העבודה כולו. התרחיש הנפוץ ביותר הוא שאם צומת מבוצע בהצלחה, הוא ממשיך לצומת הבא בטבלת הצמתים עד שאין צמתים נוספים, ובשלב זה תהליך העבודה כולו מסתיים בסטטוס הצלחה.

אם צומת כלשהו מחזיר סטטוס ביצוע כושל במהלך הביצוע, המנוע יטפל בכך באופן שונה בהתאם לשני המצבים הבאים:

1.  הצומת שמחזיר סטטוס כושל נמצא בתהליך העבודה הראשי, כלומר, הוא אינו נמצא בתוך אף תהליך עבודה מסועף שנפתח על ידי צומת קודם. במקרה זה, תהליך העבודה הראשי כולו ייקבע ככושל, והתהליך ייצא.

2.  הצומת שמחזיר סטטוס כושל נמצא בתוך תהליך עבודה מסועף. במקרה זה, האחריות לקביעת המצב הבא של תהליך העבודה מועברת לצומת שפתח את הענף. הלוגיקה הפנימית של צומת זה תקבע את מצב תהליך העבודה העוקב, והחלטה זו תתפשט באופן רקורסיבי עד לתהליך העבודה הראשי.

בסופו של דבר, המצב הבא של תהליך העבודה כולו נקבע בצמתים של תהליך העבודה הראשי. אם צומת בתהליך העבודה הראשי מחזיר כשל, תהליך העבודה כולו מסתיים בסטטוס כושל.

אם צומת כלשהו מחזיר סטטוס "ממתין" לאחר הביצוע, תהליך הביצוע כולו יופסק ויושהה זמנית, וימתין לאירוע המוגדר על ידי הצומת המתאים שיפעיל את חידוש ביצוע תהליך העבודה. לדוגמה, צומת ידני, כאשר הוא מבוצע, יושהה באותו צומת עם סטטוס "ממתין", וימתין להתערבות ידנית כדי להחליט אם לאשר. אם הסטטוס שהוזן ידנית הוא אישור, הצמתים העוקבים של תהליך העבודה ימשיכו; אחרת, הוא יטופל בהתאם ללוגיקת הכישלון שתוארה קודם לכן.

לסטטוסי החזרה נוספים של הוראות, עיין בסעיף [הפניה ל-API של תהליך העבודה](https://docs.nocobase.com/api/workflow).

### יציאה מוקדמת

בתהליכי עבודה מיוחדים מסוימים, ייתכן שיהיה צורך לסיים את תהליך העבודה ישירות בתוך צומת. ניתן להחזיר `null` כדי לציין יציאה מתהליך העבודה הנוכחי, וצמתים עוקבים לא יבוצעו.

מצב זה נפוץ בצמתים מסוג בקרת זרימה, כגון צומת ענף מקבילי ([הפניה לקוד](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L87)), שבו תהליך העבודה של הצומת הנוכחי יוצא, אך תהליכי עבודה חדשים נפתחים עבור כל תת-ענף וממשיכים בביצוע.

:::warn{title=אזהרה}
תזמון תהליכי עבודה מסועפים עם צמתים מורחבים כרוך במורכבות מסוימת ודורש טיפול זהיר ובדיקות יסודיות.
:::

### למידע נוסף

להגדרות של פרמטרים שונים להגדרת סוגי צמתים, עיין בסעיף [הפניה ל-API של תהליך העבודה](https://docs.nocobase.com/api/workflow).

## צד הלקוח

בדומה לטריגרים, טופס התצורה עבור הוראה (סוג צומת) צריך להיות ממומש בצד הלקוח.

### הוראת הצומת הפשוטה ביותר

כל ההוראות צריכות להיות נגזרות ממחלקת הבסיס `Instruction`. המאפיינים והמתודות הקשורים משמשים לתצורה ושימוש בצומת.

לדוגמה, אם אנחנו צריכים לספק ממשק תצורה עבור צומת מסוג מחרוזת מספרים אקראיים (`randomString`) שהוגדר בצד השרת לעיל, שיש לו פריט תצורה `digit` המייצג את מספר הספרות עבור המספר האקראי, נשתמש בתיבת קלט מספרים בטופס התצורה כדי לקבל קלט מהמשתמש.

```tsx pure
import WorkflowPlugin, { Instruction, VariableOption } from '@nocobase/workflow/client';

class MyInstruction extends Instruction {
  title = 'Random number string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    'digit': {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 6,
    },
  };
  useVariables(node, options): VariableOption {
    return {
      value: node.key,
      label: node.title,
    };
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('randomString', MyInstruction);
  }
}
```

:::info{title=הערה}
מזהה סוג הצומת הרשום בצד הלקוח חייב להיות תואם לזה שבצד השרת, אחרת יגרום לשגיאות.
:::

### הצגת תוצאות צומת כמשתנים

ייתכן שתבחינו במתודת `useVariables` בדוגמה לעיל. אם אתם צריכים להשתמש בתוצאת הצומת (חלק ה-`result`) כמשתנה עבור צמתים עוקבים, עליכם לממש מתודה זו במחלקת ההוראה היורשת ולהחזיר אובייקט התואם לטיפוס `VariableOption`. אובייקט זה משמש כתיאור מבני של תוצאת ביצוע הצומת, ומספק מיפוי שמות משתנים לבחירה ושימוש בצמתים עוקבים.

טיפוס `VariableOption` מוגדר כדלקמן:

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

הליבה היא מאפיין ה-`value`, המייצג את ערך הנתיב המפוצל של שם המשתנה. `label` משמש לתצוגה בממשק, ו-`children` משמש לייצוג מבנה משתנה רב-שכבתי, המשמש כאשר תוצאת הצומת היא אובייקט מקונן עמוק.

משתנה שמיש מיוצג באופן פנימי במערכת כמחרוזת תבנית נתיב המופרדת באמצעות `.`, לדוגמה, `{{jobsMapByNodeKey.2dw92cdf.abc}}`. כאן, `jobsMapByNodeKey` מייצג את קבוצת התוצאות של כל הצמתים (מוגדר פנימית, אין צורך לטפל), `2dw92cdf` הוא ה-`key` של הצומת, ו-`abc` הוא מאפיין מותאם אישית באובייקט התוצאה של הצומת.

בנוסף, מכיוון שתוצאת צומת יכולה להיות גם ערך פשוט, כאשר מספקים משתני צומת, הרמה הראשונה **חייבת** להיות התיאור של הצומת עצמו:

```ts
{
  value: node.key,
  label: node.title,
}
```

כלומר, הרמה הראשונה היא ה-`key` והכותרת של הצומת. לדוגמה, בהפניה לקוד של צומת חישוב ([code reference](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77)), בעת שימוש בתוצאה של צומת החישוב, אפשרויות הממשק הן כדלקמן:

![תוצאת צומת חישוב](https://static-docs.nocobase.com/20240514230014.png)

כאשר תוצאת הצומת היא אובייקט מורכב, ניתן להשתמש ב-`children` כדי להמשיך לתאר מאפיינים מקוננים. לדוגמה, הוראה מותאמת אישית עשויה להחזיר את נתוני ה-JSON הבאים:

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

אז ניתן להחזיר זאת באמצעות מתודת `useVariables` באופן הבא:

```ts
useVariables(node, options): VariableOption {
  return {
    value: node.key,
    label: node.title,
    children: [
      {
        value: 'message',
        label: 'Message',
      },
      {
        value: 'data',
        label: 'Data',
        children: [
          {
            value: 'id',
            label: 'ID',
          },
          {
            value: 'name',
            label: 'Name',
          },
        ],
      },
    ],
  };
}
```

בדרך זו, בצמתים עוקבים, ניתן להשתמש בממשק הבא כדי לבחור מתוכו משתנים:

![משתני תוצאה ממופים](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="הערה"}
כאשר מבנה כלשהו בתוצאה הוא מערך של אובייקטים מקוננים עמוק, ניתן גם להשתמש ב-`children` כדי לתאר את הנתיב, אך הוא אינו יכול לכלול אינדקסים של מערך. זאת מכיוון שבטיפול במשתנים של תהליך העבודה של NocoBase, תיאור נתיב המשתנה עבור מערך של אובייקטים משוטח אוטומטית למערך של ערכים עמוקים בעת השימוש, ולא ניתן לגשת לערך ספציפי לפי האינדקס שלו.
:::

### זמינות הצומת

כברירת מחדל, ניתן להוסיף כל צומת לתהליך עבודה. עם זאת, במקרים מסוימים, צומת עשוי שלא להיות ישים בסוגי תהליכי עבודה או ענפים מסוימים. במצבים כאלה, ניתן להגדיר את זמינות הצומת באמצעות `isAvailable`:

```ts
// הגדרת טיפוס
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // מופע תוסף תהליך עבודה
  engine: WorkflowPlugin;
  // מופע תהליך עבודה
  workflow: object;
  // צומת קודם
  upstream: object;
  // האם זהו צומת ענף (מספר ענף)
  branchIndex: number;
};
```

מתודת `isAvailable` מחזירה `true` אם הצומת זמין, ו-`false` אם אינו זמין. פרמטר ה-`ctx` מכיל את מידע ההקשר של הצומת הנוכחי, שניתן להשתמש בו כדי לקבוע את זמינותו.

אם אין דרישות מיוחדות, אין צורך לממש את מתודת `isAvailable`, שכן צמתים זמינים כברירת מחדל. התרחיש הנפוץ ביותר הדורש תצורה הוא כאשר צומת עשוי להיות פעולה שגוזלת זמן רב ואינו מתאים לביצוע בתהליך עבודה סינכרוני. ניתן להשתמש במתודת `isAvailable` כדי להגביל את השימוש בו. לדוגמה:

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### למידע נוסף

להגדרות של פרמטרים שונים להגדרת סוגי צמתים, עיין בסעיף [הפניה ל-API של תהליך העבודה](https://docs.nocobase.com/api/workflow).