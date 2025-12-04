:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# BaseInterface

## Tổng quan

BaseInterface là lớp cơ sở cho tất cả các loại Interface. Người dùng có thể kế thừa lớp này để triển khai logic Interface tùy chỉnh của riêng mình.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Logic toValue tùy chỉnh
  }

  toString(value: any, ctx?: any) {
    // Logic toString tùy chỉnh
  }
}
// Đăng ký Interface
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

Chuyển đổi một chuỗi bên ngoài thành giá trị thực tế của interface. Giá trị này có thể được truyền trực tiếp cho Repository để thực hiện các thao tác ghi.

### toString(value: any, ctx?: any)

Chuyển đổi giá trị thực tế của interface thành kiểu chuỗi (string). Kiểu chuỗi này có thể được sử dụng cho mục đích xuất dữ liệu hoặc hiển thị.