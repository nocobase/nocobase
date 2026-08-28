---
title: "Ngày tạo"
description: "Trường ngày tạo dùng để tự động ghi lại thời điểm tạo bản ghi."
keywords: "Ngày tạo,createdAt,trường hệ thống,NocoBase"
---

# Ngày tạo

## Giới thiệu

Trong NocoBase, **Ngày tạo (Created at)** được dùng để tự động ghi lại thời điểm tạo bản ghi.

Ngày tạo thường được tạo bởi trường cài sẵn. Trường này phù hợp để sắp xếp, lọc, kiểm toán, làm điều kiện cho quy trình công việc và thống kê dữ liệu.

Nếu cần nhập thủ công ngày nghiệp vụ, chẳng hạn như ngày ký hợp đồng hoặc ngày hết hạn, hãy sử dụng [Ngày](../datetime/date.md) hoặc [Ngày giờ](../datetime/datetime.md).

## Trường hợp sử dụng

Ngày tạo phù hợp với các trường hợp nghiệp vụ sau:

- Sắp xếp theo thời gian tạo
- Lọc dữ liệu được tạo trong một khoảng thời gian
- Kiểm toán thời điểm tạo bản ghi
- Xác định thời điểm tạo bản ghi mới trong quy trình công việc

## Cấu hình tạo

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Ngày tạo」 để tạo trường ngày tạo.

![20240512174347](https://static-docs.nocobase.com/20240512174347.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Ngày tạo tương ứng với `createdAt`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Ngày tạo」 hoặc 「Thời gian tạo」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình công việc và các chức năng khác. Thông thường không nên chỉnh sửa sau khi tạo; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Ngày tạo thường sử dụng `date`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Được hệ thống tự động duy trì, thông thường không cần kiểm tra thủ công. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình công việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường ngày tạo như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `createdAt`. |
| Field type mặc định | `date`. |
| Field type tùy chọn | `date`. |
| Thành phần trên trang | Được hệ thống tự động ghi lại, thường chỉ hiển thị dạng chỉ đọc trên trang. |
| Lọc | Hỗ trợ lọc theo thời gian và khoảng thời gian. |
| Sắp xếp | Hỗ trợ sắp xếp theo thời gian. |
| Kiểm tra | Được hệ thống tự động ghi lại. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường ngày tạo. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc kiểm tra hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và kiểm tra trên trang sẽ thay đổi. |
| Field type | Có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi. |
| Validation rules | Có | Điều chỉnh quy tắc kiểm tra trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Việc này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc kiểm tra, điều kiện lọc và cách sử dụng biến quy trình công việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường ngày tạo. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường ngày tạo được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình công việc, API, chức năng nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó không còn được các cấu hình nghiệp vụ tham chiếu.

:::

## Sử dụng trong cấu hình trang

Trường ngày tạo phù hợp để sử dụng trong danh sách, chi tiết, bộ lọc và kiểm toán.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Trường hợp | Mục đích |
| --- | --- |
| Khối bảng | Hiển thị và sắp xếp thời gian tạo. |
| Khối bộ lọc | Lọc các bản ghi được tạo trong một khoảng thời gian. |
| Khối chi tiết | Xem thời điểm tạo bản ghi. |
| Quy trình công việc | Tham gia phán đoán với tư cách là điều kiện thời gian. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu chức năng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Ngày giờ (kèm múi giờ)](../datetime/datetime.md) — Lưu thời gian nghiệp vụ
- [Ngày cập nhật](./updated-at.md) — Tự động ghi lại thời điểm cập nhật
