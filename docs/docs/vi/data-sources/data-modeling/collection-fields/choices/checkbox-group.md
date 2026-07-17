---
title: "Nhóm hộp kiểm"
description: "Trường nhóm hộp kiểm dùng để hiển thị nhiều tùy chọn theo hàng trên trang và cho phép chọn nhiều giá trị."
keywords: "Nhóm hộp kiểm,checkbox group,chọn nhiều,tùy chọn trường,NocoBase"
---

# Nhóm hộp kiểm

## Giới thiệu

Trong NocoBase, **nhóm hộp kiểm (Checkbox group)** được dùng để chọn nhiều giá trị từ một nhóm tùy chọn và hiển thị trực tiếp các tùy chọn này trong biểu mẫu.

Nhóm hộp kiểm phù hợp với các trường hợp có ít tùy chọn và cần chọn nhiều giá trị. Cách này tương tự như chọn nhiều trong danh sách thả xuống, điểm khác biệt chủ yếu nằm ở phương thức tương tác trên trang.

Nếu có nhiều tùy chọn, hãy chọn [chọn nhiều trong danh sách thả xuống](./multiple-select.md) để tiết kiệm không gian. Nếu chỉ được chọn một tùy chọn, hãy chọn [nhóm nút radio](./radio-group.md)。

## Trường hợp sử dụng

Nhóm hộp kiểm phù hợp với các trường hợp nghiệp vụ sau:

- Phạm vi dịch vụ, kênh áp dụng
- Các mục chọn quyền chức năng
- Thẻ nhu cầu khách hàng
- Các tùy chọn chọn nhiều cố định với số lượng ít

## Tạo cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Nhóm hộp kiểm」 để tạo trường nhóm hộp kiểm.
![20260709231244](https://static-docs.nocobase.com/20260709231244.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Nhóm hộp kiểm tương ứng với `checkboxGroup`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Phạm vi dịch vụ」「Kênh áp dụng」「Thẻ nhu cầu」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, quy trình làm việc, v.v. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại trường ở tầng dữ liệu. Nhóm hộp kiểm thường được lưu dưới dạng mảng hoặc JSON, tùy theo cấu hình trường và khả năng của nguồn dữ liệu. |
| Default value | Giá trị mặc định. Khi tạo bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Thông thường dùng để cấu hình trường bắt buộc và phạm vi tùy chọn. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách. |

:::warning Lưu ý

Sau khi tạo, tên trường sẽ được các khối trang, quyền, quy trình làm việc và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm trường

Hành vi mặc định của trường nhóm hộp kiểm như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Mặc định Field interface | `checkboxGroup`。 |
| Mặc định Field type | `array`。 |
| Field type có thể chọn | `array`、`json`, tùy theo ánh xạ trường thực tế. |
| Thành phần trên trang | Sử dụng nhóm hộp kiểm ở chế độ chỉnh sửa. |
| Lọc | Hỗ trợ lọc theo việc chứa một tùy chọn. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ ràng buộc trường bắt buộc và phạm vi tùy chọn. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường nhóm hộp kiểm. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi tạo bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không đơn giản chỉ là thay đổi tên hiển thị. Điều này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường nhóm hộp kiểm. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường nhóm hộp kiểm được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế trong cơ sở dữ liệu và dữ liệu hiện có của cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, quy trình làm việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Nhóm hộp kiểm phù hợp để hiển thị trực tiếp một số ít tùy chọn chọn nhiều trong biểu mẫu.
![20260709230421](https://static-docs.nocobase.com/20260709230421.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Hiển thị trực tiếp tất cả tùy chọn và cho phép chọn nhiều tùy chọn. |
| Khối chi tiết | Hiển thị nhiều tùy chọn dưới dạng thẻ hoặc văn bản. |
| Khối bộ lọc | Lọc theo việc chứa một số tùy chọn. |
| Quy trình làm việc và quyền | Tham gia phán đoán với tư cách điều kiện chứa, không chứa, v.v. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Chọn nhiều trong danh sách thả xuống](./multiple-select.md) — Sử dụng khi có nhiều tùy chọn
- [Nhóm nút radio](./radio-group.md) — Chọn một giá trị