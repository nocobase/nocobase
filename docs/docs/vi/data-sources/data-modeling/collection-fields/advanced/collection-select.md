---
title: "Bộ chọn bảng dữ liệu"
description: "Trường bộ chọn bảng dữ liệu dùng để chọn các bảng dữ liệu trong NocoBase."
keywords: "bộ chọn bảng dữ liệu,collection select,Collection,NocoBase"
---

# Bộ chọn bảng dữ liệu

## Giới thiệu

Trong NocoBase, **bộ chọn bảng dữ liệu (Collection select)** dùng để chọn một hoặc nhiều bảng dữ liệu.

Bộ chọn bảng dữ liệu phù hợp với các trường hợp như cấu hình plugin, cấu hình quy tắc và quản lý siêu dữ liệu. Giá trị được lưu là định danh bảng dữ liệu, không phải bản ghi nghiệp vụ.

Nếu muốn chọn bản ghi trong một bảng cụ thể, nên sử dụng trường quan hệ thay vì bộ chọn bảng dữ liệu.

## Trường hợp áp dụng

Bộ chọn bảng dữ liệu phù hợp với các trường hợp nghiệp vụ sau:

- Chọn bảng dữ liệu áp dụng trong cấu hình plugin
- Chỉ định phạm vi bảng dữ liệu trong cấu hình quy tắc
- Quản lý siêu dữ liệu và cấu hình mẫu
- Cấu hình chức năng cần tham chiếu đến định danh Collection

## Tạo cấu hình

Trong trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Bộ chọn bảng dữ liệu」 để tạo trường bộ chọn bảng dữ liệu.

![20240512174047](https://static-docs.nocobase.com/20240512174047.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Bộ chọn bảng dữ liệu tương ứng với `collectionSelect`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Bảng dữ liệu áp dụng」, 「Bảng dữ liệu mục tiêu」 hoặc 「Phạm vi dữ liệu」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, workflow và các chức năng khác. Thông thường không nên thay đổi sau khi tạo; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Bộ chọn bảng dữ liệu thường lưu định danh bảng dữ liệu; kiểu lưu trữ tùy thuộc vào cấu hình thực tế. |
| Default value | Giá trị mặc định. Khi tạo bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Thông thường dùng để cấu hình bắt buộc nhập hoặc phạm vi lựa chọn. |
| Description | Mô tả trường. Có thể ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các block trang, quyền, workflow và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình khi thay đổi về sau.

:::

## Đặc điểm trường

Hành vi mặc định của trường bộ chọn bảng dữ liệu như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `collectionSelect`。 |
| Field type mặc định | `string`。 |
| Field type có thể chọn | `string`、`json`, tùy theo cấu hình thực tế. |
| Thành phần trang | Chế độ chỉnh sửa sử dụng thành phần chọn bảng dữ liệu. |
| Lọc | Thông thường không được dùng làm trường lọc nghiệp vụ. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ các quy tắc xác thực cơ bản như bắt buộc nhập. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường bộ chọn bảng dữ liệu. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là thực hiện ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Thông thường không thể thay đổi tên định danh của trường trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ các trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ các trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi tạo bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến workflow. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường bộ chọn bảng dữ liệu. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường bộ chọn bảng dữ liệu được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực trong cơ sở dữ liệu và dữ liệu hiện có của cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng tùy thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các block trang, biểu mẫu, bộ lọc, quyền, workflow, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường có còn được cấu hình nghiệp vụ nào tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Bộ chọn bảng dữ liệu phù hợp để sử dụng trong các biểu mẫu cấu hình.

| Trường hợp | Mục đích |
| --- | --- |
| Block biểu mẫu | Chọn một hoặc nhiều bảng dữ liệu. |
| Block chi tiết | Hiển thị các bảng dữ liệu đã chọn. |
| Cấu hình plugin | Chỉ định phạm vi bảng dữ liệu áp dụng cho chức năng. |
| Workflow hoặc quy tắc | Tham gia vào logic với vai trò cấu hình siêu dữ liệu. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tìm hiểu cách sử dụng Collection
- [Trường quan hệ](../associations/index.md) — Chọn bản ghi trong một bảng cụ thể
