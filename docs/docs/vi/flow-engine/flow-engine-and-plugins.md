---
title: "FlowEngine và Plugin"
description: "FlowEngine và Plugin: Cách Plugin đăng ký FlowModel, mở rộng năng lực, tích hợp với hệ thống Plugin NocoBase, cách dùng registerFlowModel."
keywords: "FlowEngine,Plugin,registerFlowModel,Mở rộng Plugin,Hệ thống Plugin NocoBase,NocoBase"
---

# Mối quan hệ giữa FlowEngine và Plugin

**FlowEngine** không phải là Plugin, mà được cung cấp dưới dạng **API kernel** cho Plugin sử dụng, dùng để kết nối năng lực kernel với mở rộng nghiệp vụ.
Trong NocoBase 2.0, tất cả các API đều tập trung tại FlowEngine, Plugin có thể truy cập FlowEngine thông qua `this.engine`.

```ts
class PluginHello extends Plugin {
  async load() {
    this.engine.registerModelLoaders({ ... });
  }
}
```

## Context: Năng lực toàn cục được quản lý tập trung

FlowEngine cung cấp một **Context** tập trung, tổng hợp các API cần cho các tình huống khác nhau, ví dụ:

```ts
class PluginHello extends Plugin {
  async load() {
    // Mở rộng route
    this.engine.context.router;

    // Gửi request
    this.engine.context.api.request();

    // Liên quan đến i18n
    this.engine.context.i18n;
    this.engine.context.t('Hello');
  }
}
```

> **Ghi chú**:
> Context trong 2.0 đã giải quyết các vấn đề sau của 1.x:
>
> * Context phân tán, gọi không thống nhất
> * Mất context giữa các cây render React khác nhau
> * Chỉ có thể dùng trong component React
>
> Xem thêm chi tiết tại **chương FlowContext**.

---

## Bí danh tắt trong Plugin

Để đơn giản hóa việc gọi, FlowEngine cung cấp một số bí danh trên instance Plugin:

* `this.context` → tương đương với `this.engine.context`
* `this.router` → tương đương với `this.engine.context.router`

## Ví dụ: Mở rộng route

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

// Dùng cho ví dụ và tình huống test
const app = createMockClient({
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
```

Trong ví dụ này:

* Plugin mở rộng route đường dẫn `/` thông qua phương thức `this.router.add`;
* `createMockClient` cung cấp một ứng dụng Mock sạch, tiện cho ví dụ và test;
* `app.getRootComponent()` trả về root component, có thể mount trực tiếp lên trang.
