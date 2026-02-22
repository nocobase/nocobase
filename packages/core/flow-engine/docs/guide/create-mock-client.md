# createMockClient

在示例和测试时，一般建议通过 createMockClient 快速构建 Mock 应用。Mock 应用是个干净的没有激活任何插件的空应用，仅用于示例和测试。

例如以下示例：

```tsx
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// 用于示例和测试场景
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

createMockClient 提供了 apiMock 构建 Mock 接口数据

```tsx
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

// 用于示例和测试场景
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

基于 createMockClient，我们就可以快速的通过插件扩展功能了，Plugin 常用的 API 包括

- plugin.router：扩展路由
- plugin.engine：前端引擎（NocoBase 2.0）
- plugin.context：上下文（NocoBase 2.0）

示例1：通过 router 添加一个路由。

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

更多内容我们在后续章节里介绍。

