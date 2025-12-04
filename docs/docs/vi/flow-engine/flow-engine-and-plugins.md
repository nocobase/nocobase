:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Mối quan hệ giữa FlowEngine và các plugin

**FlowEngine** không phải là một plugin, mà là một **API cốt lõi** được cung cấp cho các plugin sử dụng, nhằm kết nối các khả năng cốt lõi với các tiện ích mở rộng nghiệp vụ.
Trong NocoBase 2.0, tất cả các API đều được tập trung tại FlowEngine, và các plugin có thể truy cập FlowEngine thông qua `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModels({ ... });
  }
}
```

## Context: Các khả năng toàn cục được quản lý tập trung

FlowEngine cung cấp một **Context** tập trung, tập hợp các API cần thiết cho nhiều tình huống khác nhau, ví dụ:

```ts
class PluginHello extends Plugin {
  async load() {
    // Mở rộng định tuyến
    this.engine.context.router;

    // Thực hiện yêu cầu
    this.engine.context.api.request();

    // Liên quan đến i18n
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Lưu ý**:
> Context trong 2.0 đã giải quyết các vấn đề sau từ 1.x:
>
> *   Context phân tán, việc gọi không nhất quán
> *   Context bị mất giữa các cây kết xuất React khác nhau
> *   Chỉ có thể sử dụng bên trong các component React
>
> Xem thêm chi tiết trong **chương FlowContext**.

---

## Các bí danh rút gọn trong plugin

Để đơn giản hóa việc gọi, FlowEngine cung cấp một số bí danh trên thể hiện của plugin:

*   `this.context` → tương đương với `this.engine.context`
*   `this.router` → tương đương với `this.engine.context.router`

## Ví dụ: Mở rộng định tuyến

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

// Dành cho các tình huống ví dụ và thử nghiệm
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Trong ví dụ này:

*   Plugin đã mở rộng định tuyến cho đường dẫn `/` bằng phương thức `this.router.add`;
*   `createMockClient` cung cấp một ứng dụng Mock sạch, thuận tiện cho việc minh họa và thử nghiệm;
*   `app.getRootComponent()` trả về component gốc, có thể gắn trực tiếp vào trang.