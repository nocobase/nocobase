---
title: "Hộp kiểm"
description: "Trường hộp kiểm dùng để lưu các giá trị boolean như có hoặc không, bật hoặc tắt."
keywords: "hộp kiểm,checkbox,giá trị boolean,boolean,NocoBase"
---

# Hộp kiểm

## Giới thiệu

Trong NocoBase, **hộp kiểm (Checkbox)** được dùng để lưu các giá trị boolean với hai lựa chọn.

Trường hộp kiểm phù hợp với các判断 đơn giản như trạng thái bật, có phải mặc định hay không, đã hoàn thành hay chưa, có cần phê duyệt hay không. Ý nghĩa của nó rõ ràng hơn so với việc lưu “có/không” dưới dạng văn bản.

Nếu trạng thái có nhiều hơn hai giá trị, chẳng hạn như bản nháp, đang thực hiện và đã hoàn thành, thì [danh sách thả xuống một lựa chọn](./select.md) sẽ phù hợp hơn.

## Các trường hợp sử dụng

Hộp kiểm phù hợp với các trường hợp nghiệp vụ sau:

- Có bật hay không, có phải mặc định hay không
- Đã hoàn thành hay chưa, đã đọc hay chưa
- Có cần phê duyệt hay không, có xuất hóa đơn hay không
- Có công khai hay không, có lưu trữ hay không

## Tạo cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Hộp kiểm」 để tạo trường hộp kiểm.

![20240512180122](https://static-docs.nocobase.com/20240512180122.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Hộp kiểm tương ứng với `checkbox`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Có bật hay không」, 「Đã hoàn thành hay chưa」, 「Có xuất hóa đơn hay không」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc và các thành phần khác. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường hộp kiểm mặc định là `boolean`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Thường dùng để cấu hình trường bắt buộc hoặc giá trị mặc định. |
| Description | Mô tả trường. Có thể ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình làm việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường hộp kiểm như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `checkbox`. |
| Field type mặc định | `boolean`. |
| Field type có thể chọn | `boolean`. |
| Thành phần trên trang | Sử dụng hộp kiểm ở chế độ chỉnh sửa. |
| Lọc | Hỗ trợ lọc theo có, không hoặc để trống. |
| Sắp xếp | Hỗ trợ sắp xếp theo giá trị boolean. |
| Xác thực | Hỗ trợ các cấu hình cơ bản như bắt buộc và giá trị mặc định. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường hộp kiểm. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể sử dụng với kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Điều này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến trong quy trình làm việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường hộp kiểm. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường hộp kiểm rồi xóa hàng loạt.

Khi xóa trường hộp kiểm được tạo trong cơ sở dữ liệu chính, thông thường cột thực tế tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, chức năng nhập xuất và dữ liệu hiện có. Hãy xác nhận trước khi xóa xem trường có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường hộp kiểm phù hợp để sử dụng trong biểu mẫu, bảng, bộ lọc và điều kiện quy trình làm việc.
![20260709225738](https://static-docs.nocobase.com/20260709225738.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Nhập giá trị có hoặc không. |
| Khối bảng | Hiển thị trạng thái hộp kiểm và hỗ trợ lọc. |
| Khối bộ lọc | Lọc theo các điều kiện như có bật hay không, đã hoàn thành hay chưa. |
| Quy trình làm việc và quyền hạn | Tham gia đánh giá với tư cách là điều kiện boolean. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về chức năng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Danh sách thả xuống một lựa chọn](./select.md) — Lưu một giá trị trong nhiều trạng thái
- [Nhóm nút radio](./radio-group.md) — Hiển thị các tùy chọn bằng nút radio