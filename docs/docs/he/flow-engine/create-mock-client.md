:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# createMockClient

בדרך כלל, לצורך דוגמאות ובדיקות, מומלץ לבנות במהירות אפליקציית Mock באמצעות `createMockClient`. אפליקציית Mock היא אפליקציה נקייה וריקה, שלא הופעלו בה תוספים כלשהם, והיא מיועדת אך ורק לדוגמאות ובדיקות.

לדוגמה:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// עבור תרחישי דוגמה ובדיקה
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` מספק את `apiMock` כדי לבנות נתוני Mock API.

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    const { data } = await this.context.api.request({
      method: 'get',
      url: 'users',
    });
  }
}

// עבור תרחישי דוגמה ובדיקה
const app = createMockClient({
  plugins: [PluginHelloModel],
});

app.apiMock.onGet('users').reply(200, {
  data: {
    id: 1,
    name: 'John Doe',
  },
});

export default app.getRootComponent();
```

בהתבסס על `createMockClient`, אנו יכולים להרחיב במהירות פונקציונליות באמצעות תוספים. ממשקי API נפוצים עבור `Plugin` כוללים:

- `plugin.router`: הרחבת נתיבים (routes)
- `plugin.engine`: מנוע צד-לקוח (NocoBase 2.0)
- `plugin.context`: הקשר (Context) (NocoBase 2.0)

דוגמה 1: הוספת נתיב (route) באמצעות ה-router.

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

נציג תוכן נוסף בפרקים הבאים.