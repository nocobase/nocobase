---
title: "Công thức"
description: "Trường công thức dùng để tính toán kết quả dựa trên các trường khác, chẳng hạn như số tiền, điểm số, văn bản trạng thái."
keywords: "Công thức,formula,trường tính toán,NocoBase"
---

# Công thức

## Giới thiệu

Trong NocoBase, **công thức (Formula)** được dùng để tính giá trị trường dựa trên biểu thức.

Trường công thức phù hợp với các trường hợp như tính số tiền, tính điểm, nối văn bản và tính toán theo điều kiện. Giá trị của trường thường được tạo từ biểu thức, không phù hợp để nhập trực tiếp thủ công.

Nếu kết quả cần được nhập thủ công, hãy chọn loại trường cơ bản tương ứng. Nếu logic tính toán quá phức tạp, hãy cân nhắc sử dụng workflow hoặc khung nhìn cơ sở dữ liệu để xử lý.

## Các trường hợp sử dụng

Công thức phù hợp với những trường hợp nghiệp vụ sau:

- Thành tiền đơn hàng, số tiền đã bao gồm thuế
- Điểm số, điểm trọng số, điểm hiệu suất
- Tên hiển thị sau khi nối văn bản
- Kết quả nghiệp vụ được tính theo điều kiện

## Tạo cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」, chọn 「Công thức」 để tạo trường công thức.

![20240512173541](https://static-docs.nocobase.com/20240512173541.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Công thức tương ứng với `formula`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Thành tiền đơn hàng」, 「Điểm tổng hợp」, 「Tên hiển thị」. Bạn nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, workflow, v.v. Sau khi tạo thường không thể chỉnh sửa, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Trường công thức sử dụng `formula`, loại kết quả phụ thuộc vào cấu hình công thức. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Cần chú ý biểu thức công thức có đầy đủ hay không và các trường được tham chiếu có tồn tại hay không. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, workflow và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình khi thay đổi sau này.

:::

## Đặc điểm của trường

Hành vi mặc định của trường công thức như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `formula`。 |
| Field type mặc định | `formula`。 |
| Field type có thể chọn | `formula`。 |
| Thành phần trên trang | Ở chế độ chỉnh sửa thường cấu hình biểu thức công thức; ở chế độ đọc hiển thị kết quả tính toán. |
| Bộ lọc | Có thể lọc hay không tùy thuộc vào kết quả công thức và cách thức thực thi. |
| Sắp xếp | Có thể sắp xếp hay không tùy thuộc vào kết quả công thức và cách thức thực thi. |
| Xác thực | Phụ thuộc vào biểu thức công thức và loại kết quả. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường công thức. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện, không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Có điều kiện | Các trường trong cơ sở dữ liệu chính hoặc trường được đồng bộ có thể được điều chỉnh khi ánh xạ trường. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Có điều kiện | Các trường trong cơ sở dữ liệu chính hoặc trường được đồng bộ có thể được điều chỉnh khi ánh xạ trường. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Điều này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến workflow. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường công thức. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường công thức được tạo trong cơ sở dữ liệu chính, thông thường cột thực trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Việc xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, workflow, API, chức năng nhập xuất và dữ liệu hiện có. Hãy xác nhận trước khi xóa xem trường có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường công thức phù hợp để hiển thị kết quả tính toán trong bảng, phần chi tiết, phần thống kê và workflow.
![20260710151619](https://static-docs.nocobase.com/20260710151619.png)

| Trường hợp | Mục đích |
| --- | --- |
| Cấu hình trường | Viết biểu thức công thức và chọn các trường được tham chiếu. |
| Khối bảng | Hiển thị kết quả tính toán. |
| Khối chi tiết | Hiển thị kết quả tính toán của một bản ghi. |
| Workflow | Đọc kết quả công thức để tham gia vào các phán đoán tiếp theo. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về chức năng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Số](../data-modeling/collection-fields/basic/number.md) — Lưu các giá trị số được dùng để tính toán
- [JSON](../data-modeling/collection-fields/advanced/json.md) — Lưu kết quả có cấu trúc
