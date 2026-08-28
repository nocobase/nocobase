---
title: "Chọn nhiều từ danh sách thả xuống"
description: "Trường chọn nhiều từ danh sách thả xuống dùng để chọn nhiều giá trị từ các tùy chọn được thiết lập trước, phù hợp với các trường như thẻ, năng lực và tùy chọn."
keywords: "chọn nhiều từ danh sách thả xuống,multiple select,thẻ,trường tùy chọn,NocoBase"
---

# Chọn nhiều từ danh sách thả xuống

## Giới thiệu

Trong NocoBase, **chọn nhiều từ danh sách thả xuống (Multiple select)** dùng để chọn nhiều giá trị từ một nhóm tùy chọn.

Trường chọn nhiều từ danh sách thả xuống phù hợp với các trường như thẻ, năng lực, tùy chọn và phạm vi áp dụng. Trường này lưu nhiều giá trị tùy chọn và thường hiển thị dưới dạng thẻ trên trang.

Nếu chỉ có thể chọn một giá trị, hãy chọn [chọn một từ danh sách thả xuống](./select.md) hoặc [nhóm nút radio](./radio-group.md).

## Các trường hợp sử dụng

Trường chọn nhiều từ danh sách thả xuống phù hợp với các trường hợp nghiệp vụ sau:

- Thẻ khách hàng, tùy chọn của người dùng
- Phạm vi áp dụng của sản phẩm, năng lực của thiết bị
- Điểm rủi ro của dự án, phân loại vấn đề
- Các trường có thể chọn nhiều giá trị cố định

## Tạo và cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Chọn nhiều từ danh sách thả xuống」 để tạo trường chọn nhiều từ danh sách thả xuống.

![20240512180236](https://static-docs.nocobase.com/20240512180236.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Chọn nhiều từ danh sách thả xuống tương ứng với `multipleSelect`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Thẻ khách hàng」, 「Phạm vi áp dụng」 hoặc 「Phân loại vấn đề」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc, v.v. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường chọn nhiều từ danh sách thả xuống thường được lưu dưới dạng mảng hoặc JSON, tùy theo cấu hình trường và khả năng của nguồn dữ liệu. |
| Default value | Giá trị mặc định. Khi thêm bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Thường dùng để cấu hình trường bắt buộc và phạm vi tùy chọn. |
| Description | Mô tả trường. Có thể dùng để ghi ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình làm việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường chọn nhiều từ danh sách thả xuống như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `multipleSelect`. |
| Field type mặc định | `array`. |
| Field type có thể chọn | `array`, `json`, tùy theo ánh xạ trường thực tế. |
| Thành phần trên trang | Ở chế độ chỉnh sửa, sử dụng bộ chọn nhiều giá trị dạng danh sách thả xuống. |
| Lọc | Hỗ trợ lọc theo việc chứa một tùy chọn cụ thể. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ ràng buộc trường bắt buộc và phạm vi tùy chọn. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường chọn nhiều từ danh sách thả xuống. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là thực hiện ánh xạ trường — ánh xạ trường cơ sở dữ liệu với Field type và Field interface của NocoBase.

| Cấu hình | Có thể chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Việc điều chỉnh sẽ ảnh hưởng đến cách nhập, hiển thị và xác thực trên trang. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Chuyển đổi Field type hoặc Field interface không giống như chỉ thay đổi tên hiển thị. Việc này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường chọn nhiều từ danh sách thả xuống. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường chọn nhiều từ danh sách thả xuống được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế trong cơ sở dữ liệu và dữ liệu hiện có của cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Việc xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, chức năng nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường chọn nhiều từ danh sách thả xuống phù hợp để biểu đạt nhiều thẻ hoặc nhiều tùy chọn cố định.
![20260709230017](https://static-docs.nocobase.com/20260709230017.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Chọn nhiều giá trị từ các tùy chọn. |
| Khối bảng | Hiển thị các tùy chọn dưới dạng nhiều thẻ. |
| Khối lọc | Lọc theo việc chứa một số thẻ nhất định. |
| Quy trình làm việc và quyền hạn | Tham gia phán đoán với tư cách là điều kiện chứa, không chứa, v.v. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Chọn một từ danh sách thả xuống](./select.md) — Chọn một giá trị từ các tùy chọn
- [Nhóm hộp kiểm](./checkbox-group.md) — Chọn nhiều giá trị bằng hộp kiểm
