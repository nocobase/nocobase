---
title: "Dấu thời gian Unix"
description: "Trường dấu thời gian Unix dùng để lưu giá trị dấu thời gian từ các hệ thống bên ngoài."
keywords: "Dấu thời gian Unix,unix timestamp,dấu thời gian,NocoBase"
---

# Dấu thời gian Unix

## Giới thiệu

Trong NocoBase, **dấu thời gian Unix (Unix timestamp)** được dùng để lưu dấu thời gian Unix.

Dấu thời gian Unix thường được sử dụng để tích hợp với các hệ thống bên ngoài, dữ liệu nhật ký hoặc di chuyển dữ liệu lịch sử. Giá trị được lưu là một số, nhưng ý nghĩa nghiệp vụ là thời gian.

Nếu hệ thống bên ngoài không yêu cầu dấu thời gian Unix, sử dụng trực tiếp [ngày giờ](./datetime.md) sẽ dễ hiểu và bảo trì hơn.

## Trường hợp sử dụng

Dấu thời gian Unix phù hợp với các trường hợp nghiệp vụ sau:

- Đồng bộ dấu thời gian với hệ thống bên ngoài
- Thời điểm phát sinh nhật ký
- Unix timestamp do API trả về
- Trường thời gian trong quá trình di chuyển dữ liệu lịch sử

## Tạo cấu hình

Trong trang「Configure fields」của bảng dữ liệu, nhấp vào「Add field」, chọn「Dấu thời gian Unix」 để tạo trường dấu thời gian Unix.

![20240512180432](https://static-docs.nocobase.com/20240512180432.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Dấu thời gian Unix tương ứng với `unixTimestamp`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như「Dấu thời gian đồng bộ」「Thời gian nhật ký」「Thời gian cập nhật bên ngoài」. Khuyến nghị sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, quy trình công việc, v.v. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Dấu thời gian Unix thường được lưu bằng số nguyên hoặc số nguyên lớn. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể cấu hình bắt buộc nhập và phạm vi giá trị. |
| Description | Mô tả trường. Phù hợp để ghi rõ ý nghĩa trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền, quy trình công việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm trường

Hành vi mặc định của trường dấu thời gian Unix như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `unixTimestamp`。 |
| Field type mặc định | `bigInt`。 |
| Field type có thể chọn | `integer`、`bigInt`。 |
| Thành phần trên trang | Ở chế độ chỉnh sửa, trường được xử lý theo thành phần trường dấu thời gian. |
| Lọc | Hỗ trợ lọc theo giá trị số của dấu thời gian hoặc theo khoảng thời gian sau khi ánh xạ. |
| Sắp xếp | Hỗ trợ sắp xếp. |
| Xác thực | Hỗ trợ xác thực bắt buộc nhập và phạm vi giá trị. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào「Edit」ở bên phải trường để chỉnh sửa cấu hình trường dấu thời gian Unix. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là thực hiện ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ tùy điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Việc điều chỉnh sẽ ảnh hưởng đến cách nhập, hiển thị và xác thực trên trang. |
| Field type | Hỗ trợ tùy điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Điều này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình công việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào「Delete」ở bên phải trường để xóa trường dấu thời gian Unix. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường dấu thời gian Unix được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực và dữ liệu hiện có trong cột đó trong cơ sở dữ liệu cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, quy trình công việc, API, việc nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường dấu thời gian Unix phù hợp với các trường hợp tích hợp hệ thống bên ngoài và nhật ký.
![20260709232558](https://static-docs.nocobase.com/20260709232558.png)

| Trường hợp | Mục đích |
| --- | --- |
| Khối biểu mẫu | Nhập hoặc ánh xạ dấu thời gian. |
| Khối bảng | Hiển thị, sắp xếp và lọc dấu thời gian. |
| Quy trình công việc | Sử dụng làm điều kiện thời gian của hệ thống bên ngoài. |
| API | Tích hợp với các API yêu cầu Unix timestamp. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Ngày giờ (bao gồm múi giờ)](./datetime.md) — Lưu ngày giờ thông thường
- [Số nguyên](../basic/integer.md) — Lưu số nguyên thông thường