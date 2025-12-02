:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# العلاقة بين FlowEngine والإضافات

**FlowEngine** ليس إضافة، بل هو **واجهة برمجة تطبيقات أساسية (Core API)** تُقدم للإضافات لاستخدامها، لربط الإمكانيات الأساسية بتوسعات الأعمال. في NocoBase 2.0، تتجمع جميع واجهات برمجة التطبيقات (APIs) في FlowEngine، ويمكن للإضافات الوصول إلى FlowEngine عبر `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: الإمكانيات الشاملة المدارة مركزيًا

يوفر FlowEngine **Context** مركزيًا يجمع واجهات برمجة التطبيقات (APIs) المطلوبة لمختلف السيناريوهات، على سبيل المثال:

```ts
class PluginHello extends Plugin {
  async load() {
    // توسيع المسار (Router extension)
    this.engine.context.router;

    // إجراء طلب (Make a request)
    this.engine.context.api.request();

    // متعلق بالتدويل (i18n related)
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **ملاحظة**:
> حل Context في الإصدار 2.0 المشكلات التالية التي كانت موجودة في الإصدار 1.x:
>
> *   تشتت السياق (Context) وعدم توحيد الاستدعاءات.
> *   فقدان السياق بين أشجار عرض React المختلفة.
> *   إمكانية استخدامه فقط داخل مكونات React.
>
> لمزيد من التفاصيل، راجع **فصل FlowContext**.

## أسماء مستعارة مختصرة في الإضافات

لتبسيط الاستدعاءات، يوفر FlowEngine بعض الأسماء المستعارة على مثيل الإضافة:

*   `this.context` ← مكافئ لـ `this.engine.context`
*   `this.router` ← مكافئ لـ `this.engine.context.router`

## مثال: توسيع المسار (Router)

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

// لسيناريوهات الأمثلة والاختبار
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

في هذا المثال:

*   الإضافة وسعت مسار `/` باستخدام طريقة `this.router.add`؛
*   يوفر `createMockClient` تطبيق Mock نظيفًا لتسهيل الأمثلة والاختبار؛
*   تعيد `app.getRootComponent()` المكون الجذري (root component)، والذي يمكن تثبيته مباشرة على الصفحة.