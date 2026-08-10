---
title: "Người cập nhật"
description: "Trường Người cập nhật được dùng để tự động ghi lại người dùng đã cập nhật bản ghi lần cuối."
keywords: "Người cập nhật,updatedBy,trường hệ thống,người dùng,NocoBase"
---

# Người cập nhật

## Giới thiệu

Trong NocoBase, **Người cập nhật (Updated by)** được dùng để tự động ghi lại người dùng đã cập nhật bản ghi lần cuối.

Người cập nhật thường được tạo bởi trường thiết lập sẵn. Trường này phù hợp cho việc kiểm toán, theo dõi trách nhiệm, lọc và làm điều kiện cho quy trình làm việc.

Nếu muốn thể hiện người phụ trách nghiệp vụ, người xử lý hoặc người phê duyệt, bạn nên tạo riêng một trường quan hệ người dùng.

## Trường hợp sử dụng

Người cập nhật phù hợp với các trường hợp nghiệp vụ sau:

- Xem người bảo trì cuối cùng
- Lọc bản ghi theo người cập nhật
- Kiểm toán ai đã sửa đổi dữ liệu
- Thông báo cho người cập nhật cuối cùng trong quy trình làm việc

## Tạo cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Người cập nhật」 để tạo trường Người cập nhật.

![index-2025-11-01-00-51-12](https://static-docs.nocobase.com/index-2025-11-01-00-51-12.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Người cập nhật tương ứng với `updatedBy`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Người cập nhật」 hoặc 「Người sửa đổi cuối cùng」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể trực tiếp hiểu được. |
| Field name | Tên định danh của trường, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc, v.v. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Người cập nhật thường là trường quan hệ `belongsTo` trỏ đến bảng người dùng. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Được hệ thống tự động duy trì, thông thường không cần kiểm tra thủ công. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình làm việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm trường

Hành vi mặc định của trường Người cập nhật như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Default Field interface | `updatedBy`. |
| Default Field type | `belongsTo`. |
| Field type tùy chọn | `belongsTo`. |
| Thành phần trên trang | Được hệ thống tự động ghi vào; trên trang thường được hiển thị bằng thành phần hiển thị người dùng. |
| Lọc | Hỗ trợ lọc theo người dùng. |
| Sắp xếp | Thông thường không sắp xếp theo người cập nhật. |
| Kiểm tra | Được hệ thống tự động ghi vào. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường Người cập nhật. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc kiểm tra hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng trong cơ sở dữ liệu chính đã được đồng bộ, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu với Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Các trường trong cơ sở dữ liệu chính hoặc trường đồng bộ có thể được điều chỉnh khi ánh xạ trường. Việc điều chỉnh sẽ ảnh hưởng đến cách nhập, hiển thị và kiểm tra trên trang. |
| Field type | Hỗ trợ có điều kiện | Các trường trong cơ sở dữ liệu chính hoặc trường đồng bộ có thể được điều chỉnh khi ánh xạ trường. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc kiểm tra trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập, quy tắc kiểm tra, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có phù hợp hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường Người cập nhật. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường Người cập nhật được tạo trong cơ sở dữ liệu chính, thông thường cột thực tế trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường Người cập nhật phù hợp để sử dụng trong việc kiểm toán, lọc và quy trình làm việc.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối bảng | Hiển thị người cập nhật cuối cùng. |
| Khối lọc | Lọc bản ghi theo người cập nhật. |
| Khối chi tiết | Xem người bảo trì cuối cùng. |
| Quy trình làm việc | Làm đối tượng nhận thông báo hoặc trường điều kiện. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Người tạo](./created-by.md) — Tự động ghi lại người dùng đã tạo
- [Trường quan hệ](../associations/index.md) — Tạo quan hệ người dùng như người phụ trách nghiệp vụ
