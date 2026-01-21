:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Đăng ký FlowModel

## Bắt đầu với FlowModel tùy chỉnh

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

## Các lớp cơ sở FlowModel có sẵn

| Tên lớp cơ sở           | Mô tả                                 |
| ----------------------- | ------------------------------------- |
| `BlockModel`            | Lớp cơ sở cho tất cả các block        |
| `CollectionBlockModel`  | Block của bộ sưu tập, kế thừa từ BlockModel |
| `ActionModel`           | Lớp cơ sở cho tất cả các hành động    |

## Đăng ký FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```