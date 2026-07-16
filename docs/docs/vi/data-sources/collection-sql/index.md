---
pkg: "@nocobase/plugin-collection-sql"
title: "Bảng SQL"
description: "Tạo bảng dữ liệu từ kết quả truy vấn SQL, cấu hình nguồn trường, ánh xạ trường và định danh duy nhất của bản ghi, phù hợp cho truy vấn liên kết, thống kê và hiển thị báo cáo."
keywords: "Bảng SQL,SQL collection,truy vấn SQL,ánh xạ trường,báo cáo,NocoBase"
---

#  Bảng SQL

## Giới thiệu

Viết câu lệnh truy vấn SQL để tạo thành bảng SQL. Thao tác này không tạo bảng cơ sở dữ liệu thực trong cơ sở dữ liệu, mà chỉ đọc kết quả truy vấn SQL để kết quả có thể được sử dụng trong bảng, chi tiết, biểu đồ và workflow. Các trường hợp sử dụng phù hợp: tổng hợp dữ liệu, báo cáo thống kê.

:::warning Lưu ý

 Bảng SQL chỉ hỗ trợ câu lệnh `SELECT` hoặc câu lệnh `WITH ... SELECT`, chỉ hỗ trợ truy vấn và hiển thị dữ liệu, không hỗ trợ thêm, chỉnh sửa hoặc xóa dữ liệu.

:::

## Tạo bảng SQL

1. Nhấp vào menu nguồn dữ liệu trong các chức năng hệ thống để truy cập trang chủ nguồn dữ liệu.
2. Chọn nguồn dữ liệu **Main** trong danh sách nguồn dữ liệu, nhấp vào thao tác 「Configure」 để truy cập cơ sở dữ liệu chính.
3. Trong phần quản lý cơ sở dữ liệu chính, nhấp vào 「Create collection」 rồi chọn 「SQL collection」。

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![create_sql_collection](https://static-docs.nocobase.com/create_sql_collection.png)
![create_sql_collection_configure](https://static-docs.nocobase.com/create_sql_collection_configure.png)

| Cấu hình | Mô tả |
| --- | --- |
| Collection display name | Tên hiển thị của bảng SQL trên giao diện, chẳng hạn như 「Tổng hợp doanh số」「Cảnh báo tồn kho」. Nên sử dụng tên thể hiện được ý nghĩa của kết quả truy vấn. |
| Collection name | Tên định danh của bảng SQL trong NocoBase, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, workflow và các chức năng khác. Tên này được tự động tạo, nhưng cũng có thể chỉnh sửa thủ công; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Categories | Phân loại bảng dữ liệu. Chỉ ảnh hưởng đến cách tổ chức trong giao diện quản lý bảng dữ liệu, không thay đổi truy vấn SQL. |
| Description | Mô tả bảng dữ liệu. Nên ghi rõ câu lệnh SQL này truy vấn dữ liệu nào, do ai quản lý và được dùng cho trang hoặc báo cáo nào. |
| Record unique key | Định danh duy nhất của bản ghi. Kết quả truy vấn SQL không có khóa chính thực, vì vậy cần chọn một trường hoặc tổ hợp trường có thể định vị duy nhất bản ghi; nếu không, có thể không xem chính xác bản ghi trong block. |
| SQL | Câu lệnh truy vấn được bảng SQL sử dụng. NocoBase sẽ thực thi câu lệnh SQL này, cấu hình các trường dựa trên kết quả truy vấn, sau đó sử dụng kết quả truy vấn làm bảng dữ liệu. |
| Source collections | Nguồn các trường trong kết quả truy vấn SQL. Dùng để liên kết các trường trong kết quả truy vấn với các trường của bảng dữ liệu hiện có, giúp NocoBase nhận diện nguồn trường và kiểu giao diện. |
| Fields | Cấu hình ánh xạ trường. Dùng để xác nhận tên, nguồn, kiểu giao diện và tên hiển thị của từng trường. |
| Preview | Xem trước kết quả truy vấn SQL. Trước khi gửi, có thể kiểm tra trước xem ánh xạ trường và hiệu quả hiển thị có đúng như mong đợi hay không. |

### Viết câu lệnh truy vấn SQL

Nhập câu lệnh truy vấn SQL, nhấp vào 「Execute」 để thực thi truy vấn và thử phân tích các trường trả về cùng bảng dữ liệu nguồn.
Việc nhấp vào 「Execute」 chỉ dùng để thực thi bản xem trước và phân tích trường. Sau khi xác nhận câu lệnh truy vấn SQL có thể sử dụng, hãy nhấp vào 「Confirm」 để biểu mẫu gửi câu lệnh SQL này dưới dạng câu lệnh truy vấn đã xác nhận.

![execute_sql_statement](https://static-docs.nocobase.com/202405191453556.png)

:::tip Mẹo

`Source collections` là các bảng dữ liệu nguồn được suy luận từ câu lệnh truy vấn SQL. Tính năng này nhận diện những bảng dữ liệu hiện có nào là nguồn chính của các trường trong kết quả truy vấn, đồng thời giới hạn các `Field source` có thể chọn khi ánh xạ trường.

Kết quả suy luận được dùng để hỗ trợ cấu hình nhanh. Nếu câu lệnh truy vấn SQL có bí danh, truy vấn con, trường tính toán, hàm tổng hợp hoặc join phức tạp, kết quả có thể không hoàn toàn chính xác hoặc không thể suy luận; bạn có thể chỉ định thủ công `Source collections`.

:::

### Ánh xạ trường

Ánh xạ trường là cấu hình bắt buộc phải xác nhận sau khi tạo bảng SQL. Bản thân kết quả truy vấn SQL chỉ cho NocoBase biết những cột nào được trả về. Để các cột này có thể được sử dụng trên giao diện như các trường thông thường, bạn vẫn cần xác nhận `Field source` hoặc cấu hình `Field interface` và tên hiển thị của trường.
[Tìm hiểu thêm về cấu hình trường](../data-modeling/collection-fields/index.md)

![configure_sql_field_source](https://static-docs.nocobase.com/202405191453579.png)
![configure_sql_field_interface](https://static-docs.nocobase.com/202405191454703.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field source | Chọn bảng dữ liệu và trường hiện có mà trường trong kết quả truy vấn SQL lấy dữ liệu từ đó. Sau khi chọn nguồn, NocoBase có thể sử dụng lại Field interface của trường gốc. |
| Field interface | Xác nhận cách trường được hiển thị và nhập trên trang, chẳng hạn như văn bản một dòng, số, ngày tháng hoặc tùy chọn trong danh sách thả xuống. |
| Field display name | Tên hiển thị của trường trên giao diện. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu được. |

Ví dụ, nếu truy vấn SQL trả về `customers.name as customer_name` và trường này lấy từ trường 「Tên khách hàng」 của bảng khách hàng, bạn có thể ánh xạ trường đó với trường tương ứng trong bảng khách hàng. Như vậy, NocoBase có thể sử dụng lại tiêu đề và cấu hình giao diện của trường gốc.

Nếu trường bắt nguồn từ kết quả tính toán, chẳng hạn như `count(*) as total`、`sum(amount) as amount_total`, thường sẽ không có trường nguồn rõ ràng; khi đó cần chọn thủ công Field interface phù hợp.

:::tip Mẹo

`Field source` phụ thuộc vào `Source collections`. Chỉ sau khi chọn bảng dữ liệu nguồn, bảng ánh xạ trường mới hiển thị các trường nguồn có thể chọn trong bảng dữ liệu đó.

Khi suy luận trường có `Field source`, NocoBase sẽ ưu tiên sử dụng lại Field interface của trường nguồn. Nếu không thể suy luận trường nguồn, bạn có thể chỉ định thủ công `Field source`; nếu kết quả suy luận không phù hợp với ý nghĩa nghiệp vụ, cần xóa `Field source`, sau đó có thể chỉ định thủ công `Field source` hoặc chọn thủ công `Field interface` và cấu hình `Field display name`.

:::

### Định danh duy nhất của bản ghi

Bảng SQL cần cấu hình Record unique key, nếu không sẽ không thể tạo block trên trang và không thể xem chính xác bản ghi. Có thể chọn một trường hoặc tổ hợp nhiều trường làm định danh duy nhất. Các trường phù hợp làm Record unique key thường đáp ứng những điều kiện sau:

- Mỗi hàng trong kết quả truy vấn đều là duy nhất
- Giá trị trường ổn định, không thay đổi do phân trang, sắp xếp hoặc thay đổi phạm vi thống kê
- Trường không rỗng
- Trường luôn được trả về trong kết quả truy vấn

Nếu kết quả truy vấn đến từ một bảng đơn, nên ưu tiên trả về khóa chính của bảng gốc. Nếu kết quả truy vấn đến từ join nhiều bảng hoặc phép tổng hợp, có thể giữ lại một ID nghiệp vụ ổn định trong SQL hoặc trả về nhiều trường có thể cùng nhau định vị bản ghi.

:::warning Lưu ý

Không sử dụng các giá trị như `row_number()`, vốn thay đổi theo việc sắp xếp, lọc hoặc phạm vi thống kê, làm Record unique key ổn định lâu dài. Sau khi định danh duy nhất của bản ghi thay đổi, các block trên trang, quyền, workflow và API bên ngoài có thể không định vị được cùng một bản ghi.

:::

### Xem trước kết quả truy vấn

Trước khi gửi, hãy sử dụng Preview để xem trước kết quả truy vấn SQL. Khi xem trước, cần đặc biệt xác nhận:

- SQL có thể được thực thi bình thường
- Các trường trả về có đầy đủ hay không
- Field interface và tên hiển thị có phù hợp với ý nghĩa nghiệp vụ hay không
- Record unique key có tồn tại và dữ liệu có duy nhất hay không
- Kết quả truy vấn có phù hợp để hiển thị trên trang hay không

![preview_sql_collection](https://static-docs.nocobase.com/202405191455439.png)

## Cấu hình trường

Sau khi tạo bảng SQL, trong danh sách bảng dữ liệu, nhấp vào 「Configure fields」 ở bên phải bảng SQL để truy cập trang cấu hình trường. Cấu hình trường dùng để duy trì các trường của bảng SQL, cách hiển thị trường trên giao diện và cách ánh xạ kết quả truy vấn SQL thành Field interface của NocoBase.
[Tìm hiểu thêm về cấu hình trường](../data-modeling/collection-fields/index.md)

### Chuyển đổi kiểu UI

Sau khi tạo bảng SQL, bạn vẫn có thể điều chỉnh cấu hình giao diện của trường trong phần cấu hình trường. Trang cấu hình trường chủ yếu dùng để chuyển đổi Field interface, chỉnh sửa tên hiển thị, mô tả và cấu hình riêng của trường.
![configure_field_sql](https://static-docs.nocobase.com/configure_field_sql.png)

Phù hợp để xử lý các trường hợp sau:

- Khi tạo bảng SQL, Field interface được thiết lập không chính xác
- Tên hiển thị của trường không phù hợp với thói quen nghiệp vụ và cần đổi thành tên dễ hiểu hơn
- Ý nghĩa nghiệp vụ của trường trong kết quả truy vấn thay đổi và cần xác nhận lại cách hiển thị
- Cần điều chỉnh mô tả trường hoặc cấu hình riêng của trường, chẳng hạn như các tùy chọn trong danh sách thả xuống

### Đồng bộ từ cơ sở dữ liệu

Nếu câu lệnh truy vấn SQL không thay đổi nhưng cấu trúc bảng dữ liệu hoặc trường bên dưới có thay đổi, bạn có thể truy cập 「Configure fields」, nhấp vào 「Sync from database」 để thực thi lại SQL và đồng bộ các trường. Tham khảo [「Tạo bảng SQL」](#字段映射) để biết cách ánh xạ trường.

![sync_sql_collection_fields](https://static-docs.nocobase.com/202405191456216.png)

### Chỉnh sửa trường

Nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường. Chỉnh sửa trường phù hợp để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, quy tắc xác thực hoặc cấu hình riêng của trường.
[Tìm hiểu thêm về cấu hình trường](../data-modeling/collection-fields/index.md)

:::warning Lưu ý

Chỉnh sửa cấu hình trường sẽ không thay đổi câu lệnh truy vấn SQL, tên trường của bảng nguồn, định nghĩa trường của bảng nguồn hoặc chỉ mục cơ sở dữ liệu. Nếu cần điều chỉnh các cột thực trong kết quả truy vấn, trước tiên hãy sửa câu lệnh truy vấn SQL, sau đó thực thi lại và đồng bộ các trường.

:::

### Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa một trường. Việc xóa trường chỉ xóa trường được lưu trong NocoBase, không xóa câu lệnh truy vấn SQL và cũng không xóa cột thực trong bảng dữ liệu nguồn.
[Tìm hiểu thêm về cấu hình trường](../data-modeling/collection-fields/index.md)

:::warning Lưu ý

Xóa trường có thể ảnh hưởng đến block trên trang, điều kiện lọc, sắp xếp, quyền, workflow, API và các cấu hình hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được sử dụng hay không. Nếu câu lệnh truy vấn SQL vẫn trả về cột này, NocoBase có thể nhận diện lại trường khi thực thi 「Sync from database」 lần tiếp theo.

:::

## Chỉnh sửa bảng SQL

Trong danh sách bảng dữ liệu, nhấp vào 「Edit」 ở bên phải một bảng SQL để điều chỉnh siêu dữ liệu và cấu hình vận hành của bảng SQL trong NocoBase. Các mục cấu hình khi chỉnh sửa về cơ bản giống với khi tạo bảng SQL, chỉ có `Collection name` là không thể chỉnh sửa.

Nếu câu lệnh truy vấn SQL thay đổi, cần nhấp lại vào 「Execute」 và xác nhận ánh xạ trường, Record unique key cùng kết quả xem trước.

![edit_sql_collection](https://static-docs.nocobase.com/202405191455302.png)

:::warning Lưu ý

Thay đổi câu lệnh truy vấn SQL có thể làm thay đổi tên trường, ánh xạ trường hoặc Record unique key. Sau khi thay đổi, hãy kiểm tra lại xem các block trên trang, biểu đồ, quyền và workflow còn hoạt động bình thường hay không.

:::

## Xóa bảng SQL

Trong danh sách bảng dữ liệu, nhấp vào 「Delete」 ở bên phải bảng SQL chỉ xóa cấu hình và các trường của bảng SQL trong NocoBase, không xóa bảng nguồn bên dưới và cũng không xóa dữ liệu trong bảng nguồn.
Bạn cũng có thể chọn hàng loạt rồi xóa cùng lúc. Trước khi xóa, cần kiểm tra xem các block trên trang, biểu đồ, quyền, workflow và API bên ngoài có còn sử dụng bảng SQL này hay không.