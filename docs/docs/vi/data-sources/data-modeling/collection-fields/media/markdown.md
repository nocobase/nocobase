---
title: "Markdown"
description: "Trường Markdown dùng để lưu nội dung văn bản có cú pháp Markdown."
keywords: "Markdown,markdown,trường nội dung,NocoBase"
---

# Markdown

## Giới thiệu

Trong NocoBase, **Markdown (Markdown)** được dùng để lưu nội dung ở định dạng Markdown.

Trường Markdown phù hợp với tài liệu hướng dẫn, phương án xử lý, nội dung chính của cơ sở kiến thức, ghi chú thay đổi và các nội dung khác. Trường này lưu văn bản, khi hiển thị trên trang sẽ được kết xuất theo Markdown.

Nếu cần trải nghiệm chỉnh sửa WYSIWYG, bạn có thể chọn [Văn bản có định dạng](./rich-text.md) hoặc [Markdown Vditor](../../../field-markdown-vditor/index.md).

## Trường hợp sử dụng

Markdown phù hợp với các trường hợp nghiệp vụ sau:

- Nội dung chính của cơ sở kiến thức, tài liệu hướng dẫn
- Phương án xử lý, nhật ký khắc phục sự cố
- Ghi chú phát hành, ghi chú thay đổi
- Nội dung văn bản dài cần định dạng nhẹ

## Tạo cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Markdown」 để tạo trường Markdown.

![20240512181311](https://static-docs.nocobase.com/20240512181311.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Markdown tương ứng với `markdown`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Tài liệu hướng dẫn」, 「Phương án xử lý」 hoặc 「Nội dung chính」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc và các chức năng khác. Sau khi tạo thường không nên sửa đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Trường Markdown thường sử dụng `text` để lưu nội dung. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể giới hạn độ dài hoặc yêu cầu bắt buộc nhập. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trên trang, quyền hạn, quy trình làm việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình khi sửa đổi sau này.

:::

## Đặc điểm của trường

Hành vi mặc định của trường Markdown như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `markdown`. |
| Field type mặc định | `text`. |
| Field type tùy chọn | `text`、`string`, tùy theo cấu hình trường thực tế. |
| Thành phần trên trang | Chế độ chỉnh sửa sử dụng thành phần chỉnh sửa Markdown. |
| Lọc | Hỗ trợ các bộ lọc dành cho văn bản, chẳng hạn như chứa, để trống, không để trống. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ xác thực văn bản như độ dài và bắt buộc nhập. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường Markdown. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Việc này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường Markdown. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường Markdown mới được tạo trong cơ sở dữ liệu chính, thông thường cột thực tế trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trên trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được cấu hình nghiệp vụ nào tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường Markdown phù hợp để sử dụng trong việc chỉnh sửa nội dung và hiển thị chi tiết.
![20260709230801](https://static-docs.nocobase.com/20260709230801.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Chỉnh sửa nội dung Markdown. |
| Khối chi tiết | Hiển thị nội dung được kết xuất theo Markdown. |
| Khối bảng | Hiển thị nội dung tóm tắt. |
| Quy trình làm việc | Dùng nội dung chính làm nội dung để tạo thông báo hoặc tài liệu. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về chức năng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Markdown Vditor](../../../field-markdown-vditor/index.md) — Sử dụng Vditor để chỉnh sửa Markdown
- [Văn bản có định dạng](./rich-text.md) — Sử dụng trình chỉnh sửa văn bản có định dạng
- [Văn bản nhiều dòng](../basic/textarea.md) — Lưu nội dung văn bản thuần dài
