:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# createMockClient

عند إعداد الأمثلة والاختبارات، يُوصى عادةً بإنشاء تطبيق وهمي (Mock application) بسرعة باستخدام `createMockClient`. التطبيق الوهمي هو تطبيق نظيف وفارغ، لا يحتوي على أي إضافات (plugins) مفعلة، ومخصص فقط للأمثلة والاختبارات.

على سبيل المثال:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// مخصص لسيناريوهات الأمثلة والاختبارات
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

توفر `createMockClient` الأداة `apiMock` لبناء بيانات واجهة برمجة تطبيقات وهمية (Mock API data).

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

// مخصص لسيناريوهات الأمثلة والاختبارات
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

بالاعتماد على `createMockClient`، يمكننا توسيع الوظائف بسرعة عبر الإضافات (plugins). تشمل واجهات برمجة التطبيقات (APIs) الشائعة للإضافة (Plugin) ما يلي:

-   `plugin.router`: لتوسيع المسارات (routes)
-   `plugin.engine`: محرك الواجهة الأمامية (NocoBase 2.0)
-   `plugin.context`: السياق (Context) (NocoBase 2.0)

المثال 1: إضافة مسار (route) عبر الموجه (router).

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

// مخصص لسيناريوهات الأمثلة والاختبارات
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

سنتناول المزيد من المحتوى في الفصول اللاحقة.