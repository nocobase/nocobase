:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# הפניה ל-API

## צד השרת

ממשקי ה-API הזמינים במבנה חבילת צד השרת מוצגים בקוד הבא:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

מחלקה של תוסף תהליך עבודה.

בדרך כלל, בזמן ריצת היישום, תוכלו לקרוא ל-`app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` בכל מקום שבו ניתן לגשת למופע היישום `app`, כדי לקבל את מופע תוסף תהליך העבודה (להלן יכונה `plugin`).

#### `registerTrigger()`

מרחיב ורושם סוג טריגר חדש.

**חתימה**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**פרמטרים**

| פרמטר | סוג | תיאור |
| --------- | --------------------------- | ---------------- |
| `type` | `string` | מזהה סוג הטריגר |
| `trigger` | `typeof Trigger \| Trigger` | סוג הטריגר או מופע שלו |

**דוגמה**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // מפעיל את תהליך העבודה
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // מאזין לאירוע כלשהו כדי להפעיל את תהליך העבודה
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // מסיר את המאזין
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // מקבל את מופע תוסף תהליך העבודה
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // רושם את הטריגר
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

מרחיב ורושם סוג צומת חדש.

**חתימה**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**פרמטרים**

| פרמטר | סוג | תיאור |
| ------------- | ----------------------------------- | -------------- |
| `type` | `string` | מזהה סוג ההוראה |
| `instruction` | `typeof Instruction \| Instruction` | סוג ההוראה או מופע שלה |

**דוגמה**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // מקבל את מופע תוסף תהליך העבודה
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // רושם את ההוראה
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

מפעיל תהליך עבודה ספציפי. משמש בעיקר בטריגרים מותאמים אישית, כדי להפעיל את תהליך העבודה המתאים כאשר מאזינים לאירוע מותאם אישית ספציפי.

**חתימה**

`trigger(workflow: Workflow, context: any)`

**פרמטרים**
| פרמטר | סוג | תיאור |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | אובייקט תהליך העבודה להפעלה |
| `context` | `object` | נתוני הקשר המסופקים בזמן ההפעלה |

:::info{title=טיפ}
`context` הוא כרגע פריט חובה. אם לא יסופק, תהליך העבודה לא יופעל.
:::

**דוגמה**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // רושם אירוע
    this.timer = setInterval(() => {
      // מפעיל את תהליך העבודה
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

מחדש את ביצוע תהליך עבודה שהושהה באמצעות משימת צומת ספציפית.

- רק תהליכי עבודה הנמצאים במצב המתנה (`EXECUTION_STATUS.STARTED`) יכולים להתחדש.
- רק משימות צומת הנמצאות במצב ממתין (`JOB_STATUS.PENDING`) יכולות להתחדש.

**חתימה**

`resume(job: JobModel)`

**פרמטרים**

| פרמטר | סוג | תיאור |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | אובייקט המשימה המעודכן |

:::info{title=טיפ}
אובייקט המשימה המועבר הוא בדרך כלל אובייקט מעודכן, ובדרך כלל הסטטוס שלו יעודכן לערך שאינו `JOB_STATUS.PENDING`, אחרת הוא ימשיך להמתין.
:::

**דוגמה**

לפרטים נוספים, ראו [קוד המקור](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

מחלקה בסיסית לטריגרים, המשמשת להרחבת סוגי טריגרים מותאמים אישית.

| פרמטר | סוג | תיאור |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | בנאי |
| `on?` | `(workflow: WorkflowModel): void` | מטפל אירועים לאחר הפעלת תהליך עבודה |
| `off?` | `(workflow: WorkflowModel): void` | מטפל אירועים לאחר השבתת תהליך עבודה |

`on`/`off` משמשים לרישום/ביטול רישום של מאזיני אירועים כאשר תהליך עבודה מופעל/מושבת. הפרמטר המועבר הוא מופע תהליך העבודה המתאים לטריגר, וניתן לטפל בו בהתאם להגדרות. סוגי טריגרים מסוימים שכבר מאזינים לאירועים באופן גלובלי, אינם חייבים לממש את שתי השיטות הללו. לדוגמה, בטריגר מתוזמן, ניתן לרשום טיימר ב-`on` ולבטל את רישומו ב-`off`.

### `Instruction`

מחלקה בסיסית לסוגי הוראות, המשמשת להרחבת סוגי הוראות מותאמים אישית.

| פרמטר | סוג | תיאור |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | בנאי |
| `run` | `Runner` | לוגיקת ביצוע לכניסה ראשונה לצומת |
| `resume?` | `Runner` | לוגיקת ביצוע לכניסה לצומת לאחר חידוש משיבוש |
| `getScope?` | `(node: FlowNodeModel, data: any, processor: Processor): any` | מספק את תוכן המשתנים המקומיים עבור הענף שנוצר על ידי הצומת המתאים |

**סוגים קשורים**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

עבור `getScope`, תוכלו לעיין ב[מימוש צומת הלולאה](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), המשמש לספק תוכן משתנים מקומיים עבור ענפים.

### `EXECUTION_STATUS`

טבלת קבועים עבור סטטוסי תוכנית ביצוע של תהליך עבודה, המשמשת לזיהוי הסטטוס הנוכחי של תוכנית הביצוע המתאימה.

| שם קבוע | משמעות |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING` | בתור |
| `EXECUTION_STATUS.STARTED` | בביצוע |
| `EXECUTION_STATUS.RESOLVED` | הושלם בהצלחה |
| `EXECUTION_STATUS.FAILED` | נכשל |
| `EXECUTION_STATUS.ERROR` | שגיאת ביצוע |
| `EXECUTION_STATUS.ABORTED` | הופסק |
| `EXECUTION_STATUS.CANCELED` | בוטל |
| `EXECUTION_STATUS.REJECTED` | נדחה |
| `EXECUTION_STATUS.RETRY_NEEDED` | לא בוצע בהצלחה, נדרש ניסיון חוזר |

למעט שלושת הראשונים, כל השאר מייצגים מצב כשל, אך יכולים לשמש לתיאור סיבות שונות לכשל.

### `JOB_STATUS`

טבלת קבועים עבור סטטוסי משימות צומת בתהליך עבודה, המשמשת לזיהוי הסטטוס הנוכחי של משימת הצומת המתאימה. הסטטוס שנוצר על ידי הצומת משפיע גם על סטטוס תוכנית הביצוע כולה.

| שם קבוע | משמעות |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING` | ממתין: הביצוע הגיע לצומת זה, אך ההוראה דורשת השהיה והמתנה |
| `JOB_STATUS.RESOLVED` | הושלם בהצלחה |
| `JOB_STATUS.FAILED` | נכשל: ביצוע צומת זה לא עמד בתנאים שהוגדרו |
| `JOB_STATUS.ERROR` | שגיאה: אירעה שגיאה שלא נתפסה במהלך ביצוע צומת זה |
| `JOB_STATUS.ABORTED` | הופסק: ביצוע צומת זה הופסק על ידי לוגיקה אחרת לאחר שהיה במצב המתנה |
| `JOB_STATUS.CANCELED` | בוטל: ביצוע צומת זה בוטל ידנית לאחר שהיה במצב המתנה |
| `JOB_STATUS.REJECTED` | נדחה: המשך צומת זה נדחה ידנית לאחר שהיה במצב המתנה |
| `JOB_STATUS.RETRY_NEEDED` | לא בוצע בהצלחה, נדרש ניסיון חוזר |

## צד הלקוח

ממשקי ה-API הזמינים במבנה חבילת צד הלקוח מוצגים בקוד הבא:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

רושם את לוח התצורה המתאים לסוג הטריגר.

**חתימה**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**פרמטרים**

| פרמטר | סוג | תיאור |
| --------- | --------------------------- | ------------------------------------ |
| `type` | `string` | מזהה סוג הטריגר, תואם למזהה המשמש לרישום |
| `trigger` | `typeof Trigger \| Trigger` | סוג הטריגר או מופע שלו |

#### `registerInstruction()`

רושם את לוח התצורה המתאים לסוג הצומת.

**חתימה**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**פרמטרים**

| פרמטר | סוג | תיאור |
| ------------- | ----------------------------------- | ---------------------------------- |
| `type` | `string` | מזהה סוג הצומת, תואם למזהה המשמש לרישום |
| `instruction` | `typeof Instruction \| Instruction` | סוג הצומת או מופע שלו |

#### `registerInstructionGroup()`

רושם קבוצת סוגי צמתים. NocoBase מספקת כברירת מחדל 4 קבוצות סוגי צמתים:

*   `'control'`: בקרת זרימה
*   `'collection'`: פעולות על אוספים
*   `'manual'`: טיפול ידני
*   `'extended'`: הרחבות אחרות

אם אתם צריכים להרחיב קבוצות נוספות, תוכלו להשתמש בשיטה זו לרישום.

**חתימה**

`registerInstructionGroup(type: string, group: { label: string }): void`

**פרמטרים**

| פרמטר | סוג | תיאור |
| --------- | ----------------- | ----------------------------- |
| `type` | `string` | מזהה קבוצת הצמתים, תואם למזהה המשמש לרישום |
| `group` | `{ label: string }` | מידע על הקבוצה, כרגע כולל רק את הכותרת |

**דוגמה**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

מחלקה בסיסית לטריגרים, המשמשת להרחבת סוגי טריגרים מותאמים אישית.

| פרמטר | סוג | תיאור |
| --------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `title` | `string` | שם סוג הטריגר |
| `fieldset` | `{ [key: string]: ISchema }` | אוסף פריטי תצורת טריגר |
| `scope?` | `{ [key: string]: any }` | אוסף אובייקטים שעשויים לשמש בסכימת פריטי התצורה |
| `components?` | `{ [key: string]: React.FC }` | אוסף רכיבים שעשויים לשמש בסכימת פריטי התצורה |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | גשש ערכים לנתוני הקשר של הטריגר |

- אם `useVariables` אינו מוגדר, פירוש הדבר שסוג טריגר זה אינו מספק פונקציית אחזור ערכים, ולא ניתן לבחור את נתוני ההקשר של הטריגר בצמתי תהליך העבודה.

### `Instruction`

מחלקה בסיסית להוראות, המשמשת להרחבת סוגי צמתים מותאמים אישית.

| פרמטר | סוג | תיאור |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group` | `string` | מזהה קבוצת סוגי הצמתים, האפשרויות הזמינות כרגע: `control` / `collection` / `manual` / `extended` |
| `fieldset` | `Record<string, ISchema>` | אוסף פריטי תצורת צומת |
| `scope?` | `Record<string, Function>` | אוסף אובייקטים שעשויים לשמש בסכימת פריטי התצורה |
| `components?` | `Record<string, React.FC>` | אוסף רכיבים שעשויים לשמש בסכימת פריטי התצורה |
| `Component?` | `React.FC` | רכיב רינדור מותאם אישית לצומת |
| `useVariables?` | `(node, options: UseVariableOptions) => VariableOption` | שיטה עבור הצומת לספק אפשרויות משתני צומת |
| `useScopeVariables?` | `(node, options?) => VariableOptions` | שיטה עבור הצומת לספק אפשרויות משתנים מקומיים לענף |
| `useInitializers?` | `(node) => SchemaInitializerItemType` | שיטה עבור הצומת לספק אפשרויות אתחול |
| `isAvailable?` | `(ctx: NodeAvailableContext) => boolean` | שיטה לקביעה אם הצומת זמין |

**סוגים קשורים**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- אם `useVariables` אינו מוגדר, פירוש הדבר שסוג צומת זה אינו מספק פונקציית אחזור ערכים, ולא ניתן לבחור את נתוני התוצאה של צומת מסוג זה בצמתי תהליך העבודה. אם ערך התוצאה הוא יחיד (לא ניתן לבחירה), ניתן להחזיר תוכן סטטי המבטא את המידע המתאים (ראו: [קוד המקור של צומת חישוב](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). אם נדרשת בחירה (לדוגמה, מאפיין מסוים באובייקט), ניתן להתאים אישית את פלט רכיב הבחירה המתאים (ראו: [קוד המקור של צומת יצירת נתונים](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` הוא רכיב רינדור מותאם אישית עבור הצומת. כאשר רינדור הצומת המוגדר כברירת מחדל אינו מספק, ניתן להחליף אותו לחלוטין ולבצע רינדור תצוגת צומת מותאמת אישית. לדוגמה, אם ברצונכם לספק כפתורי פעולה נוספים או אינטראקציות אחרות עבור צומת ההתחלה של סוג ענף, עליכם להשתמש בשיטה זו (ראו: [קוד המקור של ענף מקבילי](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` משמש לספק שיטה לאתחול בלוקים. לדוגמה, בצומת ידני, ניתן לאתחל בלוקי משתמש קשורים בהתבסס על צמתי upstream. אם שיטה זו מסופקת, היא תהיה זמינה בעת אתחול בלוקים בתצורת ממשק הצומת הידני (ראו: [קוד המקור של צומת יצירת נתונים](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` משמש בעיקר לקבוע אם ניתן להשתמש (להוסיף) בצומת בסביבה הנוכחית. הסביבה הנוכחית כוללת את תהליך העבודה הנוכחי, צמתי upstream ואינדקס הענף הנוכחי, ועוד.