:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# כתבו את תוסף הבלוק הראשון שלכם

לפני שמתחילים, מומלץ לקרוא את "[כתבו את התוסף הראשון שלכם](../plugin-development/write-your-first-plugin.md)" כדי ללמוד כיצד ליצור תוסף בסיסי במהירות. לאחר מכן, נרחיב אותו על ידי הוספת פונקציונליות בלוק פשוטה.

## שלב 1: צרו קובץ מודל בלוק

צרו קובץ חדש בספריית התוסף: `client/models/SimpleBlockModel.tsx`

## שלב 2: כתבו את תוכן המודל

הגדירו ויישמו מודל בלוק בסיסי בקובץ, כולל לוגיקת הרינדור שלו:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## שלב 3: רשמו את מודל הבלוק

ייצאו את המודל החדש שנוצר בקובץ `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## שלב 4: הפעילו וחוו את הבלוק

לאחר הפעלת התוסף, תראו את האפשרות החדשה **Hello block** בתפריט הנפתח של "הוסף בלוק".

הדגמה:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## שלב 5: הוסיפו יכולת תצורה לבלוק

לאחר מכן, נוסיף פונקציונליות ניתנת להגדרה לבלוק באמצעות **Flow**, מה שיאפשר למשתמשים לערוך את תוכן הבלוק בממשק.

המשיכו לערוך את הקובץ `SimpleBlockModel.tsx`:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

הדגמה:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## סיכום

מאמר זה הציג כיצד ליצור תוסף בלוק פשוט, כולל:

- כיצד להגדיר וליישם מודל בלוק
- כיצד לרשום מודל בלוק
- כיצד להוסיף פונקציונליות ניתנת להגדרה באמצעות Flow

הפניה לקוד המקור המלא: [דוגמת בלוק פשוט](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)