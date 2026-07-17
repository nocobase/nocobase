---
title: "Chuỗi"
description: "Trường chuỗi dùng để tạo mã nghiệp vụ tăng dần hoặc được tạo theo quy tắc."
keywords: "chuỗi,sequence,mã số,tự động đánh số,NocoBase"
---

# Chuỗi

## Giới thiệu

Trong NocoBase, **chuỗi (Sequence)** được dùng để tạo mã nghiệp vụ.

Trường chuỗi phù hợp với các mã cần quy tắc dễ đọc như mã đơn hàng, mã hợp đồng, mã công việc, mã đơn đề nghị. Khác với khóa chính, trường này thiên về hiển thị nghiệp vụ và nhận diện thủ công.

Nếu chỉ cần một mã định danh duy nhất dùng nội bộ, hãy sử dụng Snowflake ID, UUID hoặc Nano ID.

## Trường hợp sử dụng

Chuỗi phù hợp với các trường hợp nghiệp vụ sau:

- Mã đơn hàng, mã hợp đồng
- Mã công việc, mã đơn đề nghị
- Mã tài sản, mã thiết bị
- Mã có tiền tố, ngày tháng hoặc quy tắc tăng dần

## Tạo cấu hình

Trong trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Chuỗi」 để tạo trường chuỗi.

![20240512173752](https://static-docs.nocobase.com/20240512173752.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Chuỗi tương ứng với `sequence`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Mã đơn hàng」「Mã hợp đồng」「Mã công việc」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc, v.v. Sau khi tạo thường không nên sửa đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Kiểu lưu trữ của trường chuỗi phụ thuộc vào quy tắc chuỗi, thường là `string`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Thường do hệ thống tạo theo quy tắc, không cần kiểm tra thủ công. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người bảo trì. |

:::warning Lưu ý

Tên trường sau khi tạo sẽ được các khối trang, quyền hạn, quy trình làm việc và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình khi sửa đổi về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường chuỗi như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `sequence`. |
| Field type mặc định | `string`. |
| Field type có thể chọn | `string`、`integer`, tùy theo cấu hình chuỗi thực tế. |
| Thành phần trên trang | Thường được tạo tự động và sử dụng sau khi cấu hình quy tắc mã. |
| Lọc | Hỗ trợ tìm kiếm chính xác hoặc lọc văn bản theo mã. |
| Sắp xếp | Có phù hợp để sắp xếp hay không tùy thuộc vào quy tắc mã. |
| Kiểm tra | Phụ thuộc vào quy tắc chuỗi, thường đảm bảo tính duy nhất. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường chuỗi. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc kiểm tra hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là thực hiện ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và kiểm tra trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi. |
| Validation rules | Có | Điều chỉnh quy tắc kiểm tra của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc kiểm tra, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước rằng định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường chuỗi. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường chuỗi được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế trong cơ sở dữ liệu và dữ liệu hiện có của cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường chuỗi phù hợp để sử dụng trong các tình huống liên quan đến mã nghiệp vụ và tra cứu thủ công.
![20260710151731](https://static-docs.nocobase.com/20260710151731.png)

| Tình huống | Mục đích |
| --- | --- |
| Tạo bản ghi | Tự động tạo mã nghiệp vụ. |
| Khối bảng | Hiển thị, tìm kiếm và lọc mã. |
| Khối chi tiết | Dùng làm mã nhận diện dễ đọc của bản ghi. |
| Quy trình làm việc và thông báo | Tham chiếu mã nghiệp vụ trong phê duyệt và thông báo. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Văn bản một dòng](../data-modeling/collection-fields/basic/input.md) — Duy trì mã nghiệp vụ thủ công
- [Snowflake ID](../data-modeling/collection-fields/advanced/snowflake-id.md) — Sử dụng ID khóa chính nội bộ
