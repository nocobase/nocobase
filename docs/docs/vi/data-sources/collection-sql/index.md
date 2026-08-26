---
title: "Bảng SQL"
description: "Lấy dữ liệu thông qua câu lệnh SQL và cấu hình metadata Field, sử dụng giống như bảng thông thường cho bảng, biểu đồ, workflow, phù hợp với các tình huống truy vấn liên kết, thống kê."
keywords: "Bảng SQL,Collection SQL,truy vấn SQL,truy vấn liên kết,thống kê,NocoBase"
---

# Bảng SQL

<PluginInfo name="collection-sql"></PluginInfo>

## Giới thiệu

SQL collection cung cấp một phương pháp lấy dữ liệu thông qua câu lệnh SQL. Bằng cách lấy các Field dữ liệu thông qua câu lệnh SQL và cấu hình metadata Field, bạn có thể sử dụng giống như bảng thông thường cho bảng, biểu đồ, workflow, v.v., phù hợp với các tình huống truy vấn liên kết, thống kê.

## Hướng dẫn sử dụng

### Tạo mới

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

<p>1. Sau khi nhập câu lệnh SQL vào ô SQL, nhấp Execute, hệ thống sẽ cố gắng phân tích các bảng và Field mà SQL đã sử dụng, trích xuất metadata Field từ bảng nguồn.</p>

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

<p>2. Nếu bảng nguồn và Field do hệ thống tự động phân tích không đúng, bạn có thể chọn thủ công bảng và Field tương ứng để sử dụng metadata của Field tương ứng. Cần chọn bảng nguồn trước, sau đó mới có thể chọn Field của bảng đó trong nguồn Field bên dưới.</p>

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

<p>3. Nếu Field không có Field nguồn tương ứng, hệ thống sẽ suy luận kiểu Field dựa trên kiểu dữ liệu. Nếu kết quả suy luận không đúng, bạn có thể chọn kiểu Field thủ công.</p>

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

<p>4. Trong khi cấu hình Field, bạn có thể xem hiệu ứng hiển thị tương ứng trong khu vực xem trước.</p>

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

<p>5. Sau khi cấu hình hoàn tất và xác nhận không có vấn đề, cần nhấp vào nút Confirm bên dưới ô SQL để gửi cuối cùng.</p>

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Chỉnh sửa

1. Khi câu lệnh SQL có thay đổi, bạn có thể nhấp vào nút Edit để chỉnh sửa trực tiếp câu lệnh SQL và cấu hình lại Field.

2. Khi cần sửa metadata Field, có thể thông qua Configure fields, chỉnh sửa các cấu hình liên quan đến Field giống như bảng thông thường.

### Đồng bộ

Khi câu lệnh SQL không thay đổi nhưng cấu trúc bảng database có thay đổi, có thể đồng bộ và cấu hình Field thông qua việc nhấp vào Configure fields - Sync from database.

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### So sánh Bảng SQL với Database View

| Loại mẫu | Tình huống áp dụng | Nguyên lý triển khai | Hỗ trợ thêm/xóa/sửa |
| -------------- | -------------------------------------------------------------------------------------- | ---------- | ---------- |
| SQL | Mô hình tương đối đơn giản, tình huống nhẹ<br />Không tiện thao tác database<br />Không muốn duy trì view<br />Muốn thao tác hoàn toàn qua UI | SQL subquery | Không hỗ trợ |
| Database View | Mô hình tương đối phức tạp<br />Cần tương tác với database<br />Cần chỉnh sửa dữ liệu<br />Cần hỗ trợ database tốt hơn và ổn định hơn | Database view | Hỗ trợ một phần |

:::warning
Khi sử dụng Bảng SQL, vui lòng chọn các Collection có thể quản lý trong NocoBase. Nếu là các bảng khác chưa được tích hợp vào NocoBase trong cùng một database, có thể dẫn đến phân tích câu lệnh SQL không chính xác. Nếu có nhu cầu này, có thể xem xét việc tạo view và kết nối.
:::
