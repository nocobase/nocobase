---
title: "Màu sắc"
description: "Trường màu sắc dùng để lưu giá trị màu, phù hợp với trạng thái, phân loại, nhãn và cấu hình hiển thị."
keywords: "màu sắc,color,trường,NocoBase"
---

# Màu sắc

## Giới thiệu

Trong NocoBase, **màu sắc (Color)** được dùng để lưu giá trị màu.

Trường màu sắc phù hợp để lưu màu cho phân loại, nhãn, trạng thái, biểu đồ hoặc cấu hình hiển thị. Trường này thường lưu giá trị màu hệ thập lục phân hoặc các định dạng màu được thành phần hỗ trợ.

Nếu màu sắc chỉ là một phần của trường tùy chọn, bạn có thể cấu hình màu trực tiếp trong trường tùy chọn mà không nhất thiết phải tạo riêng một trường màu sắc.

## Các trường hợp sử dụng

Màu sắc phù hợp với các trường hợp nghiệp vụ sau:

- Màu cấp khách hàng, màu trạng thái
- Màu nhãn, màu phân loại
- Màu chuỗi dữ liệu trong biểu đồ
- Cấu hình hiển thị của trang hoặc thẻ

## Tạo và cấu hình

Trên trang「Configure fields」của bảng dữ liệu, nhấp vào「Add field」, sau đó chọn「Màu sắc」để tạo trường màu sắc.

![20240512175956](https://static-docs.nocobase.com/20240512175956.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Màu sắc tương ứng với `color`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như「Màu trạng thái」「Màu nhãn」「Màu biểu đồ」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu ngay. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền, quy trình làm việc, v.v. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. Trường màu sắc mặc định là `string`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi mới, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Thông thường chỉ cần cấu hình bắt buộc nhập. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền, quy trình làm việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình khi thay đổi về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường màu sắc như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `color`. |
| Field type mặc định | `string`. |
| Field type có thể chọn | `string`. |
| Thành phần trên trang | Ở chế độ chỉnh sửa, sử dụng thành phần chọn màu. |
| Lọc | Có thể lọc theo giá trị màu, nhưng thường không phải điều kiện truy vấn chính. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ các xác thực cơ bản như bắt buộc nhập. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào「Edit」bên phải trường để chỉnh sửa cấu hình trường màu sắc. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu sang Field type và Field interface của NocoBase.

| Cấu hình | Có thể chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể thay đổi trong biểu mẫu chỉnh sửa sau khi tạo. |
| Field interface | Hỗ trợ tùy điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ tùy điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể sử dụng theo loại mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến trong quy trình làm việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước xem định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào「Delete」bên phải trường để xóa trường màu sắc. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường màu sắc được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền, quy trình làm việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường màu sắc phù hợp để sử dụng trong các tình huống hiển thị và cấu hình trên trang.
![20260709225444](https://static-docs.nocobase.com/20260709225444.png)

| Tình huống | Công dụng |
| --- | --- |
| Khối biểu mẫu | Chọn giá trị màu. |
| Khối chi tiết | Hiển thị màu. |
| Danh sách hoặc thẻ | Làm dấu hiệu trực quan cho trạng thái, nhãn hoặc phân loại. |
| Biểu đồ | Làm nguồn cấu hình màu. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về công dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Biểu tượng](./icon.md) — Lưu định danh biểu tượng
- [Lựa chọn đơn từ danh sách thả xuống](../choices/select.md) — Cấu hình màu trực tiếp trong các tùy chọn
