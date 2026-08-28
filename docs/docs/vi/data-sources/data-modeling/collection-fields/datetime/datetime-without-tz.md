---
title: "Ngày giờ (không có múi giờ)"
description: "Trường ngày giờ (không có múi giờ) dùng để lưu ngày và giờ mà không thực hiện chuyển đổi múi giờ."
keywords: "ngày giờ,datetime without timezone,không có múi giờ,NocoBase"
---

# Ngày giờ (không có múi giờ)

## Giới thiệu

Trong NocoBase, **ngày giờ (không có múi giờ) (Date time without timezone)** dùng để lưu ngày và giờ mà không thực hiện chuyển đổi múi giờ.

Ngày giờ (không có múi giờ) phù hợp với các trường hợp chú trọng giá trị hiển thị theo giờ địa phương, chẳng hạn như lịch làm việc, giờ kinh doanh và thời gian học.

Nếu cần biểu thị một thời điểm thực tế nhất quán trên toàn cầu, [ngày giờ (có múi giờ)](./datetime.md) sẽ phù hợp hơn.

## Trường hợp sử dụng

Ngày giờ (không có múi giờ) phù hợp với các trường hợp nghiệp vụ sau:

- Lịch làm việc theo giờ địa phương
- Thời gian bắt đầu khóa học, thời gian thi
- Thời điểm cửa hàng bắt đầu kinh doanh
- Thời gian nghiệp vụ không muốn chuyển đổi qua các múi giờ

## Cấu hình tạo

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Ngày giờ (không có múi giờ)」 để tạo trường ngày giờ (không có múi giờ).

![20260709232834](https://static-docs.nocobase.com/20260709232834.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Ngày giờ (không có múi giờ) tương ứng với `datetimeNoTz`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Lịch làm việc」, 「Thời gian học」, 「Giờ kinh doanh」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình công việc, v.v. Sau khi tạo thường không thể chỉnh sửa, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Ngày giờ (không có múi giờ) thường sử dụng `datetimeNoTz`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể cấu hình bắt buộc nhập, phạm vi thời gian, v.v. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình công việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm trường

Hành vi mặc định của trường ngày giờ (không có múi giờ) như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `datetimeNoTz`. |
| Field type mặc định | `datetimeNoTz`. |
| Field type tùy chọn | `datetimeNoTz`. |
| Thành phần trên trang | Sử dụng bộ chọn ngày giờ trong chế độ chỉnh sửa. |
| Lọc | Hỗ trợ lọc theo thời điểm, khoảng thời gian, có giá trị và không có giá trị. |
| Sắp xếp | Hỗ trợ sắp xếp theo thời gian. |
| Xác thực | Hỗ trợ xác thực bắt buộc nhập và phạm vi thời gian, v.v. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường ngày giờ (không có múi giờ). Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng trong cơ sở dữ liệu chính đã được đồng bộ hóa, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Có thể chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường của cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường của cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình công việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường ngày giờ (không có múi giờ). Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường ngày giờ (không có múi giờ) được tạo mới trong cơ sở dữ liệu chính, cột thực tế tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó thường cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng tùy thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình công việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Hãy xác nhận trước khi xóa xem trường còn được cấu hình nghiệp vụ nào tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường ngày giờ (không có múi giờ) phù hợp với các nghiệp vụ sử dụng giờ địa phương.
![20260709232511](https://static-docs.nocobase.com/20260709232511.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Chọn ngày và giờ. |
| Khối bảng | Hiển thị, sắp xếp và lọc thời gian. |
| Khối lịch | Dùng làm trường thời gian của sự kiện địa phương. |
| Quy trình công việc | Dùng làm trường điều kiện thời gian. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về tác dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Ngày giờ (có múi giờ)](./datetime.md) — Lưu thời điểm có ngữ nghĩa múi giờ
- [Ngày](./date.md) — Chỉ lưu ngày
