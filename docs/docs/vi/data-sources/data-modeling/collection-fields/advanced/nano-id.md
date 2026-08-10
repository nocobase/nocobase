---
title: "Nano ID"
description: "Trường Nano ID dùng để tạo mã nhận dạng duy nhất ngẫu nhiên ngắn."
keywords: "Nano ID,nanoid,mã nhận dạng duy nhất,NocoBase"
---

# Nano ID

## Giới thiệu

Trong NocoBase, **Nano ID (Nano ID)** được dùng để tạo ID duy nhất ngẫu nhiên ngắn.

Nano ID phù hợp với các trường hợp cần chuỗi nhận dạng ngắn, chẳng hạn như liên kết ngắn, mã công khai và ID tham chiếu bên ngoài.

Nếu dùng làm khóa chính nội bộ mặc định, Snowflake ID thường trực tiếp hơn. Nếu cần mã nghiệp vụ dễ đọc, hãy chọn [chuỗi tuần tự](../../../field-sequence/index.md).

## Trường hợp sử dụng

Nano ID phù hợp với các trường hợp nghiệp vụ sau:

- Nhãn nhận dạng liên kết ngắn
- ID chia sẻ công khai
- Mã tham chiếu bên ngoài
- Chuỗi duy nhất ngẫu nhiên ngắn

## Cấu hình tạo

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Nano ID」 để tạo trường Nano ID.

![20240512173225](https://static-docs.nocobase.com/20240512173225.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Nano ID tương ứng với `nanoId`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「ID chia sẻ」, 「ID công khai」 hoặc 「Mã nhận dạng ngắn」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên nhận dạng của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, quy trình làm việc, v.v. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Nano ID mặc định sử dụng `string`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Thường được hệ thống tự động tạo và không cần kiểm tra thủ công. |
| Description | Mô tả trường. Phù hợp để ghi rõ ý nghĩa trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền, quy trình làm việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình khi thay đổi sau này.

:::

## Đặc điểm trường

Hành vi mặc định của trường Nano ID như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `nanoId`. |
| Field type mặc định | `string`. |
| Field type tùy chọn | `string`. |
| Thành phần trên trang | Thường được tự động tạo và không cần nhập thủ công. |
| Lọc | Hỗ trợ tìm kiếm chính xác theo Nano ID. |
| Sắp xếp | Thường không dùng Nano ID để sắp xếp theo nghiệp vụ. |
| Kiểm tra | Thường được tự động tạo và duy trì tính duy nhất. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường Nano ID. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc kiểm tra hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên nhận dạng của trường. |
| Field name | Không | Tên nhận dạng của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và kiểm tra trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc kiểm tra trường. |
| Description | Có | Bổ sung ý nghĩa trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc kiểm tra, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường Nano ID. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường Nano ID được tạo mới trong cơ sở dữ liệu chính, cột thực tế trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó thường cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Việc xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, quy trình làm việc, API, chức năng nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó không còn được các cấu hình nghiệp vụ tham chiếu.

:::

## Sử dụng trong cấu hình trang

Trường Nano ID phù hợp với các trường hợp dùng mã nhận dạng ngắn công khai và tham chiếu bên ngoài.
![20260710151321](https://static-docs.nocobase.com/20260710151321.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Thường không được chỉnh sửa thủ công mà do hệ thống tạo. |
| Khối chi tiết | Hiển thị mã nhận dạng ngắn. |
| API | Dùng làm mã nhận dạng công khai của bản ghi. |
| Liên kết bên ngoài | Dùng làm một phần của liên kết ngắn hoặc liên kết chia sẻ. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về vai trò, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Snowflake ID](./snowflake-id.md) — Sử dụng ID nội bộ mặc định
- [UUID](./uuid.md) — Sử dụng UUID
- [Chuỗi tuần tự](../../../field-sequence/index.md) — Tạo mã nghiệp vụ dễ đọc