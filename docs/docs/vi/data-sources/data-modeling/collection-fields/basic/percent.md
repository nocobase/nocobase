---
title: "Phần trăm"
description: "Trường phần trăm dùng để lưu tỷ lệ hoàn thành, tỷ lệ chiết khấu, tỷ lệ chuyển đổi và các dữ liệu tỷ lệ khác."
keywords: "phần trăm,percent,tỷ lệ,tỷ lệ hoàn thành,NocoBase"
---

# Phần trăm

## Giới thiệu

Trong NocoBase, **phần trăm (Percent)** được dùng để lưu và hiển thị dữ liệu tỷ lệ.

Trường phần trăm phù hợp với các dữ liệu nghiệp vụ như tỷ lệ hoàn thành, tỷ lệ chiết khấu, tỷ lệ chuyển đổi và tỷ trọng. Về bản chất, đây là một trường số, nhưng cách hiển thị và nhập liệu trên trang phù hợp hơn với ngữ nghĩa phần trăm.

Nếu chỉ cần lưu số tiền, số lượng hoặc điểm số thông thường, lựa chọn [số](./number.md) sẽ phù hợp hơn.

## Các trường hợp sử dụng

Phần trăm phù hợp với các trường hợp nghiệp vụ sau:

- Tỷ lệ hoàn thành dự án, tiến độ nhiệm vụ
- Tỷ lệ chiết khấu, thuế suất, tỷ lệ hoa hồng
- Tỷ lệ chuyển đổi, tỷ lệ đạt được, tỷ trọng
- Trọng số đánh giá, tỷ lệ phân bổ

## Tạo và cấu hình

Trong trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「百分比」 để tạo trường phần trăm.

![20240512175847](https://static-docs.nocobase.com/20240512175847.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Phần trăm tương ứng với `percent`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Tỷ lệ hoàn thành」「Tỷ lệ chiết khấu」「Tỷ lệ chuyển đổi」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc và các thành phần khác. Sau khi tạo thường không nên thay đổi, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường phần trăm thường sử dụng `double`, cũng có thể chọn `decimal` tùy theo yêu cầu về độ chính xác. |
| Default value | Giá trị mặc định. Khi thêm bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể giới hạn giá trị nhỏ nhất, lớn nhất hoặc quy định trường có bắt buộc hay không. |
| Description | Mô tả trường. Thích hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Tên trường sau khi tạo sẽ được các khối trang, quyền hạn, quy trình làm việc và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường phần trăm như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `percent`. |
| Field type mặc định | `double`. |
| Field type có thể chọn | `float`、`double`、`decimal`. |
| Thành phần trên trang | Chế độ chỉnh sửa sử dụng thành phần nhập phần trăm. |
| Lọc | Hỗ trợ lọc theo giá trị số, chẳng hạn như lớn hơn, nhỏ hơn, trong khoảng, rỗng hoặc không rỗng. |
| Sắp xếp | Hỗ trợ sắp xếp trong khối bảng. |
| Xác thực | Hỗ trợ xác thực phạm vi số, trường bắt buộc và các quy tắc khác. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường phần trăm. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường phần trăm. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường phần trăm được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Việc xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, thao tác nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó không còn được các cấu hình nghiệp vụ tham chiếu.

:::

## Sử dụng trong cấu hình trang

Trường phần trăm phù hợp để biểu đạt tỷ lệ trong biểu mẫu nghiệp vụ, bảng điều khiển, biểu đồ và báo cáo.
![20260709225150](https://static-docs.nocobase.com/20260709225150.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Nhập tỷ lệ hoàn thành, tỷ lệ chiết khấu, thuế suất và các tỷ lệ khác. |
| Khối bảng | Hiển thị, sắp xếp và lọc dữ liệu tỷ lệ. |
| Khối biểu đồ | Hiển thị các chỉ số như tỷ trọng và tỷ lệ chuyển đổi. |
| Quy trình làm việc và quyền hạn | Dùng làm trường điều kiện để tham gia判断, chẳng hạn như xác định tỷ lệ hoàn thành có đạt 100% hay không. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về công dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Số](./number.md) — Lưu các giá trị số thông thường
- [Công thức](../../../field-formula/index.md) — Tính toán kết quả tỷ lệ
