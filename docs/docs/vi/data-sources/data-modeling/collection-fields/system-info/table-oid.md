---
title: "Mã định danh bảng dữ liệu"
description: "Trường mã định danh bảng dữ liệu dùng để xác định bảng dữ liệu mà bản ghi thuộc về, thường được sử dụng trong các tình huống như bảng kế thừa, nơi cần phân biệt bảng nguồn."
keywords: "mã định danh bảng dữ liệu,table oid,tableoid,trường hệ thống,NocoBase"
---

# Mã định danh bảng dữ liệu

## Giới thiệu

Trong NocoBase, **mã định danh bảng dữ liệu (Table OID)** dùng để xác định bảng dữ liệu mà bản ghi thuộc về.

Mã định danh bảng dữ liệu thường được sử dụng trong các bảng kế thừa hoặc những tình huống cần phân biệt Collection nguồn của bản ghi. Trường này chủ yếu được sử dụng cho các chức năng hệ thống và siêu dữ liệu.

Các bảng nghiệp vụ thông thường thường không cần tạo thủ công trường mã định danh bảng dữ liệu.

## Tình huống áp dụng

Mã định danh bảng dữ liệu phù hợp với các tình huống nghiệp vụ sau:

- Nhận diện nguồn của bản ghi trong bảng kế thừa
- Tổng hợp và hiển thị dữ liệu trên nhiều bảng con
- Cấu hình siêu dữ liệu
- Các chức năng hệ thống cần phân biệt nguồn Collection

## Tạo và cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Mã định danh bảng dữ liệu」 để tạo trường mã định danh bảng dữ liệu.

![20240512174746](https://static-docs.nocobase.com/20240512174746.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Mã định danh bảng dữ liệu tương ứng với `tableoid`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Mã định danh bảng dữ liệu」「Bảng nguồn」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc và các chức năng khác. Thông thường không sửa đổi sau khi tạo, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường mã định danh bảng dữ liệu thường là trường `virtual`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Thông thường do hệ thống duy trì. |
| Description | Mô tả trường. Phù hợp để ghi rõ ý nghĩa trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách. |

:::warning Lưu ý

Sau khi tạo, tên trường sẽ được các khối giao diện, quyền hạn, quy trình làm việc và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm trường

Hành vi mặc định của trường mã định danh bảng dữ liệu như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Default Field interface | `tableoid`. |
| Default Field type | `virtual`. |
| Field type khả dụng | `virtual`. |
| Thành phần giao diện | Trang thường hiển thị trường dưới dạng lựa chọn bảng dữ liệu hoặc chỉ đọc. |
| Lọc | Có thể dùng để lọc theo bảng dữ liệu nguồn, tùy thuộc vào cấu hình trang. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Do hệ thống hoặc chức năng siêu dữ liệu duy trì. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường mã định danh bảng dữ liệu. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện, không thay đổi tên định danh của trường. |
| Field name | Không | Thông thường không thể sửa tên định danh của trường trong biểu mẫu chỉnh sửa sau khi trường đã được tạo. |
| Field interface | Có điều kiện | Có thể điều chỉnh trường cơ sở dữ liệu chính hoặc trường đồng bộ khi ánh xạ trường. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Có điều kiện | Có thể điều chỉnh trường cơ sở dữ liệu chính hoặc trường đồng bộ khi ánh xạ trường. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không tương đương với việc chỉ sửa tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường mã định danh bảng dữ liệu. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường mã định danh bảng dữ liệu được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng tùy thuộc vào nguồn dữ liệu và nguồn trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối giao diện, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, chức năng nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường mã định danh bảng dữ liệu phù hợp để sử dụng trong các tình huống bảng kế thừa và siêu dữ liệu.

| Tình huống | Mục đích |
| --- | --- |
| Khối bảng | Hiển thị bảng dữ liệu nguồn của bản ghi. |
| Khối lọc | Lọc theo bảng dữ liệu nguồn. |
| Quyền hạn và quy trình làm việc | Dùng làm điều kiện xác định bảng nguồn. |
| Chức năng siêu dữ liệu | Xác định Collection mà bản ghi thuộc về. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Bảng kế thừa](../../../data-source-main/inheritance-collection.md) — Tìm hiểu cách sử dụng bảng kế thừa
- [Bộ chọn bảng dữ liệu](../advanced/collection-select.md) — Chọn bảng dữ liệu