---
title: "Ngày"
description: "Trường ngày dùng để lưu các ngày không bao gồm thời điểm cụ thể, chẳng hạn như ngày sinh, ngày ký hợp đồng và ngày hết hạn."
keywords: "ngày,date,trường ngày,NocoBase"
---

# Ngày

## Giới thiệu

Trong NocoBase, **ngày (Date)** dùng để lưu các ngày không bao gồm thời điểm cụ thể.

Trường ngày phù hợp với dữ liệu nghiệp vụ chỉ quan tâm đến năm, tháng và ngày, chẳng hạn như ngày sinh, ngày ký hợp đồng, ngày hết hạn và ngày dự kiến.

Nếu cần lưu giờ, phút và giây cụ thể, hãy chọn [ngày giờ](./datetime.md). Nếu chỉ cần lưu thời gian trong ngày, hãy chọn [thời gian](./time.md).

## Trường hợp sử dụng

Ngày phù hợp với các trường hợp nghiệp vụ sau:

- Ngày sinh của khách hàng, ngày nhân viên bắt đầu làm việc
- Ngày ký hợp đồng, ngày hết hạn
- Ngày dự kiến, ngày giao hàng
- Ngày nghiệp vụ không cần thời điểm cụ thể

## Tạo và cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Ngày」 để tạo trường ngày.

![20260709232951](https://static-docs.nocobase.com/20260709232951.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Ngày tương ứng với `date`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Ngày ký hợp đồng」, 「Ngày hết hạn」 hoặc 「Ngày sinh」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, quy trình làm việc và các chức năng khác. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường ngày mặc định là `dateonly`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể cấu hình bắt buộc nhập, phạm vi ngày và các quy tắc khác. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền, quy trình làm việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường ngày như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Default Field interface | `date`. |
| Default Field type | `dateonly`. |
| Field type tùy chọn | `dateonly`. |
| Thành phần trên trang | Sử dụng bộ chọn ngày trong chế độ chỉnh sửa. |
| Lọc | Hỗ trợ lọc theo ngày, khoảng ngày, có giá trị và không có giá trị. |
| Sắp xếp | Hỗ trợ sắp xếp theo ngày. |
| Xác thực | Hỗ trợ xác thực bắt buộc nhập, phạm vi ngày và các quy tắc khác. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường ngày. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ tùy điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ tùy điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến trong quy trình làm việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước rằng định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường ngày. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường ngày được tạo trong cơ sở dữ liệu chính, thông thường cột thực tế trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, quy trình làm việc, API, chức năng nhập xuất và dữ liệu hiện có. Hãy xác nhận trước khi xóa rằng trường không còn được các cấu hình nghiệp vụ tham chiếu.

:::

## Sử dụng trong cấu hình trang

Trường ngày phù hợp để sử dụng trong biểu mẫu, bảng, bộ lọc, lịch và báo cáo thống kê.
![20260709232644](https://static-docs.nocobase.com/20260709232644.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Chọn ngày. |
| Khối bảng | Hiển thị, sắp xếp và lọc ngày. |
| Khối lịch | Dùng làm trường ngày của sự kiện. |
| Quy trình làm việc | Dùng làm trường điều kiện ngày. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Ngày giờ (có múi giờ)](./datetime.md) — Lưu ngày và thời gian cụ thể
- [Thời gian](./time.md) — Chỉ lưu thời gian
