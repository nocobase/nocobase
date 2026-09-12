---
title: "Khái niệm cốt lõi FlowModel"
description: "FlowModel là cốt lõi của FlowEngine, quản lý thuộc tính, trạng thái, Flow, render của component, hiểu FlowModel là bước đầu tiên để nắm vững FlowEngine."
keywords: "FlowModel,Cốt lõi FlowEngine,Component model,Quản lý thuộc tính,Mang Flow,Có thể điều phối,NocoBase"
---

# Bắt đầu từ FlowModel

## Tùy chỉnh FlowModel

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

## Các lớp cơ sở FlowModel khả dụng

| Tên lớp cơ sở                    | Mô tả                       |
| ----------------------- | ------------------------ |
| `BlockModel`            | Lớp cơ sở của tất cả Block                  |
| `CollectionBlockModel`  | Block bảng dữ liệu, kế thừa từ BlockModel     |
| `ActionModel`           | Lớp cơ sở của tất cả Action                  |

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

## Render FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```
