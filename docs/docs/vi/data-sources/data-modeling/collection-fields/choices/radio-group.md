---
title: "Nhóm nút radio"
description: "Trường nhóm nút radio dùng để hiển thị các tùy chọn theo hàng trên trang và chọn một giá trị trong số đó."
keywords: "nhóm nút radio,radio group,trường tùy chọn,NocoBase"
---

# Nhóm nút radio

## Giới thiệu

Trong NocoBase, **nhóm nút radio (Radio group)** được dùng để chọn một giá trị trong một nhóm tùy chọn và hiển thị trực tiếp các tùy chọn đó trong biểu mẫu.

Nhóm nút radio phù hợp với các trường hợp có ít tùy chọn và cần để người dùng nhìn thấy tất cả tùy chọn ngay lập tức. Cách này tương tự như lựa chọn một giá trị trong danh sách thả xuống, điểm khác biệt chủ yếu nằm ở phương thức tương tác trên trang.

Nếu có nhiều tùy chọn, hãy chọn [lựa chọn một trong danh sách thả xuống](./select.md) để tiết kiệm không gian. Nếu cần chọn nhiều giá trị, hãy chọn [nhóm hộp kiểm](./checkbox-group.md).

## Trường hợp áp dụng

Nhóm nút radio phù hợp với các trường hợp nghiệp vụ sau:

- Mức độ ưu tiên: thấp, trung bình, cao
- Các tùy chọn mở rộng như giới tính, loại, có/không
- Kết quả phê duyệt: thông qua, từ chối
- Lựa chọn nhanh một số ít tùy chọn cố định

## Tạo cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Nhóm nút radio」 để tạo trường nhóm nút radio.
![20260709231205](https://static-docs.nocobase.com/20260709231205.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Nhóm nút radio tương ứng với `radioGroup`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Mức độ ưu tiên」, 「Kết quả phê duyệt」, 「Loại」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc, v.v. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Nhóm nút radio mặc định là `string`, dùng để lưu giá trị tùy chọn đã chọn. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Thông thường dùng để thiết lập bắt buộc nhập và duy trì các giá trị tùy chọn. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trên trang, quyền hạn, quy trình làm việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm trường

Hành vi mặc định của trường nhóm nút radio như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `radioGroup`. |
| Field type mặc định | `string`. |
| Field type có thể chọn | `string`. |
| Thành phần trên trang | Chế độ chỉnh sửa sử dụng nhóm nút radio. |
| Lọc | Hỗ trợ lọc theo tùy chọn. |
| Sắp xếp | Hỗ trợ sắp xếp theo giá trị tùy chọn. |
| Xác thực | Hỗ trợ ràng buộc bắt buộc nhập và phạm vi tùy chọn. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường nhóm nút radio. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, khi chỉnh sửa thường là thực hiện ánh xạ trường — ánh xạ trường cơ sở dữ liệu sang Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không đơn giản chỉ là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường nhóm nút radio. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường nhóm nút radio được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trên trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, việc nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó không còn được cấu hình nghiệp vụ nào tham chiếu.

:::

## Sử dụng trong cấu hình trang

Nhóm nút radio phù hợp để hiển thị một số ít tùy chọn theo hàng trong biểu mẫu.
![20260709230347](https://static-docs.nocobase.com/20260709230347.png)

| Trường hợp | Mục đích |
| --- | --- |
| Khối biểu mẫu | Hiển thị trực tiếp tất cả tùy chọn và chọn một tùy chọn. |
| Khối chi tiết | Hiển thị tùy chọn đã chọn. |
| Khối lọc | Lọc bản ghi theo tùy chọn. |
| Quy trình làm việc và quyền hạn | Tham gia phán đoán với tư cách là điều kiện như trạng thái, loại, v.v. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về chức năng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Lựa chọn một trong danh sách thả xuống](./select.md) — Sử dụng khi có nhiều tùy chọn
- [Nhóm hộp kiểm](./checkbox-group.md) — Chọn nhiều giá trị
