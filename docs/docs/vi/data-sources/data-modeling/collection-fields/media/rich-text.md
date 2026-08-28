---
title: "Văn bản có định dạng"
description: "Trường văn bản có định dạng dùng để lưu nội dung có kiểu dáng, hình ảnh, liên kết và các định dạng khác."
keywords: "Văn bản có định dạng,rich text,trường nội dung,NocoBase"
---

# Văn bản có định dạng

## Giới thiệu

Trong NocoBase, **văn bản có định dạng (Rich text)** được dùng để lưu nội dung đã được định dạng.

Trường văn bản có định dạng phù hợp với nội dung thông báo, nội dung bài viết, mẫu email, tài liệu hướng dẫn và các nội dung tương tự. Trải nghiệm chỉnh sửa gần với thao tác soạn thảo WYSIWYG.

Nếu nhóm quen sử dụng Markdown hoặc cần kiểm soát định dạng văn bản thuần túy, hãy chọn [Markdown](./markdown.md) hoặc [Markdown Vditor](../../../field-markdown-vditor/index.md).

## Các trường hợp sử dụng

Văn bản có định dạng phù hợp với các trường hợp nghiệp vụ sau:

- Nội dung thông báo, nội dung bài viết
- Mẫu email, mẫu thông báo
- Tài liệu giới thiệu sản phẩm, hướng dẫn thao tác
- Nội dung cần hình ảnh, liên kết và kiểu dáng

## Tạo và cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「富文本」 để tạo trường văn bản có định dạng.

![20240512181002](https://static-docs.nocobase.com/20240512181002.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Giao diện văn bản có định dạng tương ứng với `richText`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「公告正文」, 「邮件模板」, 「产品说明」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, workflow và các thành phần khác. Sau khi tạo thường không thể thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường văn bản có định dạng thường sử dụng `text` để lưu nội dung. |
| Default value | Giá trị mặc định. Khi tạo bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể giới hạn độ dài hoặc yêu cầu bắt buộc nhập. |
| Description | Mô tả trường. Phù hợp để ghi rõ ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các block trang, quyền, workflow và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường văn bản có định dạng như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `richText`. |
| Field type mặc định | `text`. |
| Field type khả dụng | `text`. |
| Thành phần trên trang | Sử dụng trình chỉnh sửa văn bản có định dạng trong chế độ chỉnh sửa. |
| Lọc | Hỗ trợ các bộ lọc văn bản, chẳng hạn như chứa, rỗng và không rỗng. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ các quy tắc xác thực văn bản như độ dài và bắt buộc nhập. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường văn bản có định dạng. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể thay đổi trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Tùy điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Tùy điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi tạo bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến workflow. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước rằng định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường văn bản có định dạng. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường văn bản có định dạng được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Việc xóa trường có thể ảnh hưởng đến các block trang, biểu mẫu, bộ lọc, quyền, workflow, API, thao tác nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó không còn được các cấu hình nghiệp vụ tham chiếu.

:::

## Sử dụng trong cấu hình trang

Trường văn bản có định dạng phù hợp với các tình huống chỉnh sửa và hiển thị nội dung.
![20260709231418](https://static-docs.nocobase.com/20260709231418.png)

| Tình huống | Mục đích |
| --- | --- |
| Block biểu mẫu | Chỉnh sửa nội dung văn bản có định dạng. |
| Block chi tiết | Hiển thị nội dung theo định dạng văn bản có định dạng. |
| Mẫu email hoặc thông báo | Làm nguồn nội dung chính của mẫu. |
| Block bảng | Hiển thị nội dung tóm tắt hoặc rút gọn. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Markdown](./markdown.md) — Lưu nội dung Markdown
- [Markdown Vditor](../../../field-markdown-vditor/index.md) — Sử dụng Vditor để chỉnh sửa Markdown