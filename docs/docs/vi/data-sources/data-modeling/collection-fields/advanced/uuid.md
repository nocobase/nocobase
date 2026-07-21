---
title: "UUID"
description: "Trường UUID dùng để tạo mã định danh duy nhất phổ quát, phù hợp với các kịch bản đồng bộ hóa hệ thống bên ngoài và định danh công khai."
keywords: "UUID,định danh duy nhất,khóa chính,NocoBase"
---

# UUID

## Giới thiệu

Trong NocoBase, **UUID (UUID)** được dùng để tạo mã định danh duy nhất UUID.

UUID phù hợp với các kịch bản đồng bộ hóa giữa các hệ thống, định danh cho API công khai, nhập xuất dữ liệu, v.v. So với ID tự tăng, UUID ít làm lộ quy mô dữ liệu hơn.

Nếu chỉ cần khóa chính mặc định trong nội bộ NocoBase, Snowflake ID thường là đủ. Nếu cần mã ngắn, hãy chọn [Nano ID](./nano-id.md) hoặc[Sequence](../../../field-sequence/index.md).

## Các kịch bản áp dụng

UUID phù hợp với các kịch bản nghiệp vụ sau:

- ID đồng bộ với hệ thống bên ngoài
- Định danh API công khai
- Định danh bản ghi khi di chuyển giữa các cơ sở dữ liệu
- ID bản ghi không muốn để lộ quy luật tăng dần

## Tạo cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「UUID」 để tạo trường UUID.

![20240512173354](https://static-docs.nocobase.com/20240512173354.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. UUID tương ứng với `uuid`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「UUID」「Định danh bên ngoài」「ID công khai」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc, v.v. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường UUID mặc định là `uuid`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Thường do hệ thống tự động tạo, không cần kiểm tra thủ công. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình làm việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường UUID như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `uuid`. |
| Field type mặc định | `uuid`. |
| Field type tùy chọn | `uuid`. |
| Thành phần trang | Thường được tự động tạo, không cần nhập thủ công. |
| Bộ lọc | Hỗ trợ truy vấn chính xác theo UUID. |
| Sắp xếp | Hỗ trợ sắp xếp, nhưng thông thường không dùng UUID để sắp xếp nghiệp vụ. |
| Kiểm tra | Thường được tự động tạo và duy trì tính duy nhất. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường UUID. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc kiểm tra hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu với Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện, không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và kiểm tra trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi. |
| Validation rules | Có | Điều chỉnh quy tắc kiểm tra trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc kiểm tra, điều kiện lọc và cách sử dụng biến trong quy trình làm việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường UUID. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường UUID được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng tùy thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, chức năng nhập xuất và dữ liệu hiện có. Hãy xác nhận trước khi xóa liệu trường này còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường UUID phù hợp để sử dụng trong các kịch bản tích hợp và định danh công khai.
![20260710145759](https://static-docs.nocobase.com/20260710145759.png)

| Kịch bản | Công dụng |
| --- | --- |
| Tạo bảng | Dùng làm khóa chính hoặc mã định danh duy nhất. |
| API | Dùng làm mã định danh bản ghi công khai. |
| Đồng bộ dữ liệu | Đồng bộ bản ghi giữa các hệ thống. |
| Nhập xuất dữ liệu | Duy trì tính duy nhất của bản ghi. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Snowflake ID](./snowflake-id.md) — Sử dụng Snowflake ID mặc định
- [Nano ID](./nano-id.md) — Sử dụng ID ngẫu nhiên ngắn
