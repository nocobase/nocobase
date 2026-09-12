---
title: "BaseInterface"
description: "Interface cơ sở của NocoBase Database: định nghĩa kiểu BaseInterface."
keywords: "BaseInterface,interface cơ sở Database,định nghĩa kiểu,NocoBase"
---

# BaseInterface

## Tổng quan

BaseInterface là lớp cơ sở của tất cả các kiểu Interface, bạn có thể tự kế thừa lớp này để triển khai logic Interface tùy chỉnh.

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

## Interface

### toValue(value: string, ctx?: any): Promise<any>

Chuyển chuỗi từ bên ngoài thành giá trị thực tế của interface, giá trị này có thể được truyền trực tiếp vào Repository để thực hiện thao tác ghi.

### toString(value: any, ctx?: any)

Chuyển giá trị thực tế của interface thành kiểu string, kiểu string có thể dùng cho mục đích export, hiển thị.
