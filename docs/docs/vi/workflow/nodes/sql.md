---
pkg: '@nocobase/plugin-workflow-sql'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Thao tác SQL

## Giới thiệu

Trong một số trường hợp đặc biệt, các nút thao tác bộ sưu tập đơn giản ở trên có thể không đáp ứng được các hoạt động phức tạp. Khi đó, bạn có thể sử dụng trực tiếp nút SQL để cơ sở dữ liệu thực thi các câu lệnh SQL phức tạp nhằm thao tác dữ liệu.

Điểm khác biệt so với việc kết nối trực tiếp đến cơ sở dữ liệu để thực hiện các thao tác SQL bên ngoài ứng dụng là, trong một luồng công việc, bạn có thể sử dụng các biến từ ngữ cảnh của quy trình làm tham số trong câu lệnh SQL.

## Cài đặt

Đây là một plugin tích hợp sẵn, không cần cài đặt.

## Tạo nút

Trong giao diện cấu hình luồng công việc, hãy nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút “Thao tác SQL”:

![SQL 操作_添加](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Cấu hình nút

![SQL节点_节点配置](https://static-docs.nocobase.com/20240904002334.png)

### Nguồn dữ liệu

Chọn nguồn dữ liệu để thực thi câu lệnh SQL.

Nguồn dữ liệu phải là loại cơ sở dữ liệu, ví dụ như nguồn dữ liệu chính, loại PostgreSQL hoặc các nguồn dữ liệu tương thích với Sequelize khác.

### Nội dung SQL

Chỉnh sửa câu lệnh SQL. Hiện tại, chỉ hỗ trợ một câu lệnh SQL duy nhất.

Chèn các biến cần thiết bằng nút biến ở góc trên bên phải của trình chỉnh sửa. Trước khi thực thi, các biến này sẽ được thay thế bằng giá trị tương ứng của chúng thông qua thay thế văn bản. Văn bản kết quả sau đó sẽ được sử dụng làm câu lệnh SQL cuối cùng và gửi đến cơ sở dữ liệu để truy vấn.

## Kết quả thực thi nút

Kể từ `v1.3.15-beta`, kết quả thực thi của nút SQL là một mảng dữ liệu thuần túy. Trước đó, nó là cấu trúc trả về gốc của Sequelize chứa siêu dữ liệu truy vấn (xem thêm: [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Ví dụ, truy vấn sau:

```sql
select count(id) from posts;
```

Kết quả trước `v1.3.15-beta`:

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

Kết quả sau `v1.3.15-beta`:

```json
[
    { "count": 1 }
]
```

## Câu hỏi thường gặp

### Làm thế nào để sử dụng kết quả của nút SQL?

Nếu sử dụng câu lệnh `SELECT`, kết quả truy vấn sẽ được lưu trong nút dưới định dạng JSON của Sequelize. Bạn có thể phân tích cú pháp và sử dụng nó với [plugin JSON-query](./json-query.md).

### Thao tác SQL có kích hoạt sự kiện bộ sưu tập không?

**Không**. Thao tác SQL trực tiếp gửi câu lệnh SQL đến cơ sở dữ liệu để xử lý. Các thao tác `CREATE` / `UPDATE` / `DELETE` liên quan đều diễn ra trong cơ sở dữ liệu, trong khi các sự kiện bộ sưu tập xảy ra ở lớp ứng dụng của Node.js (được xử lý bởi ORM). Vì vậy, các sự kiện bộ sưu tập sẽ không được kích hoạt.