---
title: "Số"
description: "Trường số dùng để lưu các giá trị số có thể có phần thập phân, chẳng hạn như số tiền, trọng lượng, điểm số và diện tích."
keywords: "số,number,double,decimal,NocoBase"
---

# Số

## Giới thiệu

Trong NocoBase, **số (Number)** được dùng để lưu các giá trị số có thể có phần thập phân.

Trường số phù hợp với các dữ liệu nghiệp vụ như số tiền, trọng lượng, diện tích, điểm số và đơn giá. Trường này có thể được dùng để lọc, sắp xếp, thống kê, tính công thức và làm điều kiện cho workflow.

Nếu giá trị bắt buộc phải là số nguyên, hãy chọn [Số nguyên](./integer.md) để sử dụng trực tiếp hơn. Nếu muốn hiển thị dưới dạng tỷ lệ hoặc phần trăm, hãy chọn [Phần trăm](./percent.md).

## Các trường hợp sử dụng

Số phù hợp với các trường hợp sử dụng nghiệp vụ sau:

- Số tiền đơn hàng, số tiền hợp đồng, đơn giá
- Trọng lượng, diện tích, thể tích, khoảng cách
- Điểm số, hệ số, giá trị trước chiết khấu
- Các số thập phân cần được dùng để thống kê hoặc tính toán công thức

## Cấu hình khi tạo

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Số」 để tạo trường số.

![20240512175752](https://static-docs.nocobase.com/20240512175752.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Số tương ứng với `number`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Số tiền đơn hàng」, 「Điểm số」 hoặc 「Trọng lượng」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, workflow và các chức năng khác. Sau khi tạo thường không thể chỉnh sửa, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Kiểu mặc định của trường số là `double`; trong các trường hợp cần số thập phân chính xác như số tiền, có thể chọn `decimal`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc kiểm tra. Có thể giới hạn giá trị nhỏ nhất, lớn nhất, độ chính xác hoặc xác định trường có bắt buộc hay không. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Sau khi tạo, tên trường sẽ được các khối trang, quyền hạn, workflow và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường số như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `number`. |
| Field type mặc định | `double`. |
| Field type có thể chọn | `float`, `double`, `decimal`. |
| Thành phần trên trang | Sử dụng ô nhập số ở chế độ chỉnh sửa. |
| Lọc | Hỗ trợ các điều kiện lọc số như bằng, khác, lớn hơn, nhỏ hơn, trong khoảng, trống và không trống. |
| Sắp xếp | Hỗ trợ sắp xếp trong khối bảng. |
| Kiểm tra | Hỗ trợ kiểm tra phạm vi giá trị, trường bắt buộc và các điều kiện khác. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường số. Việc chỉnh sửa trường chủ yếu nhằm điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc kiểm tra hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ theo điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Việc điều chỉnh sẽ ảnh hưởng đến cách nhập, hiển thị và kiểm tra trên trang. |
| Field type | Hỗ trợ theo điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc kiểm tra của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không đơn giản chỉ là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc kiểm tra, điều kiện lọc và cách sử dụng biến workflow. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường số. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường số được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, workflow, API, chức năng nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường số phù hợp để sử dụng trong việc nhập liệu, thống kê, biểu đồ và phán đoán workflow.
![20260709225103](https://static-docs.nocobase.com/20260709225103.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Nhập các giá trị như số tiền, điểm số và trọng lượng. |
| Khối bảng | Hiển thị, sắp xếp và lọc các giá trị số. |
| Khối biểu đồ | Tổng hợp, tính tổng hoặc tính trung bình theo trường số. |
| Trường công thức | Làm trường đầu vào cho phép tính công thức. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Số nguyên](./integer.md) — Lưu các giá trị số không có phần thập phân
- [Phần trăm](./percent.md) — Lưu tỷ lệ hoặc tỷ lệ hoàn thành
- [Công thức](../../../field-formula/index.md) — Tính toán kết quả dựa trên trường số