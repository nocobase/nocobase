:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/flow-engine/runjs-extension-points).
:::

# נקודות הרחבה לתוסף RunJS (תיעוד ctx / קטעי קוד / מיפוי סצנות)

כאשר תוסף מוסיף או מרחיב יכולות RunJS, מומלץ לרשום את "מיפוי ההקשר / תיעוד `ctx` / קוד לדוגמה" דרך **נקודות הרחבה רשמיות**, כדי ש:

- ה-CodeEditor יוכל לספק השלמה אוטומטית עבור `ctx.xxx.yyy`.
- ה-AI coding יוכל לקבל הפניות API מובנות של `ctx` בתוספת דוגמאות.

פרק זה מציג שתי נקודות הרחבה:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

משמש לרישום "תרומות" (contributions) של RunJS. שימושים טיפוסיים כוללים:

- הוספה/דריסה של מיפויי `RunJSContextRegistry` (בין `modelClass` ל-`RunJSContext`, כולל `scenes`).
- הרחבת `RunJSDocMeta` (הסברים/דוגמאות/תבניות השלמה עבור ה-API של `ctx`) עבור `FlowRunJSContext` או `RunJSContext` מותאם אישית.

### תיאור התנהגות

- התרומות מבוצעות באופן מרוכז במהלך שלב ה-`setupRunJSContexts()`.
- אם `setupRunJSContexts()` כבר הושלם, **רישום מאוחר יבוצע באופן מיידי** (אין צורך להריץ מחדש את ה-setup).
- כל תרומה תבוצע **לכל היותר פעם אחת** עבור כל `RunJSVersion`.

### דוגמה: הוספת הקשר מודל המאפשר כתיבת JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) תיעוד/השלמה של ctx (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS context',
    properties: {
      myPlugin: {
        description: 'My plugin namespace',
        detail: 'object',
        properties: {
          hello: {
            description: 'Say hello',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) מיפוי model -> context (הסצנה משפיעה על השלמות העורך וסינון קטעי קוד)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

משמש לרישום קטעי קוד (snippets) לדוגמה עבור RunJS, המשמשים עבור:

- השלמת קטעי קוד ב-CodeEditor.
- חומרי עזר/דוגמאות עבור AI coding (ניתן לסינון לפי סצנה/גרסה/שפה).

### המלצה למתן שמות ל-ref

מומלץ להשתמש במבנה: `plugin/<pluginName>/<topic>`, לדוגמה:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

יש להימנע מהתנגשויות עם מרחבי השמות של הליבה כגון `global/*` או `scene/*`.

### אסטרטגיית התנגשויות

- כברירת מחדל, ערכי `ref` קיימים אינם נדרסים (מוחזר `false` מבלי לזרוק שגיאה).
- כדי לדרוס במפורש, יש להעביר `{ override: true }`.

### דוגמה: רישום קטע קוד (snippet)

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hello (My Plugin)',
    description: 'Minimal example for my plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// My plugin snippet
ctx.message.success('Hello from plugin');
`,
  },
}));
```

## 3. שיטות מומלצות (Best Practices)

- **תחזוקה בשכבות של תיעוד + קטעי קוד**:
  - `RunJSDocMeta`: תיאורים/תבניות השלמה (קצר, מובנה).
  - Snippets: דוגמאות ארוכות (ניתנות לשימוש חוזר, ניתנות לסינון לפי סצנה/גרסה).
- **הימנעות מ-prompts ארוכים מדי**: הדוגמאות צריכות להיות תמציתיות; יש לתת עדיפות ל"תבניות מינימליות להרעלה".
- **עדיפות לסצנות**: אם קוד ה-JS שלכם רץ בעיקר בסצנות כמו טפסים או טבלאות, ודאו ששדה ה-`scenes` ממולא כראוי כדי לשפר את הרלוונטיות של ההשלמות והדוגמאות.

## 4. הסתרת השלמות על בסיס ה-ctx בפועל: `hidden(ctx)`

ממשקי API מסוימים של `ctx` הם תלויי הקשר באופן מובהק (לדוגמה, `ctx.popup` זמין רק כאשר חלון קופץ או מגירה פתוחים). אם ברצונכם להסתיר ממשקי API לא זמינים אלו במהלך ההשלמה, ניתן להגדיר `hidden(ctx)` עבור הערך המתאים ב-`RunJSDocMeta`:

- החזרת `true`: מסתירה את הצומת הנוכחי ואת עץ המשנה שלו.
- החזרת `string[]`: מסתירה תתי-נתיבים ספציפיים תחת הצומת הנוכחי (תומך בהחזרת מספר נתיבים; הנתיבים הם יחסיים; עצי משנה מוסתרים על בסיס התאמת קידומת).

`hidden(ctx)` תומך ב-`async`: ניתן להשתמש ב-`await ctx.getVar('ctx.xxx')` כדי לקבוע נראות (לפי שיקול דעתו של המשתמש). מומלץ לשמור על לוגיקה זו מהירה וללא תופעות לוואי (למשל, להימנע מבקשות רשת).

דוגמה: הצגת השלמות עבור `ctx.popup.*` רק כאשר `popup.uid` קיים.

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'Popup uid',
      },
    },
  },
});
```

דוגמה: ה-popup זמין אך חלק מתתי-הנתיבים מוסתרים (נתיבים יחסיים בלבד; למשל, הסתרת `record` ו-`parent.record`).

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'Popup uid',
        record: 'Popup record',
        parent: {
          properties: {
            record: 'Parent record',
          },
        },
      },
    },
  },
});
```

הערה: ה-CodeEditor תמיד מפעיל סינון השלמות המבוסס על ה-`ctx` בפועל (fail-open, אינו זורק שגיאות).

## 5. הזרקת `info/meta` בזמן ריצה ו-API למידע על ההקשר (עבור השלמות ומודלי שפה)

בנוסף לתחזוקת תיעוד `ctx` באופן סטטי דרך `FlowRunJSContext.define()`, ניתן גם להזריק **info/meta** בזמן ריצה דרך `FlowContext.defineProperty/defineMethod`. לאחר מכן ניתן להוציא מידע הקשר **שניתן לסריאליזציה** עבור CodeEditor או מודלי שפה (LLMs) באמצעות ממשקי ה-API הבאים:

- `await ctx.getApiInfos(options?)`: מידע API סטטי.
- `await ctx.getVarInfos(options?)`: מידע על מבנה משתנים (מקורו ב-`meta`, תומך בהרחבת path/maxDepth).
- `await ctx.getEnvInfos()`: תצלום מצב (snapshot) של סביבת זמן הריצה.

### 5.1 `defineMethod(name, fn, info?)`

`info` תומך בערכים הבאים (כולם אופציונליים):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (בסגנון JSDoc)

> הערה: `getApiInfos()` מוציא תיעוד API סטטי ולא יכלול שדות כמו `deprecated`, `disabled`, או `disabledReason`.

דוגמה: אספקת קישורי תיעוד עבור `ctx.refreshTargets()`.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Refresh data of the target blocks',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: משמש עבור ממשק המשתמש של בורר המשתנים (`getPropertyMetaTree` / `FlowContextSelector`). הוא קובע נראות, מבנה עץ, השבתה וכו' (תומך בפונקציות/async).
  - שדות נפוצים: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: משמש עבור תיעוד API סטטי (`getApiInfos`) ותיאורים עבור מודלי שפה. הוא אינו משפיע על ממשק המשתמש של בורר המשתנים (תומך בפונקציות/async).
  - שדות נפוצים: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

כאשר מסופק רק `meta` (ללא `info`):

- `getApiInfos()` לא יחזיר מפתח זה (מכיוון שתיעוד API סטטי אינו מוסק מ-`meta`).
- `getVarInfos()` יבנה את מבנה המשתנים על בסיס `meta` (משמש עבור בוררי משתנים/עצי משתנים דינמיים).

### 5.3 API למידע על ההקשר

משמש להוצאת "מידע על יכולות ההקשר הזמינות".

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // ניתן לשימוש ישירות ב-await ctx.getVar(getVar), מומלץ להתחיל ב-"ctx."
  value?: any; // ערך סטטי מפוענח (ניתן לסריאליזציה, מוחזר רק כאשר ניתן להסיקו)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // תיעוד סטטי (רמה עליונה)
type FlowContextVarInfos = Record<string, any>; // מבנה משתנים (ניתן להרחבה לפי path/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

פרמטרים נפוצים:

- `getApiInfos({ version })`: גרסת תיעוד RunJS (ברירת מחדל היא `v1`).
- `getVarInfos({ path, maxDepth })`: חיתוך ועומק הרחבה מקסימלי (ברירת מחדל היא 3).

הערה: התוצאות המוחזרות על ידי ממשקי ה-API שלעיל אינן מכילות פונקציות ומתאימות לסריאליזציה ישירה למודלי שפה (LLMs).

### 5.4 `await ctx.getVar(path)`

כאשר יש לכם "מחרוזת נתיב משתנה" (למשל, מהגדרה או מקלט משתמש) ואתם רוצים לקבל את ערך זמן הריצה של אותו משתנה ישירות, השתמשו ב-`getVar`:

- דוגמה: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` הוא נתיב ביטוי המתחיל ב-`.ctx` (למשל, `ctx.record.id` / `ctx.record.roles[0].id`).

בנוסף: מתודות או מאפיינים המתחילים בקו תחתון `_` נחשבים לחברים פרטיים ולא יופיעו בפלט של `getApiInfos()` או `getVarInfos()`.