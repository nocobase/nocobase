---
title: "Công cụ kiểm thử createMockClient"
description: "createMockClient tạo Mock client để kiểm thử FlowEngine, dùng cho kiểm thử đơn vị, Storybook, phát triển ví dụ, hỗ trợ apiMock để xây dựng interface Mock."
keywords: "createMockClient,Mock client,Kiểm thử đơn vị,Storybook,apiMock,Kiểm thử FlowEngine,NocoBase"
---

# createMockClient

Khi làm ví dụ và kiểm thử, thường khuyến nghị dùng createMockClient để xây dựng nhanh ứng dụng Mock. Ứng dụng Mock là một ứng dụng sạch không kích hoạt bất kỳ Plugin nào, chỉ dùng cho ví dụ và kiểm thử.

Ví dụ:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Dùng cho ví dụ và tình huống kiểm thử
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

createMockClient cung cấp apiMock để xây dựng dữ liệu interface Mock

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

// Dùng cho ví dụ và tình huống kiểm thử
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

Dựa trên createMockClient, chúng ta có thể nhanh chóng mở rộng chức năng thông qua Plugin, các API phổ biến của Plugin bao gồm

- plugin.router: Mở rộng route
- plugin.engine: Engine frontend (NocoBase 2.0)
- plugin.context: Context (NocoBase 2.0)

Ví dụ 1: Thêm một route qua router.

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

// Dùng cho ví dụ và tình huống kiểm thử
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Các nội dung khác chúng tôi sẽ giới thiệu trong các chương tiếp theo.
