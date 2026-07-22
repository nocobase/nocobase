---
title: "Số điện thoại"
description: "Trường số điện thoại dùng để lưu số điện thoại, số liên hệ và các văn bản dạng số điện thoại khác, đồng thời cung cấp tính năng kiểm tra định dạng."
keywords: "số điện thoại,phone,điện thoại,thông tin liên hệ,NocoBase"
---

# Số điện thoại

## Giới thiệu

Trong NocoBase, **số điện thoại (Phone)** được dùng để lưu số điện thoại hoặc số liên hệ.

Trường số điện thoại phù hợp với các thông tin liên hệ như số điện thoại khách hàng, số điện thoại người liên hệ và số điện thoại nhân viên. So với văn bản thông thường, trường này phù hợp hơn để biểu đạt dữ liệu dạng số điện thoại.

Nếu cần lưu nhiều số điện thoại hoặc thông tin liên hệ phức tạp, bạn có thể sử dụng [văn bản nhiều dòng](./textarea.md) hoặc tạo riêng một bảng liên hệ.

## Các trường hợp sử dụng

Trường số điện thoại phù hợp với các trường hợp nghiệp vụ sau:

- Số điện thoại khách hàng, số điện thoại người liên hệ
- Số điện thoại nhân viên, số điện thoại dự phòng
- Số điện thoại cửa hàng, đường dây hỗ trợ
- Số điện thoại nhận thông báo SMS

## Tạo và cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Số điện thoại」 để tạo trường số điện thoại.

![20240512175526](https://static-docs.nocobase.com/20240512175526.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Số điện thoại tương ứng với `phone`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Số điện thoại」「Số liên hệ」「Đường dây hỗ trợ」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, workflow và các chức năng khác. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Trường số điện thoại mặc định là `string`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể cấu hình độ dài, biểu thức chính quy hoặc bắt buộc nhập. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Tên trường sau khi tạo sẽ được các khối trang, quyền hạn, workflow và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường số điện thoại như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `phone`. |
| Field type mặc định | `string`. |
| Field type có thể chọn | `string`. |
| Thành phần trên trang | Ở chế độ chỉnh sửa, sử dụng ô nhập liệu và có thể cấu hình kiểm tra định dạng số điện thoại. |
| Lọc | Hỗ trợ các điều kiện lọc dạng văn bản, chẳng hạn như chứa, bằng, trống và không trống. |
| Sắp xếp | Hỗ trợ sắp xếp trong khối bảng. |
| Xác thực | Hỗ trợ xác thực độ dài, biểu thức chính quy, bắt buộc nhập và các điều kiện khác. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường số điện thoại. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, khi chỉnh sửa thường là thực hiện ánh xạ trường — ánh xạ trường cơ sở dữ liệu sang Field type và Field interface của NocoBase.

| Cấu hình | Được phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh trường cơ sở dữ liệu chính hoặc trường đồng bộ khi ánh xạ trường. Việc điều chỉnh sẽ ảnh hưởng đến cách nhập, hiển thị và xác thực trên trang. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh trường cơ sở dữ liệu chính hoặc trường đồng bộ khi ánh xạ trường. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Việc này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến workflow. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường số điện thoại. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường số điện thoại được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực và dữ liệu hiện có trong cột đó cũng sẽ bị xóa khỏi cơ sở dữ liệu. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, workflow, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường số điện thoại phù hợp để sử dụng trong các biểu mẫu, trang chi tiết, bộ lọc và thông báo.
![20260709224555](https://static-docs.nocobase.com/20260709224555.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Nhập số điện thoại hoặc số liên hệ. |
| Khối chi tiết | Hiển thị thông tin liên hệ. |
| Khối lọc | Lọc bản ghi theo số điện thoại hoặc một phần của số. |
| Workflow và thông báo | Làm nguồn số điện thoại cho các thông báo SMS và thông báo qua điện thoại. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Văn bản một dòng](./input.md) — Lưu văn bản ngắn thông thường
- [Email](./email.md) — Lưu địa chỉ email