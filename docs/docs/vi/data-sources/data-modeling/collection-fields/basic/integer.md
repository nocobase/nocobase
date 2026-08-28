---
title: "Số nguyên"
description: "Trường số nguyên dùng để lưu các giá trị không có phần thập phân như số lượng, số người, số lần, số ngày."
keywords: "số nguyên,integer,trường số,NocoBase"
---

# Số nguyên

## Giới thiệu

Trong NocoBase, **số nguyên (Integer)** được dùng để lưu các giá trị không có phần thập phân.

Trường số nguyên phù hợp với dữ liệu nghiệp vụ như số lượng, số lần, số người, số thứ tự. Trường này có thể được dùng trong bộ lọc, sắp xếp, thống kê, phân quyền và điều kiện workflow.

Nếu cần lưu số thập phân, số tiền, trọng lượng hoặc tỷ lệ, [số](./number.md) hoặc [phần trăm](./percent.md) sẽ phù hợp hơn.

## Kịch bản áp dụng

Số nguyên phù hợp với các kịch bản nghiệp vụ sau:

- Số lượng sản phẩm, số lượng tồn kho, số lượng mua
- Số người tham gia, số chỗ còn lại, thống kê số lần
- Số ngày thực hiện, số ngày trì hoãn, số ngày của kỳ thanh toán
- Mã số nguyên trong các hệ thống bên ngoài

## Tạo cấu hình

Trên trang「Configure fields」của bảng dữ liệu, nhấp vào「Add field」, sau đó chọn「整数」để tạo trường số nguyên.

![20240512175723](https://static-docs.nocobase.com/20240512175723.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Số nguyên tương ứng với `integer`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như「Số lượng」「Số người」「Số ngày trì hoãn」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, phân quyền, workflow và các chức năng khác. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường số nguyên mặc định là `integer`; với số nguyên có phạm vi lớn, có thể chọn `bigInt`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể giới hạn giá trị nhỏ nhất, lớn nhất hoặc quy định trường bắt buộc. |
| Description | Mô tả trường. Phù hợp để ghi rõ ý nghĩa, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền, workflow và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường số nguyên như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `integer`. |
| Field type mặc định | `integer`. |
| Field type có thể chọn | `integer`、`bigInt`. |
| Thành phần trên trang | Ở chế độ chỉnh sửa, sử dụng ô nhập số. |
| Bộ lọc | Hỗ trợ các bộ lọc số như bằng, không bằng, lớn hơn, nhỏ hơn, trong khoảng, rỗng, không rỗng. |
| Sắp xếp | Hỗ trợ sắp xếp trong khối bảng. |
| Xác thực | Hỗ trợ xác thực số như giá trị nhỏ nhất, giá trị lớn nhất và bắt buộc nhập. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào「Edit」ở bên phải trường để chỉnh sửa cấu hình trường số nguyên. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể thay đổi trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng với kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì của trường. |

:::warning Lưu ý

Chuyển đổi Field type hoặc Field interface không đơn giản chỉ là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến workflow. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào「Delete」ở bên phải trường để xóa trường số nguyên. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường số nguyên được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, workflow, API, chức năng nhập xuất và dữ liệu hiện có. Hãy xác nhận trước khi xóa xem trường đó còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường số nguyên phù hợp để sử dụng trong bảng, biểu mẫu, thống kê và workflow.
![20260709224913](https://static-docs.nocobase.com/20260709224913.png)

| Kịch bản | Mục đích |
| --- | --- |
| Khối biểu mẫu | Nhập số lượng, số lần, số ngày và các giá trị khác không có phần thập phân. |
| Khối bảng | Hiển thị, sắp xếp và lọc số nguyên. |
| Khối biểu đồ | Thống kê theo các trường như số lượng, số lần. |
| Workflow và phân quyền | Được dùng làm trường điều kiện để đánh giá, chẳng hạn như số lượng có lớn hơn 0 hay không. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Số](./number.md) — Lưu các giá trị như số thập phân, số tiền, trọng lượng
- [Phần trăm](./percent.md) — Lưu tỷ lệ hoặc tỷ lệ hoàn thành