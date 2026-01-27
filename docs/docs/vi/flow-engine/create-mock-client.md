:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# createMockClient

Trong các ví dụ và khi viết kiểm thử, bạn nên sử dụng `createMockClient` để nhanh chóng xây dựng một ứng dụng Mock. Ứng dụng Mock là một ứng dụng trống, sạch sẽ, không kích hoạt bất kỳ plugin nào, chỉ dùng cho mục đích minh họa và kiểm thử.

Ví dụ:

```tsx pure
import { createMockClient, Plugin } from '@nocobase/client';

class PluginHelloModel extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {}
}

// Dùng cho các kịch bản ví dụ và kiểm thử
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

`createMockClient` cung cấp `apiMock` để xây dựng dữ liệu API giả lập (mock).

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

// Dùng cho các kịch bản ví dụ và kiểm thử
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

Dựa trên `createMockClient`, chúng ta có thể nhanh chóng mở rộng chức năng thông qua các plugin. Các API thường dùng của `Plugin` bao gồm:

- plugin.router: Mở rộng các route
- plugin.engine: Engine frontend (NocoBase 2.0)
- plugin.context: Ngữ cảnh (NocoBase 2.0)

Ví dụ 1: Thêm một route thông qua `router`.

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

// Dùng cho các kịch bản ví dụ và kiểm thử
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Chúng tôi sẽ giới thiệu thêm nội dung trong các chương tiếp theo.