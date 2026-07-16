---
title: "Email"
description: "Trường email dùng để lưu địa chỉ email và cung cấp tính năng kiểm tra định dạng email."
keywords: "email,email,thông tin liên hệ,NocoBase"
---

# Email

## Giới thiệu

Trong NocoBase, **email (Email)** dùng để lưu địa chỉ email.

Trường email phù hợp với email khách hàng, email nhân viên, email nhà cung cấp và các thông tin liên hệ khác. So với văn bản một dòng thông thường, trường này cung cấp ngữ nghĩa email rõ ràng hơn và hỗ trợ kiểm tra định dạng.

Nếu nội dung không phải là địa chỉ email mà chỉ là thông tin liên hệ thông thường, nên chọn [văn bản một dòng](./input.md).

## Các trường hợp sử dụng

Trường email phù hợp với các trường hợp nghiệp vụ sau:

- Email khách hàng, email người liên hệ
- Email nhân viên, email liên hệ đăng nhập
- Email nhà cung cấp, email dịch vụ
- Địa chỉ nhận thông báo

## Tạo và cấu hình

Trong trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Email」 để tạo trường email.

![20240512175609](https://static-docs.nocobase.com/20240512175609.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Email tương ứng với `email`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Email khách hàng」, 「Email người liên hệ」 hoặc 「Email nhận thư」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình công việc và các thành phần khác. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Theo mặc định, trường email là `string`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc kiểm tra. Thông thường cần bật kiểm tra định dạng email và có thể cấu hình bắt buộc nhập. |
| Description | Mô tả trường. Phù hợp để ghi rõ ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình công việc và API tham chiếu sau khi tạo. Hãy xác nhận quy tắc đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình khi thay đổi về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường email như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `email`. |
| Field type mặc định | `string`. |
| Field type có thể chọn | `string`. |
| Thành phần trên trang | Chế độ chỉnh sửa sử dụng ô nhập và kiểm tra theo định dạng email. |
| Lọc | Hỗ trợ các kiểu lọc văn bản như chứa, bằng, rỗng và không rỗng. |
| Sắp xếp | Hỗ trợ sắp xếp trong khối bảng. |
| Kiểm tra | Hỗ trợ kiểm tra định dạng email, bắt buộc nhập và các quy tắc khác. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường email. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc kiểm tra hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là lập ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Có thể chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ tùy điều kiện | Có thể điều chỉnh khi lập ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và kiểm tra trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ tùy điều kiện | Có thể điều chỉnh khi lập ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi. |
| Validation rules | Có | Điều chỉnh quy tắc kiểm tra của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không đơn giản chỉ là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập, quy tắc kiểm tra, điều kiện lọc và cách sử dụng biến trong quy trình công việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước rằng định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường email. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường email được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình công việc, API, việc nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó không còn được các cấu hình nghiệp vụ tham chiếu.

:::

## Sử dụng trong cấu hình trang

Trường email phù hợp để sử dụng trong biểu mẫu, trang chi tiết và quy trình thông báo.
![20260709224700](https://static-docs.nocobase.com/20260709224700.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Nhập địa chỉ email. |
| Khối chi tiết | Hiển thị địa chỉ email. |
| Khối lọc | Lọc bản ghi theo địa chỉ email. |
| Quy trình công việc và thông báo | Làm nguồn người nhận cho thông báo email. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Văn bản một dòng](./input.md) — Lưu văn bản ngắn thông thường
- [Số điện thoại](./phone.md) — Lưu số điện thoại liên hệ