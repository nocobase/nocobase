:::tip Thông báo dịch AI
Tài liệu này đã được dịch tự động bằng AI.
:::


# IModel

Giao diện `IModel` định nghĩa các thuộc tính và phương thức cơ bản của một đối tượng model.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Chuyển đổi đối tượng model sang định dạng JSON.