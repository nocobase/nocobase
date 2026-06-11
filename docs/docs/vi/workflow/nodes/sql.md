---
pkg: '@nocobase/plugin-workflow-sql'
title: "Node Workflow - Thao tác SQL"
description: "Node thao tác SQL: thực thi câu lệnh SQL phức tạp, hỗ trợ biến ngữ cảnh quy trình làm tham số."
keywords: "workflow,thao tác SQL,cơ sở dữ liệu,câu lệnh SQL,tham số biến,NocoBase"
---

# Thao tác SQL

## Giới thiệu

Trong một số tình huống đặc biệt, các Node thao tác bảng dữ liệu đơn giản phía trên có thể không xử lý được các thao tác phức tạp, thì có thể trực tiếp sử dụng Node SQL để cơ sở dữ liệu trực tiếp thực thi các câu lệnh SQL phức tạp để thao tác dữ liệu.

Sự khác biệt với việc trực tiếp kết nối cơ sở dữ liệu để thực hiện thao tác SQL từ ngoài ứng dụng là, trong Workflow có thể sử dụng biến của ngữ cảnh quy trình làm một phần tham số trong câu lệnh SQL.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Thao tác SQL":

![Thao tác SQL_thêm](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Cấu hình Node

![Node SQL_cấu hình Node](https://static-docs.nocobase.com/20260414235136.png)

### Nguồn dữ liệu

Chọn nguồn dữ liệu thực thi SQL.

Nguồn dữ liệu phải là loại cơ sở dữ liệu, ví dụ nguồn dữ liệu chính, loại PostgreSQL... các nguồn dữ liệu tương thích dựa trên Sequelize.

### Nội dung SQL

Soạn câu lệnh SQL. Hiện chỉ hỗ trợ một câu lệnh SQL.

:::info
Từ phiên bản `v2.0.30`, vì lý do bảo mật, câu lệnh SQL không còn hỗ trợ trực tiếp sử dụng biến để thay thế text, cần đổi sang truy vấn tham số hóa.
:::

Trong câu lệnh SQL có thể sử dụng biến của ngữ cảnh quy trình nhưng cần sử dụng dạng `:variableName` để đặt chỗ, ví dụ:

```sql
SELECT * FROM users WHERE id = :userId;
```

### Danh sách tham số

Trong câu lệnh SQL trên, `:userId` là một placeholder, việc thay thế placeholder cần được cấu hình trong "Danh sách tham số". Tên biến sử dụng tên trong placeholder, ví dụ `userId`, giá trị biến có thể sử dụng công cụ chọn biến để chọn biến của ngữ cảnh quy trình.

## Kết quả thực thi Node

Từ phiên bản `v1.3.15-beta`, kết quả thực thi của Node SQL là một mảng được tạo bởi dữ liệu thuần, trước đó là cấu trúc Sequelize trả về gốc chứa thông tin meta của truy vấn (xem chi tiết: [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Ví dụ truy vấn sau:

```sql
select count(id) from posts;
```

Kết quả trước phiên bản `v1.3.15-beta`:

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

Kết quả sau phiên bản `v1.3.15-beta`:

```json
[
    { "count": 1 }
]
```

## Câu hỏi thường gặp

### Cách sử dụng kết quả của Node SQL?

Nếu sử dụng câu lệnh `SELECT`, kết quả truy vấn sẽ được lưu trong Node với định dạng JSON của Sequelize, có thể qua plugin [JSON-query](./json-query.md) để phân tích và sử dụng.

### Thao tác SQL có kích hoạt sự kiện bảng dữ liệu không?

**Không**. Thao tác SQL trực tiếp gửi câu lệnh SQL đến cơ sở dữ liệu để xử lý, các thao tác `CREATE` / `UPDATE` / `DELETE` liên quan đều xảy ra trong cơ sở dữ liệu, còn sự kiện bảng dữ liệu xảy ra ở tầng ứng dụng Node.js (xử lý ORM), nên sẽ không kích hoạt sự kiện bảng dữ liệu.
