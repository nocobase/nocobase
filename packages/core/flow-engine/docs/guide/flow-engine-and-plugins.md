# FlowEngine 与插件的关系

**FlowEngine** 并不是插件，而是作为 **内核 API** 提供给插件使用，用于衔接内核能力与业务扩展。
NocoBase 2.0 里，所有的 API 都汇聚在 FlowEngine 这里，插件可以通过 `this.engine` 访问 FlowEngine。

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context：集中管理的全局能力

FlowEngine 提供了一个中心化的 **Context**，将各种场景所需的 API 汇聚在一起，例如：

```ts
class PluginHello extends Plugin {
  async load() {
    // 路由扩展
    this.engine.context.router;

    // 发起请求
    this.engine.context.api.request();

    // 国际化相关
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **备注**：
> Context 在 2.0 中解决了以下 1.x 的问题：
>
> * 上下文分散，调用不统一
> * 不同 React 渲染树之间会丢失上下文
> * 只能在 React 组件内使用
>
> 更多内容详见 **FlowContext 章节**。

---

## 插件中的快捷别名

为了简化调用，FlowEngine 在插件实例上提供了部分别名：

* `this.context` → 等价于 `this.engine.context`
* `this.router` → 等价于 `this.engine.context.router`

## 示例：扩展路由

```tsx
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

// 用于示例和测试场景
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

在这个示例中：

* 插件通过 `this.router.add` 方法扩展了 `/` 路径的路由；
* `createMockClient` 提供了一个干净的 Mock 应用，便于示例和测试；
* `app.getRootComponent()` 返回根组件，可以直接挂载到页面。
