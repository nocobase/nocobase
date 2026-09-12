---
title: "Ngày cập nhật"
description: "Trường ngày cập nhật dùng để tự động ghi lại lần cuối một bản ghi được cập nhật."
keywords: "Ngày cập nhật,updatedAt,trường hệ thống,NocoBase"
---

# Ngày cập nhật

## Giới thiệu

Trong NocoBase, **Ngày cập nhật (Updated at)** được dùng để tự động ghi lại thời điểm cập nhật cuối cùng của bản ghi.

Ngày cập nhật thường được tạo bởi trường được thiết lập sẵn. Trường này phù hợp để kiểm tra nhật ký, xác định trạng thái đồng bộ, sắp xếp, lọc và làm điều kiện cho quy trình làm việc.

Nếu cần lưu thời điểm hoàn thành, thời điểm phê duyệt và các mốc thời gian nghiệp vụ khác, hãy sử dụng [ngày giờ](../datetime/datetime.md).

## Trường hợp sử dụng

Ngày cập nhật phù hợp với các trường hợp nghiệp vụ sau:

- Xem thời điểm cập nhật cuối cùng
- Lọc dữ liệu được cập nhật gần đây
- Xác định dữ liệu đã lâu không được duy trì
- So sánh thời điểm cập nhật khi đồng bộ với hệ thống bên ngoài

## Tạo cấu hình

Trên trang «Configure fields» của bảng dữ liệu, nhấp vào «Add field», chọn «Ngày cập nhật» để tạo trường ngày cập nhật.

![20240512174826](https://static-docs.nocobase.com/20240512174826.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Ngày cập nhật tương ứng với `updatedAt`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như «Ngày cập nhật» hoặc «Thời điểm cập nhật cuối cùng». Bạn nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc, v.v. Sau khi tạo, tên này thường không được thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Ngày cập nhật thường sử dụng `date`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Được hệ thống tự động duy trì, thường không cần kiểm tra thủ công. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình làm việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường ngày cập nhật như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `updatedAt`. |
| Field type mặc định | `date`. |
| Field type có thể chọn | `date`. |
| Thành phần trên trang | Hệ thống tự động ghi, trên trang thường chỉ hiển thị ở chế độ chỉ đọc. |
| Lọc | Hỗ trợ lọc theo thời gian và khoảng thời gian. |
| Sắp xếp | Hỗ trợ sắp xếp theo thời gian. |
| Kiểm tra | Được hệ thống tự động ghi. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào «Edit» ở bên phải trường để chỉnh sửa cấu hình trường ngày cập nhật. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc kiểm tra hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Có thể chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và kiểm tra trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc kiểm tra của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách duy trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc kiểm tra, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào «Delete» ở bên phải trường để xóa trường ngày cập nhật. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường ngày cập nhật được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó không còn được cấu hình nghiệp vụ nào tham chiếu.

:::

## Sử dụng trong cấu hình trang

Trường ngày cập nhật phù hợp để sử dụng trong danh sách, chi tiết, bộ lọc và việc xác định trạng thái đồng bộ.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Trường hợp | Mục đích |
| --- | --- |
| Khối bảng | Hiển thị và sắp xếp theo thời điểm cập nhật cuối cùng. |
| Khối lọc | Lọc các bản ghi được cập nhật gần đây hoặc đã lâu không được cập nhật. |
| Khối chi tiết | Xem thời điểm cập nhật cuối cùng. |
| Quy trình làm việc | Tham gia đánh giá với tư cách là điều kiện thời gian. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về tác dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Ngày tạo](./created-at.md) — Tự động ghi lại thời điểm tạo
- [Ngày giờ (có múi giờ)](../datetime/datetime.md) — Lưu thời gian nghiệp vụ
