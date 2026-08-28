---
pkg: "@nocobase/plugin-data-source-main"
title: "Khung nhìn cơ sở dữ liệu"
description: "Kết nối các khung nhìn đã tồn tại trong cơ sở dữ liệu làm nguồn dữ liệu, cấu hình trường và cách hiển thị trong NocoBase, phù hợp để quản lý trực quan các kết quả truy vấn phức tạp."
keywords: "Khung nhìn cơ sở dữ liệu,Collection View,khung nhìn"
---
# Kết nối khung nhìn cơ sở dữ liệu

## Giới thiệu

Kết nối các khung nhìn trong cơ sở dữ liệu, chẳng hạn như khung nhìn báo cáo tài chính do DBA duy trì, khung nhìn khách hàng đã lọc hoặc khung nhìn tổng hợp được đồng bộ từ nhiều hệ thống. Tính năng này phù hợp để tái sử dụng logic truy vấn đã được định nghĩa trong cơ sở dữ liệu.

:::tip Lưu ý

Hỗ trợ các khung nhìn thông thường trong phạm vi chủ sở hữu của tài khoản kết nối cơ sở dữ liệu chính, không hỗ trợ khung nhìn vật hóa. Ngay cả khi tài khoản đó có quyền truy vấn khung nhìn của chủ sở hữu khác, các khung nhìn này cũng sẽ không xuất hiện trong danh sách có thể kết nối. Trước khi kết nối, cần xác nhận các trường của khung nhìn có tên cột ổn định và kiểu dữ liệu có thể được NocoBase nhận diện.

:::

## Kết nối khung nhìn cơ sở dữ liệu

1. Nhấp vào menu nguồn dữ liệu trong các chức năng hệ thống để truy cập trang chính của nguồn dữ liệu.
2. Chọn nguồn dữ liệu **Main** trong danh sách nguồn dữ liệu, nhấp vào thao tác 「Configure」 để truy cập cơ sở dữ liệu chính.
3. Trong phần quản lý cơ sở dữ liệu chính, nhấp vào 「Create collection」 rồi chọn 「Connect to database view」

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![connect_view](https://static-docs.nocobase.com/connect_view.png)
![connect_view_configure](https://static-docs.nocobase.com/connect_view_configure.png)

| Cấu hình | Mô tả |
| --- | --- |
| Collection display name | Tên hiển thị của khung nhìn cơ sở dữ liệu trong giao diện, chẳng hạn như 「Khung nhìn báo cáo tài chính」 hoặc 「Khung nhìn thống kê khách hàng」. Khuyến nghị sử dụng tên thể hiện rõ mục đích của khung nhìn. |
| Collection name | Tên định danh của khung nhìn cơ sở dữ liệu trong NocoBase, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, workflow và các chức năng khác. Tên này được tự động tạo và cũng có thể chỉnh sửa thủ công; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Database view | Chọn khung nhìn cơ sở dữ liệu cần kết nối. Cấu trúc trường và kết quả truy vấn sẽ được đọc từ khung nhìn. Khi chỉnh sửa, có thể xem view hiện đang kết nối nhưng không thể chuyển sang view khác. |
| Categories | Phân loại bảng dữ liệu. Chỉ ảnh hưởng đến cách tổ chức trong giao diện quản lý bảng dữ liệu, không thay đổi bản thân khung nhìn cơ sở dữ liệu. |
| Description | Mô tả bảng dữ liệu. Khuyến nghị ghi rõ ai duy trì view này, truy vấn những dữ liệu nào và được dùng cho trang hoặc báo cáo nào. |
| Use simple pagination mode | Chế độ phân trang đơn giản. Sau khi bật, khi phân trang khối bảng, hệ thống sẽ bỏ qua việc thống kê tổng số bản ghi, phù hợp với các view có lượng dữ liệu lớn và có thể giảm tải truy vấn. |
| Record unique key | Định danh duy nhất của bản ghi. Khung nhìn cơ sở dữ liệu thường không có khóa chính, vì vậy cần chọn một trường có thể xác định duy nhất bản ghi; nếu không, bản ghi có thể không được xem hoặc chỉnh sửa chính xác trong khối. |
| Source collections | Nguồn trường của khung nhìn cơ sở dữ liệu. Dùng để liên kết các trường của khung nhìn với các trường của bảng dữ liệu hiện có, giúp NocoBase nhận diện kiểu trường và kiểu giao diện. |
| Fields | Cấu hình ánh xạ trường. Dùng để xác nhận tên, tiêu đề, kiểu dữ liệu và kiểu giao diện của từng trường trong khung nhìn. |
| Preview | Xem trước kết quả của khung nhìn cơ sở dữ liệu. Trước khi gửi, có thể xác nhận ánh xạ trường và hiệu quả hiển thị có đúng như mong đợi hay không. |
| Allow add new, update and delete actions | Có cho phép thực hiện thao tác thêm, cập nhật và xóa đối với khung nhìn cơ sở dữ liệu hay không. Sau khi bật, NocoBase sẽ mở các điểm truy cập thao tác tương ứng trên trang; việc ghi dữ liệu có thành công hay không vẫn phụ thuộc vào khả năng ghi của chính database view và quyền insert, update, delete của tài khoản cơ sở dữ liệu. |

:::tip Lưu ý

`Source collections` là các bảng dữ liệu nguồn được suy luận dựa trên khung nhìn cơ sở dữ liệu, dùng để nhận diện các trường trong view chủ yếu đến từ những bảng dữ liệu hiện có nào và giới hạn các `Field source` có thể chọn khi ánh xạ trường.

Kết quả suy luận chỉ dùng để hỗ trợ cấu hình nhanh. Nếu view có đổi tên trường, phép tính, phép tổng hợp hoặc join phức tạp, kết quả có thể không hoàn toàn chính xác hoặc không thể suy luận; khi đó cần xác nhận thủ công trong `Fields`.

:::

### Ánh xạ trường

Ánh xạ trường là cấu hình bắt buộc phải xác nhận sau khi kết nối khung nhìn cơ sở dữ liệu. Sau khi kết nối view, NocoBase trước tiên sẽ suy luận nguồn và kiểu dữ liệu cơ sở dữ liệu của từng trường trong khung nhìn: khi suy luận được trường nguồn, hệ thống sẽ tự động điền Field type, Field interface và Field display name của trường hiện có; khi không thể suy luận, hệ thống sẽ đưa ra Field type ban đầu dựa trên kiểu trường cơ sở dữ liệu, và cần xác nhận thủ công kiểu trường cũng như cấu hình giao diện.
[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

![connect_view_configure_field_source](https://static-docs.nocobase.com/connect_view_configure_field_source.png)
![connect_view_configure_field_interface](https://static-docs.nocobase.com/connect_view_configure_field_interface.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field source | Chọn bảng dữ liệu và trường hiện có mà trường của khung nhìn lấy dữ liệu từ đó. Sau khi chọn nguồn, NocoBase có thể tái sử dụng Field type và Field interface của trường gốc. |
| Field type | Nếu trường trong khung nhìn không có nguồn rõ ràng, cần xác nhận thủ công kiểu dữ liệu của trường. |
| Field interface | Xác nhận cách trường được hiển thị và nhập trên trang, chẳng hạn như văn bản một dòng, số, ngày tháng hoặc tùy chọn thả xuống. |
| Field display name | Tên hiển thị của trường trên giao diện. Khuyến nghị sử dụng tên mà nhân viên nghiệp vụ có thể hiểu. |

Ví dụ, nếu view trả về `customer_name` và trường này đến từ trường 「Tên khách hàng」 của bảng khách hàng, bạn có thể ánh xạ nó với trường tương ứng trong bảng khách hàng. Khi đó, NocoBase có thể sử dụng lại tiêu đề, kiểu và cấu hình giao diện của trường gốc.

Nếu trường trong khung nhìn đến từ kết quả tổng hợp hoặc tính toán, chẳng hạn như `count(*) as total`, `sum(amount) as amount_total`, thông thường cần chọn thủ công Field type và Field interface phù hợp.

:::tip Lưu ý

`Field source` đến từ suy luận của NocoBase đối với khung nhìn cơ sở dữ liệu, cho biết một trường trong khung nhìn có thể tương ứng với trường hiện có nào. Khi trường có `Field source`, NocoBase sẽ ưu tiên tái sử dụng Field type và Field interface của trường nguồn.

Nếu không thể suy luận trường nguồn hoặc kết quả suy luận không phù hợp với ý nghĩa nghiệp vụ, cần xóa `Field source` rồi chọn thủ công `Field type`, `Field interface` và `Field display name`.

:::

### Định danh duy nhất của bản ghi

Khung nhìn cơ sở dữ liệu cần cấu hình Record unique key, nếu không sẽ không thể tạo khối trên trang và không thể xem hoặc chỉnh sửa bản ghi chính xác. Có thể chọn một trường hoặc kết hợp nhiều trường làm định danh duy nhất. Các trường phù hợp làm Record unique key thường đáp ứng những điều kiện sau:

- Giá trị trường là duy nhất
- Giá trị trường ổn định, không thay đổi do thứ tự sắp xếp, phân trang hoặc thay đổi phạm vi thống kê
- Trường không được để trống
- Luôn được trả về trong view

Nếu view đến từ truy vấn một bảng, nên ưu tiên trả về khóa chính của bảng gốc. Nếu view đến từ join nhiều bảng hoặc phép tổng hợp, có thể giữ lại một ID nghiệp vụ ổn định trong khung nhìn cơ sở dữ liệu hoặc để phía cơ sở dữ liệu tạo một trường duy nhất ổn định.

### Cho phép thao tác thêm, sửa, xóa

Nếu database view hỗ trợ ghi dữ liệu, có thể bật 「Allow add new, update and delete actions」. NocoBase sẽ cho phép thực hiện thao tác thêm, cập nhật và xóa đối với khung nhìn này trên trang.

Khung nhìn cơ sở dữ liệu phù hợp hơn để sử dụng làm kết quả truy vấn và mặc định được xử lý như bảng dữ liệu chỉ đọc. Chỉ nên bật tùy chọn này sau khi đã xác nhận database view hỗ trợ các thao tác ghi tương ứng và quyền cơ sở dữ liệu cũng cho phép ghi dữ liệu.

### Xem trước kết quả khung nhìn

Trước khi gửi, hãy sử dụng Preview để xem kết quả truy vấn của khung nhìn. Khi xem trước, cần tập trung xác nhận:

- view có thể truy vấn bình thường hay không
- Các trường có đầy đủ hay không
- Kiểu trường và kiểu giao diện có phù hợp với ý nghĩa nghiệp vụ hay không
- Record unique key có tồn tại và dữ liệu có duy nhất hay không
- Có cần điều chỉnh các kiểu trường không được hỗ trợ ở phía cơ sở dữ liệu hay không

![connect_view_configure_preview](https://static-docs.nocobase.com/connect_view_configure_preview.png)

## Cấu hình trường

Sau khi tạo khung nhìn cơ sở dữ liệu, trong danh sách bảng dữ liệu, nhấp vào 「Configure fields」 ở bên phải khung nhìn để truy cập trang cấu hình trường. Cấu hình trường dùng để duy trì các trường của khung nhìn, cách trường hiển thị trên giao diện và cách ánh xạ trường trong database view thành Field type và Field interface của NocoBase.

Các trường thông thường của khung nhìn cơ sở dữ liệu đến từ database view. NocoBase sẽ không trực tiếp thêm, sửa hoặc xóa các cột thực trong view. Trên trang cấu hình trường, chỉ hỗ trợ thêm trường quan hệ nhiều-một để bổ sung các liên kết nghiệp vụ trong NocoBase. Khung nhìn cơ sở dữ liệu không hỗ trợ làm bảng dữ liệu đích của trường quan hệ; thông thường không cần cấu hình trường tiêu đề.

[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

![configure_view](https://static-docs.nocobase.com/configure_view.png)

### Thêm trường quan hệ

Khung nhìn cơ sở dữ liệu chỉ có thể thêm trường quan hệ nhiều-một. Trường quan hệ nhiều-một có thể ánh xạ các trường hiện có trong view với khóa chính hoặc trường duy nhất của bảng dữ liệu đích, dùng để hiển thị các bản ghi liên quan trên trang, nhưng sẽ không tạo trường thực hoặc ràng buộc khóa ngoại trong database view.

Nhấp vào 「Add field」 để thêm trường quan hệ nhiều-một.

[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

![add_view_field](https://static-docs.nocobase.com/add_view_field.png)
![add_view_field_configure](https://static-docs.nocobase.com/add_view_field_configure.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field display name | Tên hiển thị của trường quan hệ nhiều-một trên giao diện. Khuyến nghị sử dụng tên mà nhân viên nghiệp vụ có thể hiểu, chẳng hạn như 「Khách hàng phụ trách」 hoặc 「Đơn hàng liên kết」. |
| Field name | Tên định danh được lưu cho trường quan hệ nhiều-một trong NocoBase, dùng để tham chiếu nội bộ trong API, quyền hạn, workflow và các chức năng khác. |
| Source collection | Bảng dữ liệu nguồn, tức bảng dữ liệu của khung nhìn cơ sở dữ liệu hiện tại. Dùng để xác định `Foreign key` được chọn từ trường của bảng dữ liệu nào; khi thêm trường quan hệ nhiều-một cho khung nhìn cơ sở dữ liệu, thông thường giữ nguyên là view hiện tại. |
| Target collection | Bảng dữ liệu đích cần liên kết. Thông thường chọn các bảng dữ liệu thực như bảng dữ liệu thông thường hoặc bảng cơ sở dữ liệu bên ngoài, không thể chọn khung nhìn cơ sở dữ liệu. |
| Foreign key | Trường trong khung nhìn cơ sở dữ liệu hiện tại dùng để lưu định danh của bản ghi đích. Trường này cần được trả về ổn định trong kết quả truy vấn của view. |
| Target key | Trường trong bảng dữ liệu đích được `Foreign key` dùng để đối chiếu, thường chọn khóa chính hoặc trường duy nhất. |
| Description | Mô tả trường. Có thể ghi ý nghĩa của quan hệ liên kết, nguồn dữ liệu, cách duy trì hoặc các lưu ý. |

### Ánh xạ trường

Sau khi kết nối khung nhìn cơ sở dữ liệu, NocoBase sẽ suy luận Field type dựa trên trường trong view và trường nguồn, đồng thời ghép một Field interface mặc định. Nếu nguồn trường, cách hiển thị hoặc ý nghĩa nghiệp vụ không đúng như mong đợi, có thể điều chỉnh ánh xạ trong cấu hình trường.

[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

![edit_view_field_configure](https://static-docs.nocobase.com/edit_view_field_configure.png)

:::tip Lưu ý

- Field interface (kiểu giao diện / kiểu UI): quyết định cách trường được hiển thị và tương tác ở giao diện frontend. Ví dụ: 「Văn bản một dòng」, 「Số」, 「Menu thả xuống」, 「Ngày giờ」; đây là cách phân loại trường theo góc nhìn người dùng
- Field type (kiểu dữ liệu): quyết định cách NocoBase nhận diện kiểu dữ liệu của trường. Các trường trong view không có trường nguồn thường được suy luận dựa trên kiểu trường cơ sở dữ liệu, chẳng hạn như `string`, `integer`, `decimal`, `boolean`, `datetime`, v.v.

:::

:::warning Lưu ý

Điều chỉnh Field source, Field type hoặc Field interface không đồng nghĩa với việc thay đổi kiểu trường trong database view. Các điều chỉnh này chủ yếu ảnh hưởng đến cách hiển thị trên trang, quy tắc xác thực và cách NocoBase nhận diện trường.

:::

### Đồng bộ từ cơ sở dữ liệu

Nếu phía cơ sở dữ liệu đã thay đổi cấu trúc trường của view, có thể truy cập 「Configure fields」 rồi nhấp vào 「Sync from database」 để đọc lại cấu trúc trường. Sau khi đồng bộ, NocoBase sẽ cập nhật các trường: thêm các trường mới xuất hiện trong view, xóa các trường đã bị xóa khỏi view và xác nhận lại kiểu trường cũng như nguồn trường.

![edit_view_sync_from_database](https://static-docs.nocobase.com/edit_view_sync_from_database.png)
![edit_view_sync_from_database_configure](https://static-docs.nocobase.com/edit_view_sync_from_database_configure.png)

:::warning Lưu ý

Khi đồng bộ, việc đổi tên trường thường được thể hiện thành “xóa trường cũ + thêm trường mới”. Trước khi đồng bộ, hãy xác nhận trường cũ có đang được trang, quyền hạn, workflow hoặc API bên ngoài sử dụng hay không để tránh cấu hình bị mất hiệu lực sau khi đồng bộ. Sau khi đồng bộ cũng cần kiểm tra lại Field type và Field interface.

:::

### Chỉnh sửa trường

Nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường. Việc chỉnh sửa trường phù hợp khi cần điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, quy tắc xác thực hoặc cấu hình riêng của trường.
[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

![edit_field](https://static-docs.nocobase.com/edit_field.png)
![edit_field_configure](https://static-docs.nocobase.com/edit_field_configure.png)

:::warning Lưu ý

Chỉnh sửa cấu hình trường sẽ không thay đổi tên cột thực, kiểu trường, biểu thức SQL hoặc chỉ mục trong database view. Nếu cần điều chỉnh cấu trúc thực của view, trước tiên hãy sửa view ở phía cơ sở dữ liệu, sau đó dùng 「Sync from database」 để đồng bộ.

:::

### Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa một trường. Việc xóa trường chỉ loại bỏ trường được lưu trong NocoBase, không xóa cột thực trong database view.

[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

![delete_field](https://static-docs.nocobase.com/delete_field.png)

:::warning Lưu ý

Việc xóa trường có thể ảnh hưởng đến các khối trên trang, điều kiện lọc, sắp xếp, quyền hạn, workflow, API và các cấu hình hiện có. Trước khi xóa, hãy xác nhận trường đó còn được sử dụng hay không. Nếu database view vẫn trả về cột này, trong lần thực hiện 「Sync from database」 tiếp theo, NocoBase có thể lại nhận diện trường đó.

:::

## Chỉnh sửa khung nhìn

Định nghĩa SQL của khung nhìn cơ sở dữ liệu được duy trì ở phía cơ sở dữ liệu. Trong danh sách bảng dữ liệu, nhấp vào 「Edit」 ở bên phải một khung nhìn cơ sở dữ liệu để điều chỉnh siêu dữ liệu và cấu hình vận hành của khung nhìn trong NocoBase; thao tác này không sửa view trong cơ sở dữ liệu. Nếu cần kết nối một database view khác, khuyến nghị tạo mới một bảng dữ liệu khung nhìn cơ sở dữ liệu.

![edit_view](https://static-docs.nocobase.com/edit_view.png)
![edit_view_configure](https://static-docs.nocobase.com/edit_view_configure.png)

| Cấu hình | Mô tả |
| --- | --- |
| Collection display name | Tên hiển thị của khung nhìn cơ sở dữ liệu trên giao diện. Có thể đổi thành tên mà nhân viên nghiệp vụ dễ hiểu, chẳng hạn như 「Khung nhìn báo cáo tài chính」 hoặc 「Khung nhìn thống kê khách hàng」. |
| Collection name | Tên định danh của khung nhìn cơ sở dữ liệu trong NocoBase. Không thể chỉnh sửa khi đang chỉnh sửa. |
| Database view | Database view hiện đang kết nối. Chỉ được đọc khi chỉnh sửa và không thể chuyển sang view khác. |
| Categories | Phân loại bảng dữ liệu. Chỉ ảnh hưởng đến cách tổ chức trong giao diện quản lý nguồn dữ liệu, không thay đổi database view. |
| Description | Mô tả bảng dữ liệu. Phù hợp để ghi người duy trì view, nguồn truy vấn, trang sử dụng hoặc mục đích báo cáo. |
| Use simple pagination mode | Chế độ phân trang đơn giản. Sau khi bật, khi phân trang khối bảng, hệ thống sẽ bỏ qua việc thống kê tổng số bản ghi, phù hợp với các view có lượng dữ liệu lớn. |
| Record unique key | Định danh duy nhất của bản ghi. Dùng để xác định một bản ghi, thường chọn trường hoặc tổ hợp trường ổn định và duy nhất trong view. |
| Allow add new, update and delete actions | Có cho phép thêm, cập nhật và xóa hay không. Chỉ nên bật khi database view hỗ trợ ghi dữ liệu và tài khoản cơ sở dữ liệu có quyền tương ứng. |

:::warning Lưu ý

Sau khi thay đổi Record unique key hoặc Allow add new, update and delete actions, cần kiểm tra lại xem các khối trên trang, quyền hạn và workflow có còn hoạt động đúng như mong đợi hay không.

:::

## Xóa khung nhìn

Trong danh sách bảng dữ liệu, nhấp vào 「Delete」 ở bên phải khung nhìn cơ sở dữ liệu để xóa bảng dữ liệu khung nhìn cơ sở dữ liệu. Việc xóa bảng dữ liệu khung nhìn cơ sở dữ liệu chỉ xóa cấu hình kết nối và các trường trong NocoBase, không xóa view trong cơ sở dữ liệu.

Các khung nhìn cơ sở dữ liệu trong cơ sở dữ liệu chính cũng hỗ trợ chọn nhiều mục rồi xóa đồng thời. Trước khi xóa, cần kiểm tra xem các khối trên trang, biểu đồ, quyền hạn, workflow và API bên ngoài còn sử dụng bảng dữ liệu khung nhìn cơ sở dữ liệu này hay không.
![delete_view](https://static-docs.nocobase.com/delete_view.png)
![delete_view_second_confirmation](https://static-docs.nocobase.com/delete_view_second_confirmation.png)
