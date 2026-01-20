:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


## Cách dùng cơ bản

Plugin In Mẫu cung cấp nhiều cú pháp khác nhau để bạn linh hoạt chèn dữ liệu động và cấu trúc logic vào các mẫu. Dưới đây là giải thích chi tiết về cú pháp và các ví dụ sử dụng.

### Thay thế cơ bản

Sử dụng các phần giữ chỗ (placeholder) theo định dạng `{d.xxx}` để thay thế dữ liệu. Ví dụ:

- `{d.title}`: Đọc trường `title` từ tập dữ liệu.
- `{d.date}`: Đọc trường `date` từ tập dữ liệu.

**Ví dụ**:

Nội dung mẫu:
```
Kính gửi Quý khách hàng,

Cảm ơn Quý khách đã mua sản phẩm của chúng tôi: {d.productName}.
Mã đơn hàng: {d.orderId}
Ngày đặt hàng: {d.orderDate}

Chúc Quý khách có trải nghiệm tuyệt vời!
```

Tập dữ liệu:
```json
{
  "productName": "Đồng hồ thông minh",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Kết quả hiển thị:
```
Kính gửi Quý khách hàng,

Cảm ơn Quý khách đã mua sản phẩm của chúng tôi: Đồng hồ thông minh.
Mã đơn hàng: A123456789
Ngày đặt hàng: 2025-01-01

Chúc Quý khách có trải nghiệm tuyệt vời!
```

### Truy cập đối tượng con

Nếu tập dữ liệu chứa các đối tượng con, bạn có thể truy cập các thuộc tính của chúng bằng ký hiệu dấu chấm.

**Cú pháp**: `{d.parent.child}`

**Ví dụ**:

Tập dữ liệu:
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

Nội dung mẫu:
```
Tên khách hàng: {d.customer.name}
Địa chỉ email: {d.customer.contact.email}
Số điện thoại liên hệ: {d.customer.contact.phone}
```

Kết quả hiển thị:
```
Tên khách hàng: Lý Lôi
Địa chỉ email: lilei@example.com
Số điện thoại liên hệ: 13800138000
```

### Truy cập mảng

Nếu tập dữ liệu chứa các mảng, bạn có thể sử dụng từ khóa dành riêng `i` để truy cập các phần tử trong mảng.

**Cú pháp**: `{d.arrayName[i].field}`

**Ví dụ**:

Tập dữ liệu:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Nội dung mẫu:
```
Họ của nhân viên đầu tiên là {d.staffs[i=0].lastname}, và tên là {d.staffs[i=0].firstname}
```

Kết quả hiển thị:
```
Họ của nhân viên đầu tiên là Anderson, và tên là James
```