---
title: "JSON"
description: "Trường JSON dùng để lưu các đối tượng có cấu trúc, mảng, các phần phản hồi API và những dữ liệu bán cấu trúc khác."
keywords: "JSON,json,dữ liệu có cấu trúc,NocoBase"
---

# JSON

## Giới thiệu

Trong NocoBase, **JSON (JSON)** được dùng để lưu dữ liệu có cấu trúc hoặc bán cấu trúc.

Trường JSON phù hợp để lưu các phần phản hồi từ API bên ngoài, cấu hình mở rộng, thuộc tính động và các dữ liệu có cấu trúc không cố định khác. Trường này linh hoạt, nhưng không dễ lọc, kiểm tra và hiển thị như các trường thông thường.

Nếu cấu trúc dữ liệu ổn định, nên tách thành các trường rõ ràng để thuận tiện cho việc cấu hình giao diện, phân quyền, lọc và sử dụng trong workflow.

## Trường hợp sử dụng

JSON phù hợp với các trường hợp nghiệp vụ sau:

- Phản hồi thô từ API bên ngoài
- Thuộc tính mở rộng động
- Các đối tượng cấu hình phức tạp
- Lưu tạm dữ liệu không thể tách thành các trường có cấu trúc

## Tạo và cấu hình

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「JSON」 để tạo trường JSON.

![20240512173905](https://static-docs.nocobase.com/20240512173905.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. JSON tương ứng với `json`, quyết định cách nhập và hiển thị trong giao diện. |
| Field display name | Tên hiển thị của trường trong giao diện, chẳng hạn như 「Thông tin mở rộng」「Phản hồi API」「Cấu hình」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, phân quyền, workflow và các chức năng khác. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường JSON thường sử dụng `json` hoặc `jsonb`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc kiểm tra. Thường dùng để kiểm tra JSON có hợp lệ hay trường có bắt buộc hay không. |
| Description | Mô tả trường. Có thể dùng để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối giao diện, phân quyền, workflow và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường JSON như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `json`. |
| Field type mặc định | `json`. |
| Field type tùy chọn | `json`, `jsonb`, tùy theo khả năng của cơ sở dữ liệu. |
| Thành phần giao diện | Ở chế độ chỉnh sửa, sử dụng thành phần chỉnh sửa JSON hoặc thành phần nhập văn bản. |
| Lọc | Khả năng lọc phụ thuộc vào cơ sở dữ liệu và ánh xạ trường; thông thường không dùng làm trường lọc chính. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Kiểm tra | Hỗ trợ kiểm tra JSON hợp lệ, trường bắt buộc và các quy tắc khác. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 bên phải trường để chỉnh sửa cấu hình trường JSON. Việc chỉnh sửa trường chủ yếu nhằm điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc kiểm tra hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu sang Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trong giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và kiểm tra trên giao diện sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc kiểm tra của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không đơn giản chỉ là thay đổi tên hiển thị. Thao tác này ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc kiểm tra, điều kiện lọc và cách sử dụng biến workflow. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 bên phải trường để xóa trường JSON. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường JSON được tạo trong cơ sở dữ liệu chính, thông thường cột thực tương ứng trong cơ sở dữ liệu và dữ liệu hiện có của cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Việc xóa trường có thể ảnh hưởng đến các khối giao diện, biểu mẫu, bộ lọc, phân quyền, workflow, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó không còn được các cấu hình nghiệp vụ tham chiếu.

:::

## Sử dụng trong cấu hình giao diện

Trường JSON phù hợp để sử dụng trong các tình huống tích hợp và cấu hình mở rộng.
![20260710151854](https://static-docs.nocobase.com/20260710151854.png)

| Tình huống | Công dụng |
| --- | --- |
| Khối biểu mẫu | Nhập hoặc chỉnh sửa dữ liệu JSON. |
| Khối chi tiết | Hiển thị nội dung có cấu trúc. |
| Workflow | Lưu hoặc đọc các phần phản hồi từ API bên ngoài. |
| API | Truyền vào hoặc trả về dưới dạng đối tượng mở rộng. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Văn bản nhiều dòng](../basic/textarea.md) — Lưu nội dung văn bản thuần túy dài
- [Công thức](../../../field-formula/index.md) — Tính toán kết quả dựa trên các trường
