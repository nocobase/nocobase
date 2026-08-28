---
title: "Snowflake ID"
description: "Trường Snowflake ID dùng để tạo ID tuyết 53-bit, thường được dùng làm khóa chính mặc định."
keywords: "Snowflake ID,snowflakeId,khóa chính,NocoBase"
---

# Snowflake ID

## Giới thiệu

Trong NocoBase, **Snowflake ID（Snowflake ID）** được dùng để tạo mã định danh duy nhất.

Snowflake ID là loại khóa chính thường được sử dụng cho trường ID mặc định của các bảng thông thường trong NocoBase. Loại này phù hợp để làm mã định danh duy nhất cho các bản ghi nội bộ.

Nếu cần một mã số mà hệ thống bên ngoài có thể đọc được, hãy sử dụng [chuỗi tuần tự](../../../field-sequence/index.md) hoặc trường mã nghiệp vụ.

## Trường hợp sử dụng

Snowflake ID phù hợp với các trường hợp nghiệp vụ sau:

- Khóa chính mặc định của bảng thông thường
- ID của bản ghi nội bộ
- Bảng nghiệp vụ cần tạo ID duy nhất với hiệu suất cao
- Mã định danh duy nhất không cần con người nhận biết

## Cấu hình tạo

Trên trang「Configure fields」của bảng dữ liệu, nhấp vào「Add field」, chọn「Snowflake ID」để tạo trường Snowflake ID.

![20251209204217](https://static-docs.nocobase.com/20251209204217.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Snowflake ID tương ứng với `snowflakeId`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như「ID」「ID bản ghi」「ID nội bộ」. Khuyến nghị sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình công việc, v.v. Sau khi tạo thường không thể thay đổi, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Snowflake ID thường sử dụng `bigInt`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Thường được hệ thống tự động tạo, không cần kiểm tra thủ công. |
| Description | Mô tả trường. Phù hợp để ghi rõ ý nghĩa trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình công việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình khi thay đổi sau này.

:::

## Đặc điểm của trường

Hành vi mặc định của trường Snowflake ID như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `snowflakeId`. |
| Field type mặc định | `bigInt`. |
| Field type có thể chọn | `bigInt`. |
| Thành phần trang | Thường được tự động tạo, không cần nhập thủ công. |
| Lọc | Hỗ trợ truy vấn chính xác theo ID. |
| Sắp xếp | Hỗ trợ sắp xếp. |
| Kiểm tra | Thường được tự động tạo và duy trì tính duy nhất. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào「Edit」ở bên phải trường để chỉnh sửa cấu hình trường Snowflake ID. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc kiểm tra hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện, không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và kiểm tra trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc kiểm tra trường. |
| Description | Có | Bổ sung ý nghĩa trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc kiểm tra, điều kiện lọc và cách sử dụng biến quy trình công việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào「Delete」ở bên phải trường để xóa trường Snowflake ID. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường Snowflake ID được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình công việc, API, chức năng nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường Snowflake ID phù hợp để làm khóa chính và mã định danh duy nhất nội bộ.
![20260710145423](https://static-docs.nocobase.com/20260710145423.png)

| Trường hợp | Mục đích |
| --- | --- |
| Tạo bảng | Dùng làm trường ID mặc định. |
| Trường quan hệ | Làm mã định danh duy nhất của bản ghi liên quan. |
| API | Dùng để xác định một bản ghi riêng lẻ. |
| Quyền hạn và quy trình công việc | Tham gia xử lý nội bộ với tư cách là mã định danh duy nhất của bản ghi. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [UUID](./uuid.md) — Sử dụng UUID làm mã định danh duy nhất
- [Nano ID](./nano-id.md) — Sử dụng ID ngắn
- [Chuỗi tuần tự](../../../field-sequence/index.md) — Tạo mã nghiệp vụ
