---
title: "Formatter Template In ấn"
description: "Formatter Template In ấn: chuyển đổi dữ liệu gốc thành văn bản dễ đọc, cú pháp dấu hai chấm, gọi chuỗi, tham số hằng và tham số động."
keywords: "Formatter Template,formatters,Template In ấn,NocoBase"
---

## Công cụ Định dạng

Formatter dùng để chuyển đổi dữ liệu gốc thành văn bản dễ đọc. Formatter được áp dụng cho dữ liệu thông qua dấu hai chấm (:), có thể gọi chuỗi, đầu ra của mỗi Formatter sẽ làm đầu vào cho cái tiếp theo. Một số Formatter hỗ trợ tham số hằng hoặc tham số động.


### Tổng quan

#### 1. Mô tả cú pháp
Hình thức gọi cơ bản của Formatter là:
```
{d.thuộc tính:formatter1:formatter2(...)}
```
Ví dụ, trong ví dụ chuyển đổi chuỗi `"JOHN"` thành `"John"`, đầu tiên dùng `lowerCase` để chuyển tất cả chữ thành chữ thường, sau đó dùng `ucFirst` để viết hoa chữ cái đầu.

#### 2. Ví dụ
Dữ liệu:
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Template:
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Kết quả
Sau khi render xuất:
```
My name is John. I was born on January 31, 2000.
```


### Tham số hằng

#### 1. Mô tả cú pháp
Nhiều Formatter hỗ trợ một hoặc nhiều tham số hằng, phân tách bằng dấu phẩy, đặt trong dấu ngoặc tròn để sửa đổi đầu ra. Ví dụ, `:prepend(myPrefix)` sẽ thêm "myPrefix" vào trước văn bản.
Lưu ý: Nếu tham số chứa dấu phẩy hoặc khoảng trắng, phải bao bọc bằng dấu nháy đơn, như `prepend('my prefix')`.

#### 2. Ví dụ
Ví dụ Template (xem cách sử dụng của Formatter cụ thể).

#### 3. Kết quả
Đầu ra sẽ thêm prefix chỉ định vào trước văn bản.


### Tham số động

#### 1. Mô tả cú pháp
Formatter hỗ trợ tham số động, tham số bắt đầu bằng dấu chấm (.) và không có dấu nháy.
Có thể sử dụng hai cách:
- **Đường dẫn JSON tuyệt đối**: Bắt đầu bằng `d.` hoặc `c.` (dữ liệu gốc hoặc dữ liệu bổ sung).
- **Đường dẫn JSON tương đối**: Bắt đầu bằng một dấu chấm (.), nghĩa là tìm thuộc tính từ object cha hiện tại.

Ví dụ:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
Cũng có thể viết theo đường dẫn tương đối:
```
{d.subObject.qtyB:add(.qtyC)}
```
Nếu cần truy cập dữ liệu cấp trên hoặc cao hơn, có thể sử dụng nhiều dấu chấm:
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. Ví dụ
Dữ liệu:
```json
{
  "id": 10,
  "qtyA": 20,
  "subObject": {
    "qtyB": 5,
    "qtyC": 3
  },
  "subArray": [{
    "id": 1000,
    "qtyE": 3
  }]
}
```
Sử dụng trong Template:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Kết quả: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Kết quả: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Kết quả: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Kết quả: 6 (3 + 3)
```

#### 3. Kết quả
Các ví dụ lần lượt được 8, 8, 28, 6.

> **Lưu ý:** Sử dụng iterator tùy chỉnh hoặc bộ lọc mảng làm tham số động là không được phép, ví dụ:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```


