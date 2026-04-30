---
title: "Đăng ký FlowModel"
description: "Đăng ký FlowModel: FlowEngine.registerFlowModel đăng ký FlowModel vào engine, để Plugin và trang sử dụng, cách dùng registerFlowModel."
keywords: "Đăng ký FlowModel,registerFlowModel,FlowEngine,Đăng ký Plugin,Đăng ký FlowModel,NocoBase"
---

# Đăng ký FlowModel

## Bắt đầu từ FlowModel tùy chỉnh

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloModel.</p>
      </div>
    );
  }
}
```

```tsx file="./_demos/register-flow-model.tsx" preview
```

## Các lớp cơ sở FlowModel khả dụng

| Tên lớp cơ sở               | Mô tả                          |
| ---------------------- | ----------------------------- |
| `BlockModel`           | Lớp cơ sở của tất cả Block                |
| `CollectionBlockModel` | Block bảng dữ liệu, kế thừa từ BlockModel |
| `ActionModel`          | Lớp cơ sở của tất cả Action                |

## Đăng ký FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // Dynamic import, chỉ tải module tương ứng khi model này được dùng đến lần đầu
        loader: () => import('./HelloModel'),
      },
    });
  }
}
```
