---
title: "Người tạo"
description: "Trường người tạo dùng để tự động ghi lại người dùng đã tạo một bản ghi."
keywords: "Người tạo,createdBy,trường hệ thống,người dùng,NocoBase"
---

# Người tạo

## Giới thiệu

Trong NocoBase, **Người tạo (Created by)** được dùng để tự động ghi lại người tạo bản ghi.

Người tạo thường được tạo bởi trường cài sẵn. Trường này phù hợp cho việc kiểm soát quyền, truy vết trách nhiệm, lọc và kiểm toán.

Nếu muốn thể hiện người phụ trách nghiệp vụ, người xử lý hoặc người phê duyệt, nên tạo riêng một trường quan hệ người dùng, không nên dùng chung với trường người tạo.

## Các trường hợp sử dụng

Người tạo phù hợp với các trường hợp nghiệp vụ sau:

- Chỉ xem dữ liệu do tôi tạo
- Lọc bản ghi theo người tạo
- Kiểm toán trách nhiệm tạo bản ghi
- Phán đoán người tạo bản ghi trong quy trình làm việc

## Cấu hình tạo

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Người tạo」 để tạo trường người tạo.

![index-2025-11-01-00-50-59](https://static-docs.nocobase.com/index-2025-11-01-00-50-59.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Người tạo tương ứng với `createdBy`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Người tạo」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, quy trình làm việc và các thành phần khác. Sau khi tạo thường không thể thay đổi, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Người tạo thường là trường quan hệ `belongsTo` trỏ đến bảng người dùng. |
| Default value | Giá trị mặc định. Khi thêm bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Được hệ thống tự động duy trì, thường không cần kiểm tra thủ công. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa trường, yêu cầu nhập, nguồn dữ liệu hoặc người duy trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền, quy trình làm việc và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình khi thay đổi sau này.

:::

## Đặc điểm trường

Hành vi mặc định của trường người tạo như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Default Field interface | `createdBy`. |
| Default Field type | `belongsTo`. |
| Field type có thể chọn | `belongsTo`. |
| Thành phần trang | Được hệ thống tự động ghi vào, trên trang thường được hiển thị bằng thành phần chọn người dùng hoặc hiển thị người dùng. |
| Lọc | Hỗ trợ lọc theo người dùng. |
| Sắp xếp | Thông thường không sắp xếp theo người tạo. |
| Kiểm tra | Được hệ thống tự động ghi vào. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường người tạo. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc kiểm tra hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể thay đổi trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và kiểm tra trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc kiểm tra trường. |
| Description | Có | Bổ sung ý nghĩa trường, yêu cầu nhập, nguồn dữ liệu hoặc người duy trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập, quy tắc kiểm tra, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường người tạo. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường người tạo được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Việc xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, quy trình làm việc, API, việc nhập xuất và dữ liệu hiện có. Hãy xác nhận trước khi xóa xem trường còn được cấu hình nghiệp vụ nào tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường người tạo phù hợp để sử dụng trong quyền, bộ lọc, kiểm toán và quy trình làm việc.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Trường hợp | Mục đích |
| --- | --- |
| Khối bảng | Hiển thị người tạo. |
| Khối lọc | Lọc bản ghi theo người tạo. |
| Quyền | Cấu hình các quy tắc như “chỉ xem dữ liệu do tôi tạo”. |
| Quy trình làm việc | Lấy người tạo để gửi thông báo hoặc thiết lập điều kiện. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về tác dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Người cập nhật](./updated-by.md) — Tự động ghi lại người dùng cập nhật lần cuối
- [Trường quan hệ](../associations/index.md) — Tạo quan hệ người dùng như người phụ trách nghiệp vụ
