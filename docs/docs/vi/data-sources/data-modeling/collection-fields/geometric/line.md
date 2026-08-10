---
title: "Đường"
description: "Trường đường dùng để lưu dữ liệu không gian dạng đường như tuyến đường, quỹ đạo, v.v."
keywords: "đường,LineString,tuyến đường,hình học,NocoBase"
---

# Đường

## Giới thiệu

Trong NocoBase, **đường (LineString)** được dùng để lưu dữ liệu không gian dạng đường.

Trường đường phù hợp với các dữ liệu nghiệp vụ như tuyến đường, quỹ đạo, đường ống, lộ trình kiểm tra, v.v. Kết hợp với khối bản đồ, bạn có thể hiển thị đường đi.

Nếu chỉ cần một vị trí, hãy chọn[điểm](./point.md). Nếu cần một phạm vi khu vực, hãy chọn[đa giác](./polygon.md).

## Các trường hợp áp dụng

Đường phù hợp với các trường hợp nghiệp vụ sau:

- Tuyến giao hàng, tuyến kiểm tra
- Quỹ đạo phương tiện, quỹ đạo nhân viên
- Đường ống, tuyến đường, đường ranh giới
- Kết quả lập kế hoạch lộ trình trên bản đồ

## Cấu hình tạo

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Đường」 để tạo trường đường.

![20240512181454](https://static-docs.nocobase.com/20240512181454.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Đường tương ứng với `lineString`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Tuyến giao hàng」「Lộ trình kiểm tra」「Đường ống」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình công việc, v.v. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Trường đường mặc định là `lineString`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Thông thường chỉ cần cấu hình bắt buộc nhập. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình công việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường đường như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `lineString`. |
| Field type mặc định | `lineString`. |
| Field type tùy chọn | `lineString`. |
| Thành phần trên trang | Sử dụng thành phần vẽ bản đồ trong chế độ chỉnh sửa. |
| Bộ lọc | Khả năng lọc không gian phụ thuộc vào plugin bản đồ và năng lực của nguồn dữ liệu. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ các xác thực cơ bản như bắt buộc nhập. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường đường. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là thực hiện ánh xạ trường — ánh xạ trường cơ sở dữ liệu sang Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ theo điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Việc điều chỉnh sẽ ảnh hưởng đến cách nhập, hiển thị và xác thực trên trang. |
| Field type | Hỗ trợ theo điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Điều này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình công việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước rằng định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường đường. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường đường được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tương ứng trong cơ sở dữ liệu và dữ liệu hiện có của cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình công việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Hãy xác nhận trước khi xóa rằng trường không còn được cấu hình nghiệp vụ nào tham chiếu.

:::

## Sử dụng trong cấu hình trang

Trường đường phù hợp để sử dụng trong các trường hợp hiển thị tuyến đường và phân tích không gian trên bản đồ.
![20260710144453](https://static-docs.nocobase.com/20260710144453.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Vẽ hoặc nhập tuyến đường. |
| Khối chi tiết | Hiển thị tuyến đường. |
| Khối bản đồ | Hiển thị đường đi dạng tuyến trên bản đồ. |
| Quy trình công việc | Tham gia vào quy trình với tư cách dữ liệu liên quan đến tuyến đường. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về tác dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Điểm](./point.md) — Lưu một vị trí
- [Đa giác](./polygon.md) — Lưu một khu vực
