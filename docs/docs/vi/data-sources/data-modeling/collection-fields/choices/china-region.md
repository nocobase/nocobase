---
title: "Phân vùng hành chính Trung Quốc"
description: "Trường phân vùng hành chính Trung Quốc dùng để chọn thông tin phân vùng hành chính như tỉnh, thành phố, quận huyện."
keywords: "Phân vùng hành chính Trung Quốc,china region,địa chỉ,trường tùy chọn,NocoBase"
---

# Phân vùng hành chính Trung Quốc (đã ngừng sử dụng)

## Giới thiệu

:::warning Lưu ý

Trường phân vùng hành chính Trung Quốc đã bị ngừng sử dụng. Bạn nên sử dụng trường quan hệ để liên kết với bảng cây.

:::

Trong NocoBase, **phân vùng hành chính Trung Quốc (China region)** dùng để chọn các phân vùng hành chính như tỉnh, thành phố, quận huyện của Trung Quốc.

Trường phân vùng hành chính Trung Quốc phù hợp với các trường hợp cần lựa chọn khu vực theo cấu trúc, chẳng hạn như địa chỉ khách hàng, địa chỉ cửa hàng và khu vực dịch vụ. Trường này thuận tiện hơn cho việc lọc và thống kê so với nhập địa chỉ thủ công.

Nếu cần lưu địa chỉ đầy đủ và chi tiết, bạn có thể kết hợp với [văn bản một dòng](../basic/input.md) hoặc [văn bản nhiều dòng](../basic/textarea.md) để lưu số nhà và tên đường.

## Các trường hợp phù hợp

Phân vùng hành chính Trung Quốc phù hợp với các trường hợp nghiệp vụ sau:

- Tỉnh, thành phố và quận huyện của khách hàng
- Khu vực phục vụ của cửa hàng
- Khu vực triển khai dự án
- Phân vùng hành chính trong địa chỉ nhận hàng

## Tạo cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「中国行政区划」 để tạo trường phân vùng hành chính Trung Quốc.

![20240512180305](https://static-docs.nocobase.com/20240512180305.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Phân vùng hành chính Trung Quốc tương ứng với `chinaRegion`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Khu vực hiện tại」, 「Khu vực phục vụ」 hoặc 「Khu vực nhận hàng」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc và các chức năng khác. Thông thường không thể thay đổi sau khi tạo; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường phân vùng hành chính thường được lưu dưới dạng giá trị có cấu trúc; Field type cụ thể tùy theo cấu hình trường. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng chưa nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc kiểm tra. Thông thường dùng để cấu hình trường bắt buộc và cấp độ lựa chọn. |
| Description | Mô tả trường. Có thể ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Sau khi được tạo, tên trường sẽ được các khối giao diện, quyền hạn, quy trình làm việc và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường phân vùng hành chính Trung Quốc như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `chinaRegion`. |
| Field type mặc định | `json`. |
| Field type có thể chọn | `json`, `string`, tùy theo cấu hình trường thực tế. |
| Thành phần trên trang | Chế độ chỉnh sửa sử dụng thành phần chọn phân vùng hành chính. |
| Lọc | Hỗ trợ lọc theo giá trị khu vực; khả năng cụ thể tùy thuộc vào cấu hình trường. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Kiểm tra | Hỗ trợ các kiểm tra cơ bản như bắt buộc nhập. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường phân vùng hành chính Trung Quốc. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc kiểm tra hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Có thể chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể thay đổi trong biểu mẫu chỉnh sửa sau khi được tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Việc điều chỉnh sẽ ảnh hưởng đến cách nhập, hiển thị và kiểm tra trên trang. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc kiểm tra của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc kiểm tra, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường phân vùng hành chính Trung Quốc. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường phân vùng hành chính Trung Quốc được tạo trong cơ sở dữ liệu chính, thông thường cột thực tế trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng tùy thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Việc xóa trường có thể ảnh hưởng đến các khối giao diện, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, chức năng nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó không còn được các cấu hình nghiệp vụ tham chiếu.

:::

## Sử dụng trong cấu hình trang

Trường phân vùng hành chính Trung Quốc phù hợp để sử dụng trong các trường hợp liên quan đến địa chỉ, khu vực và thống kê.

| Trường hợp | Mục đích |
| --- | --- |
| Khối biểu mẫu | Chọn tỉnh, thành phố và quận huyện. |
| Khối chi tiết | Hiển thị phân vùng hành chính. |
| Khối lọc | Lọc bản ghi theo khu vực. |
| Khối biểu đồ | Thống kê dữ liệu nghiệp vụ theo khu vực. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu chức năng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Văn bản một dòng](../basic/input.md) — Lưu địa chỉ chi tiết
- [Văn bản nhiều dòng](../basic/textarea.md) — Lưu mô tả địa chỉ dài hơn
