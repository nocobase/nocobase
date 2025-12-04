:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# הקשר בין FlowEngine לתוספים

**FlowEngine** אינו תוסף, אלא **API ליבה** המסופק לתוספים לשימוש, ומחבר בין יכולות הליבה להרחבות עסקיות. ב-NocoBase 2.0, כל ממשקי ה-API מרוכזים ב-FlowEngine, ותוספים יכולים לגשת ל-FlowEngine דרך `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: יכולות גלובליות בניהול מרכזי

FlowEngine מספק **Context** מרכזי המאגד את ממשקי ה-API הנדרשים לתרחישים שונים, לדוגמה:

```ts
class PluginHello extends Plugin {
  async load() {
    // הרחבת נתב (router)
    this.engine.context.router;

    // שליחת בקשה
    this.engine.context.api.request();

    // קשור לבינאום (i18n)
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **הערה**:
> Context בגרסה 2.0 פותר את הבעיות הבאות מגרסה 1.x:
>
> *   Context מפוזר, קריאות לא אחידות
> *   Context אובד בין עצי רינדור (render trees) שונים של React
> *   ניתן לשימוש רק בתוך רכיבי React
>
> לפרטים נוספים, ראו את **פרק FlowContext**.

## כינויי קיצור בתוספים

כדי לפשט קריאות, FlowEngine מספק כינויים מסוימים במופע התוסף:

*   `this.context` ← שווה ערך ל-`this.engine.context`
*   `this.router` ← שווה ערך ל-`this.engine.context.router`

## דוגמה: הרחבת הנתב (Router)

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    this.router.add('root', {
      path: '/',
      element: <div>Hello</div>,
    });
  }
}

// עבור תרחישי דוגמה ובדיקה
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

בדוגמה זו:

*   התוסף מרחיב את הנתיב `/` באמצעות שיטת `this.router.add`;
*   `createMockClient` מספק יישום Mock נקי לדוגמאות ובדיקות קלות;
*   `app.getRootComponent()` מחזיר את רכיב השורש, שניתן להרכיב ישירות לדף.