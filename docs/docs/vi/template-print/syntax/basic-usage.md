---
title: "Template In ấn - Cách dùng cơ bản"
description: "Cú pháp cơ bản của Template In ấn: thay thế placeholder, thay thế dữ liệu, chèn dữ liệu động."
keywords: "Template In ấn,placeholder,Cú pháp,NocoBase"
---

## Cách dùng cơ bản

Plugin Template In ấn cung cấp nhiều loại cú pháp, có thể chèn linh hoạt dữ liệu động và cấu trúc logic vào Template. Dưới đây là mô tả cú pháp chi tiết và ví dụ sử dụng.

### Thay thế cơ bản

Sử dụng placeholder định dạng `{d.xxx}` để thay thế dữ liệu. Ví dụ:

- `{d.title}`: Đọc trường `title` trong dataset.
- `{d.date}`: Đọc trường `date` trong dataset.

**Ví dụ**:

Nội dung Template:
```
Kính chào quý Khách hàng!

Cảm ơn bạn đã mua Sản phẩm của chúng tôi: {d.productName}.
Mã Đơn hàng: {d.orderId}
Ngày Đơn hàng: {d.orderDate}

Chúc bạn sử dụng vui vẻ!
```

Dataset:
```json
{
  "productName": "Đồng hồ thông minh",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Kết quả render:
```
Kính chào quý Khách hàng!

Cảm ơn bạn đã mua Sản phẩm của chúng tôi: Đồng hồ thông minh.
Mã Đơn hàng: A123456789
Ngày Đơn hàng: 2025-01-01

Chúc bạn sử dụng vui vẻ!
```

### Truy cập object con

Nếu dataset chứa object con, có thể truy cập thuộc tính của object con qua dấu chấm.

**Cú pháp**: `{d.parent.child}`

**Ví dụ**:

Dataset:
```json
{
  "customer": {
    "name": "Lý Lôi",
    "contact": {
      "email": "lilei@example.com",
      "phone": "13800138000"
    }
  }
}
```

Nội dung Template:
```
Tên Khách hàng: {d.customer.name}
Địa chỉ email: {d.customer.contact.email}
Điện thoại liên hệ: {d.customer.contact.phone}
```

Kết quả render:
```
Tên Khách hàng: Lý Lôi
Địa chỉ email: lilei@example.com
Điện thoại liên hệ: 13800138000
```

### Truy cập mảng

Nếu dataset chứa mảng, có thể sử dụng từ khóa dành riêng `i` để truy cập phần tử trong mảng.

**Cú pháp**: `{d.arrayName[i].field}`

**Ví dụ**:

Dataset:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Nội dung Template:
```
Họ của nhân viên đầu tiên là {d.staffs[i=0].lastname}, tên là {d.staffs[i=0].firstname}
```

Kết quả render:
```
Họ của nhân viên đầu tiên là Anderson, tên là James
```


