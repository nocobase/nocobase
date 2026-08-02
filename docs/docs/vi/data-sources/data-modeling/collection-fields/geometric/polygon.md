---
title: "Đa giác"
description: "Trường đa giác dùng để lưu dữ liệu không gian dạng vùng như khu vực, ranh giới, phạm vi dịch vụ."
keywords: "Đa giác,Polygon,khu vực,hình học,NocoBase"
---

# Đa giác

## Giới thiệu

Trong NocoBase, **đa giác (Polygon)** được dùng để lưu các khu vực không gian dạng vùng.

Trường đa giác phù hợp với dữ liệu nghiệp vụ như khu vực hành chính, khu vực giao hàng, khu vực bán hàng, khu vực cấm vào. Kết hợp với khối bản đồ, bạn có thể hiển thị phạm vi khu vực.

Nếu khu vực là hình tròn đơn giản, hãy chọn [hình tròn](./circle.md). Nếu chỉ lưu một vị trí, hãy chọn [điểm](./point.md).

## Trường hợp sử dụng

Đa giác phù hợp với các trường hợp nghiệp vụ sau:

- Khu vực bán hàng, khu vực giao hàng
- Khu vực dịch vụ, khu vực quản lý
- Khu vực cấm vào, khu vực rủi ro
- Ranh giới phạm vi nghiệp vụ trên bản đồ

## Cấu hình tạo trường

Trong trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Đa giác」 để tạo trường đa giác.

![20240512181547](https://static-docs.nocobase.com/20240512181547.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Đa giác tương ứng với `polygon`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Khu vực bán hàng」, 「Phạm vi giao hàng」, 「Khu vực rủi ro」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, quy trình công việc và các thành phần khác. Thông thường không thể sửa sau khi tạo; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Trường đa giác mặc định là `polygon`. |
| Default value | Giá trị mặc định. Khi tạo bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Thông thường chỉ cần cấu hình bắt buộc nhập. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền, quy trình công việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường đa giác như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `polygon`. |
| Field type mặc định | `polygon`. |
| Field type tùy chọn | `polygon`. |
| Thành phần trang | Sử dụng thành phần vẽ bản đồ trong chế độ chỉnh sửa. |
| Lọc | Khả năng lọc không gian phụ thuộc vào plugin bản đồ và khả năng của nguồn dữ liệu. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ các quy tắc xác thực cơ bản như bắt buộc nhập. |

## Cấu hình chỉnh sửa

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường đa giác. Chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Thông thường không thể sửa tên định danh của trường trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi tạo bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình công việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường đa giác. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường đa giác được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực trong cơ sở dữ liệu cùng dữ liệu hiện có của cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, quy trình công việc, API, chức năng nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó không còn được cấu hình nghiệp vụ nào tham chiếu.

:::

## Sử dụng trong cấu hình trang

Trường đa giác phù hợp để sử dụng trong các tình huống quản lý khu vực và hiển thị bản đồ.
![20260710145218](https://static-docs.nocobase.com/20260710145218.png)

| Tình huống | Công dụng |
| --- | --- |
| Khối biểu mẫu | Vẽ ranh giới khu vực. |
| Khối chi tiết | Hiển thị phạm vi khu vực. |
| Khối bản đồ | Hiển thị khu vực dạng vùng trên bản đồ. |
| Biểu đồ và thống kê | Dùng làm chiều khu vực để phân tích dữ liệu nghiệp vụ. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu tác dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Điểm](./point.md) — Lưu một vị trí
- [Hình tròn](./circle.md) — Lưu phạm vi hình tròn
