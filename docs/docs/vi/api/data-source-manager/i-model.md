:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
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