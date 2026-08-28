---
title: "Văn bản nhiều dòng"
description: "Trường văn bản nhiều dòng dùng để lưu ghi chú, mô tả, địa chỉ, ý kiến xử lý và các nội dung văn bản dài khác, mặc định sử dụng kiểu text và ô nhập nhiều dòng."
keywords: "Văn bản nhiều dòng,textarea,trường văn bản,text,NocoBase"
---

# Văn bản nhiều dòng

## Giới thiệu

Trong NocoBase, **văn bản nhiều dòng (Multi-line text)** dùng để lưu các nội dung văn bản cần xuống dòng hoặc có độ dài lớn.

Văn bản nhiều dòng mặc định sử dụng ô nhập nhiều dòng, phù hợp với ghi chú, mô tả, ý kiến xử lý và các nội dung khác. Trường này có thể được sử dụng trong bộ lọc, quyền, điều kiện workflow và truy vấn API.

Nếu nội dung thường chỉ có một dòng, chẳng hạn như tên, mã số hoặc tiêu đề, thì mặc định chọn [văn bản một dòng](./input.md) sẽ phù hợp hơn. Nếu nội dung cần bố cục, hình ảnh hoặc khả năng soạn thảo văn bản có định dạng, hãy chọn trường văn bản có định dạng hoặc Markdown.

## Các trường hợp sử dụng

Văn bản nhiều dòng phù hợp với các trường hợp nghiệp vụ sau:

- Ghi chú khách hàng, ghi chú đơn hàng, ý kiến xử lý phiếu công việc
- Địa chỉ chi tiết, mô tả vấn đề, mô tả yêu cầu
- Tóm tắt điều khoản hợp đồng, mô tả bối cảnh dự án
- Nội dung văn bản cần nhập theo nhiều dòng

## Cấu hình khi tạo

Trên trang「Configure fields」của bảng dữ liệu, nhấp vào「Add field」, rồi chọn「Văn bản nhiều dòng」 để tạo trường văn bản nhiều dòng.

![20240512165017](https://static-docs.nocobase.com/20240512165017.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Văn bản nhiều dòng tương ứng với `textarea`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như「Ghi chú khách hàng」「Ý kiến xử lý」「Địa chỉ chi tiết」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, workflow và các thành phần khác. Sau khi tạo thường không nên sửa, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường trong lớp dữ liệu. Văn bản nhiều dòng mặc định là `text`, cũng có thể được ánh xạ thành `string` hoặc `json` tùy theo trường nguồn. |
| Default value | Giá trị mặc định. Khi tạo bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể giới hạn độ dài tối thiểu, độ dài tối đa, độ dài cố định, kiểu chữ hoặc biểu thức chính quy. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền, workflow và API tham chiếu sau khi tạo. Hãy xác nhận quy tắc đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường văn bản nhiều dòng như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `textarea`. |
| Field type mặc định | `text`. |
| Field type có thể chọn | `text`、`json`、`string`. |
| Thành phần trên trang | Ở chế độ chỉnh sửa, sử dụng ô nhập nhiều dòng. |
| Lọc | Hỗ trợ các bộ lọc dạng văn bản, chẳng hạn như chứa, không chứa, rỗng, không rỗng. |
| Sắp xếp | Thông thường không khuyến nghị dùng để sắp xếp. Có thể sắp xếp hay không tùy thuộc vào cơ sở dữ liệu và kiểu trường cụ thể. |
| Xác thực | Hỗ trợ xác thực độ dài tối thiểu, độ dài tối đa, độ dài cố định, kiểu chữ, biểu thức chính quy và các quy tắc khác. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào「Edit」ở bên phải trường để chỉnh sửa cấu hình trường văn bản nhiều dòng. Chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là thực hiện ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Có thể chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Sau khi điều chỉnh sẽ ảnh hưởng đến cách nhập, hiển thị và xác thực trên trang. |
| Field type | Có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng với kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi tạo bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Điều này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến workflow. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào「Delete」ở bên phải trường để xóa trường văn bản nhiều dòng. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường văn bản nhiều dòng được tạo trong cơ sở dữ liệu chính, thông thường cột thực tế tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng tùy thuộc vào nguồn dữ liệu và nguồn trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, workflow, API, chức năng nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường không còn được cấu hình nghiệp vụ nào tham chiếu.

:::

## Sử dụng trong cấu hình trang

Trường văn bản nhiều dòng phù hợp để hiển thị nội dung dài trong biểu mẫu và phần chi tiết.

![20260709224428](https://static-docs.nocobase.com/20260709224428.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Nhập hoặc chỉnh sửa ghi chú, mô tả, ý kiến xử lý và các nội dung khác. |
| Khối chi tiết | Hiển thị nội dung văn bản dài. |
| Khối bảng | Hiển thị nội dung tóm tắt; nội dung dài thường sẽ được rút gọn. |
| Workflow và quyền | Được sử dụng làm trường điều kiện để phán đoán, chẳng hạn như ghi chú có rỗng hay không. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Văn bản một dòng](./input.md) — Lưu nội dung văn bản ngắn trong một dòng
- [Markdown](../media/markdown.md) — Lưu nội dung có định dạng Markdown
- [Văn bản có định dạng](../media/rich-text.md) — Lưu nội dung có bố cục phức tạp