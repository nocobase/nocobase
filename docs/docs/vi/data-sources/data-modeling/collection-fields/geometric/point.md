---
title: "Điểm"
description: "Trường điểm dùng để lưu một vị trí địa lý hoặc tọa độ không gian."
keywords: "điểm,Point,hình học,bản đồ,NocoBase"
---

# Điểm

## Giới thiệu

Trong NocoBase, **điểm (Point)** được dùng để lưu tọa độ của một vị trí đơn lẻ.

Trường điểm phù hợp với dữ liệu không gian như vị trí cửa hàng, vị trí khách hàng và vị trí thiết bị. Kết hợp với khối bản đồ, bạn có thể hiển thị các bản ghi trên bản đồ.

Nếu cần lưu tuyến đường, hãy chọn[đường](./line.md). Nếu cần lưu khu vực, hãy chọn[đa giác](./polygon.md)hoặc[hình tròn](./circle.md).

## Các trường hợp sử dụng

Điểm phù hợp với các trường hợp nghiệp vụ sau:

- Vị trí cửa hàng, vị trí kho
- Tọa độ địa chỉ khách hàng
- Vị trí lắp đặt thiết bị
- Vị trí chấm công khi kiểm tra

## Tạo cấu hình

Trên trang「Configure fields」của bảng dữ liệu, nhấp vào「Add field」, chọn「Điểm」để tạo trường điểm.

![20240512181420](https://static-docs.nocobase.com/20240512181420.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Điểm tương ứng với `point`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trong giao diện, chẳng hạn như「Vị trí cửa hàng」「Tọa độ thiết bị」「Vị trí khách hàng」. Khuyến nghị sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc, v.v. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường điểm mặc định là `point`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Thông thường chỉ cần cấu hình bắt buộc nhập. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình làm việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường điểm như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Mặc định Field interface | `point`. |
| Mặc định Field type | `point`. |
| Field type có thể chọn | `point`. |
| Thành phần trên trang | Chế độ chỉnh sửa sử dụng bản đồ hoặc thành phần chọn tọa độ. |
| Bộ lọc | Khả năng lọc không gian phụ thuộc vào plugin bản đồ và khả năng của nguồn dữ liệu. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ các quy tắc xác thực cơ bản như bắt buộc nhập. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào「Edit」ở bên phải trường để chỉnh sửa cấu hình trường điểm. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trong giao diện, không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ tùy điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ tùy điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Điều này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào「Delete」ở bên phải trường để xóa trường điểm. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường điểm được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực trong cơ sở dữ liệu và dữ liệu hiện có của cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được cấu hình nghiệp vụ nào tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường điểm phù hợp để sử dụng trong các tình huống bản đồ và quản lý vị trí.
![20260710144034](https://static-docs.nocobase.com/20260710144034.png)

| Tình huống | Công dụng |
| --- | --- |
| Khối biểu mẫu | Chọn hoặc nhập một vị trí. |
| Khối chi tiết | Hiển thị tọa độ vị trí hoặc điểm trên bản đồ. |
| Khối bản đồ | Hiển thị các điểm trên bản đồ. |
| Quy trình làm việc | Làm đầu vào cho các điều kiện nghiệp vụ liên quan đến vị trí. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Khối bản đồ](../../../../interface-builder/blocks/data-blocks/map.md) — Hiển thị các trường hình học trên bản đồ
- [Đường](./line.md) — Lưu tuyến đường
- [Đa giác](./polygon.md) — Lưu khu vực
