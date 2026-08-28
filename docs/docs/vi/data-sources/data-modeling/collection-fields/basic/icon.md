---
title: "Biểu tượng"
description: "Trường biểu tượng dùng để lưu tên biểu tượng hoặc cấu hình biểu tượng, phù hợp với các dấu hiệu trực quan như danh mục, menu và trạng thái."
keywords: "biểu tượng,icon,trường,NocoBase"
---

# Biểu tượng

## Giới thiệu

Trong NocoBase, **biểu tượng (Icon)** được dùng để lưu định danh biểu tượng.

Trường biểu tượng phù hợp để thiết lập dấu hiệu trực quan cho danh mục, menu, trạng thái và lối vào. Trường này lưu giá trị biểu tượng, khi hiển thị trên trang sẽ được kết xuất bởi thành phần biểu tượng.

Nếu muốn tải lên hình ảnh thực, hãy chọn[Phần đính kèm](../media/field-attachment.md). Nếu chỉ muốn lưu mô tả biểu tượng, hãy chọn[Văn bản một dòng](./input.md).

## Các trường hợp áp dụng

Biểu tượng phù hợp với các trường hợp nghiệp vụ sau:

- Biểu tượng menu, biểu tượng lối vào chức năng
- Biểu tượng danh mục, biểu tượng nhãn
- Biểu tượng trạng thái, biểu tượng cấp độ
- Dấu hiệu trực quan trong bảng điều khiển hoặc thẻ

## Tạo cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Biểu tượng」 để tạo trường biểu tượng.

![20240512180027](https://static-docs.nocobase.com/20240512180027.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Biểu tượng tương ứng với `icon`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Biểu tượng menu」「Biểu tượng danh mục」「Biểu tượng trạng thái」. Khuyến nghị sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, quy trình công việc và các thành phần khác. Thông thường không chỉnh sửa sau khi tạo; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Kiểu mặc định của trường biểu tượng là `string`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Thông thường chỉ cần cấu hình bắt buộc nhập. |
| Description | Mô tả trường. Thích hợp để ghi ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền, quy trình công việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình khi sửa đổi sau này.

:::

## Đặc tính của trường

Hành vi mặc định của trường biểu tượng như sau:

| Đặc tính | Mô tả |
| --- | --- |
| Field interface mặc định | `icon`. |
| Field type mặc định | `string`. |
| Field type có thể chọn | `string`. |
| Thành phần trên trang | Sử dụng thành phần chọn biểu tượng ở chế độ chỉnh sửa. |
| Lọc | Thông thường không được dùng làm điều kiện lọc chính. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ các quy tắc xác thực cơ bản như bắt buộc nhập. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường biểu tượng. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là lập ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Thông thường không thể sửa tên định danh của trường trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi lập ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi lập ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không đơn giản chỉ là sửa tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình công việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường biểu tượng. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường biểu tượng được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, quy trình công việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Hãy xác nhận trước khi xóa xem trường có còn được cấu hình nghiệp vụ nào tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường biểu tượng phù hợp để tạo提示 trực quan trong danh sách, thẻ và trang chi tiết.
![20260709225630](https://static-docs.nocobase.com/20260709225630.png)

| Trường hợp | Mục đích |
| --- | --- |
| Khối biểu mẫu | Chọn biểu tượng. |
| Khối chi tiết | Hiển thị biểu tượng. |
| Danh sách hoặc thẻ | Làm dấu hiệu trực quan cho danh mục, trạng thái hoặc lối vào. |
| Quyền và quy trình công việc | Thông thường không được dùng làm trường điều kiện cốt lõi. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Màu sắc](./color.md) — Lưu định danh màu sắc
- [Phần đính kèm](../media/field-attachment.md) — Tải lên hình ảnh hoặc tệp
