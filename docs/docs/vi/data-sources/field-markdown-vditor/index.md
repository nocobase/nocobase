---
title: "Markdown Vditor"
description: "Trường Markdown Vditor dùng để lưu nội dung Markdown thông qua trình chỉnh sửa Vditor."
keywords: "Markdown Vditor,Vditor,markdown,NocoBase"
---

# Markdown Vditor

## Giới thiệu

Trong NocoBase, **Markdown Vditor (Markdown Vditor)** được dùng để chỉnh sửa nội dung Markdown bằng trình chỉnh sửa Vditor.

Markdown Vditor phù hợp với những nội dung cần trải nghiệm chỉnh sửa Markdown đầy đủ hơn, chẳng hạn như nội dung bình luận, nội dung cơ sở tri thức và thuyết minh phương án.

Nếu chỉ cần chỉnh sửa Markdown đơn giản, có thể chọn [Markdown](../data-modeling/collection-fields/media/markdown.md). Nếu cần trải nghiệm soạn thảo rich text WYSIWYG, hãy chọn [Rich text](../data-modeling/collection-fields/media/rich-text.md).

## Mục đích sử dụng

Markdown Vditor phù hợp với các kịch bản nghiệp vụ sau:

- Nội dung bình luận và thảo luận
- Nội dung cơ sở tri thức và thuyết minh phương án
- Văn bản dài có bố cục Markdown
- Nội dung cần khả năng xem trước và chỉnh sửa

## Tạo cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Markdown Vditor」 để tạo trường Markdown Vditor.

![20240512180647](https://static-docs.nocobase.com/20240512180647.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Markdown Vditor tương ứng với `vditor`, quyết định cách nhập và hiển thị trong trang. |
| Field display name | Tên hiển thị của trường trong giao diện, chẳng hạn như 「Nội dung bình luận」, 「Nội dung cơ sở tri thức」 hoặc 「Thuyết minh phương án」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, workflow, v.v. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Trường Markdown Vditor thường sử dụng `text` để lưu nội dung. |
| Default value | Giá trị mặc định. Khi tạo bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể giới hạn độ dài hoặc yêu cầu bắt buộc nhập. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sau khi tạo sẽ được các block trang, quyền hạn, workflow và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm trường

Hành vi mặc định của trường Markdown Vditor như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `vditor`. |
| Field type mặc định | `text`. |
| Field type có thể chọn | `text`. |
| Thành phần trang | Ở chế độ chỉnh sửa, sử dụng trình chỉnh sửa MarkdownVditor. |
| Lọc | Hỗ trợ các bộ lọc dành cho văn bản, chẳng hạn như chứa, trống và không trống. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ xác thực văn bản như độ dài và bắt buộc nhập. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường Markdown Vditor. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trong giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh trường cơ sở dữ liệu chính hoặc trường đồng bộ khi ánh xạ trường. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh trường cơ sở dữ liệu chính hoặc trường đồng bộ khi ánh xạ trường. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi tạo bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không giống với việc chỉ thay đổi một tên hiển thị đơn giản. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến workflow. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường Markdown Vditor. Trong cơ sở dữ liệu chính, cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường Markdown Vditor được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các block trang, biểu mẫu, bộ lọc, quyền hạn, workflow, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường Markdown Vditor phù hợp để sử dụng trong nội dung và bình luận cần trải nghiệm chỉnh sửa.
![20260709230930](https://static-docs.nocobase.com/20260709230930.png)

| Kịch bản | Công dụng |
| --- | --- |
| Block biểu mẫu | Dùng Vditor để chỉnh sửa nội dung Markdown. |
| Block chi tiết | Hiển thị nội dung Markdown đã được render. |
| Block bình luận | Lưu nội dung dưới dạng nội dung bình luận. |
| Workflow | Sử dụng nội dung làm nội dung để tạo thông báo hoặc tài liệu. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu tác dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Markdown](../data-modeling/collection-fields/media/markdown.md) — Lưu nội dung Markdown
- [Rich text](../data-modeling/collection-fields/media/rich-text.md) — Lưu nội dung rich text
