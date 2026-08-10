---
title: "Thời gian"
description: "Trường thời gian dùng để lưu thời gian trong ngày, chẳng hạn như giờ bắt đầu kinh doanh và giờ nhắc nhở."
keywords: "thời gian,time,trường thời gian,NocoBase"
---

# Thời gian

## Giới thiệu

Trong NocoBase, **thời gian (Time)** được dùng để lưu thời gian trong ngày.

Trường thời gian phù hợp với các dữ liệu nghiệp vụ không gắn với ngày cụ thể, chẳng hạn như giờ kinh doanh, giờ nhắc nhở và khoảng thời gian ca làm việc.

Nếu cần lưu cả ngày và thời gian, hãy chọn [ngày giờ](./datetime.md).

## Các trường hợp sử dụng

Thời gian phù hợp với các trường hợp nghiệp vụ sau:

- Giờ bắt đầu kinh doanh, giờ kết thúc kinh doanh
- Giờ nhắc nhở hằng ngày
- Giờ bắt đầu ca, giờ kết thúc ca
- Cấu hình các mốc thời gian cố định

## Tạo và cấu hình

Trên trang «Configure fields» của bảng dữ liệu, nhấp vào «Add field», chọn «Thời gian» để tạo trường thời gian.

![20240512181216](https://static-docs.nocobase.com/20240512181216.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Thời gian tương ứng với `time`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như «Giờ bắt đầu», «Giờ nhắc nhở», «Giờ kinh doanh». Khuyến nghị sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc, v.v. Sau khi tạo thường không nên chỉnh sửa; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường thời gian mặc định là `time`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể cấu hình bắt buộc nhập, phạm vi thời gian, v.v. |
| Description | Mô tả trường. Thích hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình làm việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường thời gian như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `time`. |
| Field type mặc định | `time`. |
| Field type tùy chọn | `time`. |
| Thành phần trên trang | Sử dụng bộ chọn thời gian trong chế độ chỉnh sửa. |
| Lọc | Hỗ trợ lọc theo thời gian, khoảng thời gian, có giá trị và không có giá trị. |
| Sắp xếp | Hỗ trợ sắp xếp theo thời gian. |
| Xác thực | Hỗ trợ xác thực bắt buộc nhập, phạm vi thời gian, v.v. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào «Edit» ở bên phải trường để chỉnh sửa cấu hình trường thời gian. Chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Có thể chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Điều này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào «Delete» ở bên phải trường để xóa trường thời gian. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường thời gian được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Hãy xác nhận trước khi xóa xem trường đó còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường thời gian phù hợp để sử dụng trong biểu mẫu và cấu hình quy tắc.
![20260709232726](https://static-docs.nocobase.com/20260709232726.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Chọn thời gian trong ngày. |
| Khối bảng | Hiển thị, sắp xếp và lọc thời gian. |
| Khối lọc | Lọc theo khoảng thời gian. |
| Quy trình làm việc | Làm trường điều kiện thời gian. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về tác dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Ngày](./date.md) — Chỉ lưu ngày
- [Ngày giờ (có múi giờ)](./datetime.md) — Lưu ngày và thời gian
