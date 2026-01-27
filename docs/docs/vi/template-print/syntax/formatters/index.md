:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


## Trình định dạng

Trình định dạng được dùng để chuyển đổi dữ liệu thô thành văn bản dễ đọc. Chúng được áp dụng cho dữ liệu bằng dấu hai chấm (`:`) và có thể được gọi theo chuỗi, sao cho đầu ra của mỗi trình định dạng sẽ trở thành đầu vào cho trình định dạng tiếp theo. Một số trình định dạng hỗ trợ tham số hằng số hoặc tham số động.

### Tổng quan

#### 1. Giải thích cú pháp
Cách gọi trình định dạng cơ bản như sau:
```
{d.property:formatter1:formatter2(...)}
```  
Ví dụ, để chuyển đổi chuỗi `"JOHN"` thành `"John"`, trước tiên chúng ta dùng `lowerCase` để chuyển tất cả các chữ cái thành chữ thường, sau đó dùng `ucFirst` để viết hoa chữ cái đầu tiên.

#### 2. Ví dụ
Dữ liệu:
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Mẫu:
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Kết quả
Sau khi kết xuất, đầu ra là:
```
My name is John. I was born on January 31, 2000.
```

### Tham số hằng số

#### 1. Giải thích cú pháp
Nhiều trình định dạng hỗ trợ một hoặc nhiều tham số hằng số, được phân tách bằng dấu phẩy và đặt trong dấu ngoặc đơn để sửa đổi đầu ra. Ví dụ, `:prepend(myPrefix)` sẽ thêm "myPrefix" vào phía trước văn bản.  
> **Lưu ý:** Nếu tham số chứa dấu phẩy hoặc khoảng trắng, nó phải được đặt trong dấu nháy đơn, ví dụ: `prepend('my prefix')`.

#### 2. Ví dụ
Ví dụ về mẫu (xem cách sử dụng trình định dạng cụ thể để biết chi tiết).

#### 3. Kết quả
Đầu ra sẽ có tiền tố được chỉ định được thêm vào phía trước văn bản.

### Tham số động

#### 1. Giải thích cú pháp
Trình định dạng cũng hỗ trợ tham số động. Các tham số này bắt đầu bằng dấu chấm (`.`) và không được đặt trong dấu nháy.  
Có hai phương pháp để chỉ định tham số động:
- **Đường dẫn JSON tuyệt đối**: Bắt đầu bằng `d.` hoặc `c.` (tham chiếu đến dữ liệu gốc hoặc dữ liệu bổ sung).
- **Đường dẫn JSON tương đối**: Bắt đầu bằng một dấu chấm (`.`) duy nhất, cho biết thuộc tính được tìm kiếm từ đối tượng cha hiện tại.

Ví dụ:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
Nó cũng có thể được viết dưới dạng đường dẫn tương đối:
```
{d.subObject.qtyB:add(.qtyC)}
```
Nếu bạn cần truy cập dữ liệu từ cấp cao hơn (cha hoặc cao hơn), bạn có thể sử dụng nhiều dấu chấm:
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
Cách sử dụng trong mẫu:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Kết quả: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Kết quả: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Kết quả: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Kết quả: 6 (3 + 3)
```

#### 3. Kết quả
Các ví dụ lần lượt cho kết quả 8, 8, 28 và 6.

> **Lưu ý:** Việc sử dụng các bộ lặp tùy chỉnh hoặc bộ lọc mảng làm tham số động là không được phép, ví dụ:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```