---
title: "URL"
description: "Trường URL dùng để lưu địa chỉ trang web, liên kết đến hệ thống bên ngoài, liên kết tài liệu và các thông tin địa chỉ khác."
keywords: "URL,liên kết,địa chỉ web,url,NocoBase"
---

# URL

## Giới thiệu

Trong NocoBase, **URL（URL）** được dùng để lưu địa chỉ trang web hoặc liên kết.

Trường URL phù hợp với địa chỉ hệ thống bên ngoài, liên kết tài liệu, địa chỉ trang web chính thức, địa chỉ callback và các nội dung tương tự. So với văn bản thông thường, trường này thể hiện rõ hơn ngữ nghĩa của liên kết.

Nếu muốn tải tệp lên, hãy chọn [Tệp đính kèm](../media/field-attachment.md). Nếu chỉ cần nhập văn bản mô tả thông thường, hãy chọn [Văn bản một dòng](./input.md) hoặc [Văn bản nhiều dòng](./textarea.md).

## Trường hợp sử dụng

URL phù hợp với các trường hợp nghiệp vụ sau:

- Trang web chính thức của khách hàng, trang web chính thức của nhà cung cấp
- Liên kết đến trang chi tiết của hệ thống bên ngoài
- Liên kết đến tài liệu hợp đồng, trang cơ sở tri thức
- Địa chỉ Webhook, địa chỉ callback

## Tạo cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「URL」 để tạo trường URL.

![20240512175641](https://static-docs.nocobase.com/20240512175641.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. URL tương ứng với `url`, quyết định cách nhập và hiển thị trong trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Trang web chính thức」「Liên kết tài liệu」「Địa chỉ bên ngoài」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc và các chức năng khác. Sau khi tạo thường không thể sửa, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường URL mặc định là `string`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể cấu hình định dạng URL, độ dài hoặc bắt buộc nhập. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sau khi tạo sẽ được các khối trang, quyền hạn, quy trình làm việc và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường URL như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `url`. |
| Field type mặc định | `string`. |
| Field type có thể chọn | `string`. |
| Thành phần giao diện | Chế độ chỉnh sửa sử dụng ô nhập liệu, còn chế độ đọc thường hiển thị dưới dạng liên kết. |
| Lọc | Hỗ trợ các bộ lọc dạng văn bản, chẳng hạn như chứa, bằng, trống, không trống. |
| Sắp xếp | Hỗ trợ sắp xếp trong khối bảng. |
| Xác thực | Hỗ trợ xác thực định dạng URL, độ dài, bắt buộc nhập và các quy tắc khác. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 bên phải trường để chỉnh sửa cấu hình trường URL. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu sang Field type và Field interface của NocoBase.

| Cấu hình | Có thể chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không đơn giản chỉ là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 bên phải trường để xóa trường URL. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường URL được tạo trong cơ sở dữ liệu chính, thông thường cột thực tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, chức năng nhập xuất và dữ liệu hiện có. Hãy xác nhận trường đó không còn được các cấu hình nghiệp vụ tham chiếu trước khi xóa.

:::

## Sử dụng trong cấu hình trang

Trường URL phù hợp để sử dụng trong các tình huống chi tiết, bảng và chuyển hướng ra bên ngoài.
![20260709224747](https://static-docs.nocobase.com/20260709224747.png)

| Tình huống | Công dụng |
| --- | --- |
| Khối biểu mẫu | Nhập địa chỉ liên kết. |
| Khối chi tiết | Hiển thị và mở liên kết. |
| Khối bảng | Hiển thị bản tóm tắt liên kết hoặc liên kết có thể nhấp. |
| Quy trình làm việc | Sử dụng liên kết làm nội dung thông báo hoặc tham số yêu cầu bên ngoài. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Văn bản một dòng](./input.md) — Lưu văn bản ngắn thông thường
- [Tệp đính kèm](../media/field-attachment.md) — Tải lên và liên kết tệp