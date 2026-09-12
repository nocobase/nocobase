---
title: "Lựa chọn đơn"
description: "Trường lựa chọn đơn dùng để chọn một giá trị từ các tùy chọn có sẵn, phù hợp với các trường như trạng thái, cấp độ, loại hình."
keywords: "lựa chọn đơn,select,trường tùy chọn,NocoBase"
---

# Lựa chọn đơn

## Giới thiệu

Trong NocoBase, **lựa chọn đơn (Select)** dùng để chọn một giá trị từ một nhóm tùy chọn.

Lựa chọn đơn phù hợp với các trường nghiệp vụ có phạm vi cố định như trạng thái, cấp độ, loại hình, nguồn. Có thể cấu hình tên hiển thị, giá trị tùy chọn và màu sắc cho từng tùy chọn.

Nếu cần chọn nhiều giá trị, hãy chọn [lựa chọn nhiều](./multiple-select.md). Nếu chỉ có hai giá trị có hoặc không, hãy chọn [hộp kiểm](./checkbox.md).

## Trường hợp sử dụng

Lựa chọn đơn phù hợp với các trường hợp nghiệp vụ sau:

- Trạng thái đơn hàng, trạng thái công việc, trạng thái phê duyệt
- Cấp độ khách hàng, nguồn khách hàng tiềm năng, mức độ ưu tiên
- Loại dự án, loại tài sản, loại hợp đồng
- Các trường chỉ cho phép chọn một giá trị trong một phạm vi cố định

## Tạo cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Lựa chọn đơn」 để tạo trường lựa chọn đơn.

![20240512180203](https://static-docs.nocobase.com/20240512180203.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Lựa chọn đơn tương ứng với `select`, quyết định cách nhập và hiển thị dữ liệu trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Trạng thái đơn hàng」, 「Cấp độ khách hàng」, 「Mức độ ưu tiên」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, workflow và các chức năng khác. Thông thường không thể sửa sau khi tạo; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường trong tầng dữ liệu. Lựa chọn đơn mặc định là `string`, dùng để lưu giá trị của tùy chọn đã chọn. |
| Default value | Giá trị mặc định. Khi thêm bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Thông thường dùng để thiết lập trường bắt buộc và duy trì các giá trị tùy chọn. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Sau khi được tạo, tên trường sẽ được các khối trang, quyền, workflow và API tham chiếu. Hãy xác nhận quy tắc đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình khi sửa đổi về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường lựa chọn đơn như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `select`。 |
| Field type mặc định | `string`。 |
| Field type có thể chọn | `string`。 |
| Thành phần trên trang | Chế độ chỉnh sửa sử dụng bộ chọn thả xuống. |
| Lọc | Hỗ trợ lọc theo tùy chọn. |
| Sắp xếp | Hỗ trợ sắp xếp theo giá trị tùy chọn. |
| Xác thực | Hỗ trợ ràng buộc trường bắt buộc và phạm vi tùy chọn. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường lựa chọn đơn. Chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu sang Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh trường cơ sở dữ liệu chính hoặc trường đồng bộ khi ánh xạ trường. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh trường cơ sở dữ liệu chính hoặc trường đồng bộ khi ánh xạ trường. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến workflow. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường lựa chọn đơn. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường lựa chọn đơn được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, workflow, API, chức năng nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường lựa chọn đơn phù hợp để sử dụng trong biểu mẫu, bảng, bảng kanban và bộ lọc.
![20260709225912](https://static-docs.nocobase.com/20260709225912.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Chọn một giá trị từ các tùy chọn trong danh sách thả xuống. |
| Khối bảng | Hiển thị tùy chọn dưới dạng nhãn hoặc văn bản. |
| Khối kanban | Nhóm theo các tùy chọn như trạng thái, giai đoạn. |
| Khối bộ lọc | Lọc nhanh bản ghi theo tùy chọn. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về tác dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Lựa chọn nhiều](./multiple-select.md) — Chọn nhiều giá trị từ các tùy chọn
- [Nhóm nút radio](./radio-group.md) — Chọn một giá trị theo dạng nhóm nút
