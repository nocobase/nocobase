---
title: "Hình tròn"
description: "Trường hình tròn dùng để lưu các khu vực được biểu thị bằng tâm và bán kính."
keywords: "Hình tròn,Circle,hình học,bản đồ,NocoBase"
---

# Hình tròn

## Giới thiệu

Trong NocoBase, **hình tròn (Circle)** dùng để lưu các khu vực hình tròn.

Trường hình tròn phù hợp với dữ liệu nghiệp vụ như bán kính phục vụ, phạm vi giao hàng và phạm vi bao phủ của cửa hàng.

Nếu khu vực không có dạng hình tròn, hãy chọn [đa giác](./polygon.md). Nếu chỉ cần vị trí trung tâm, hãy chọn [điểm](./point.md).

## Các trường hợp sử dụng

Hình tròn phù hợp với các trường hợp nghiệp vụ sau:

- Bán kính phục vụ của cửa hàng
- Phạm vi bao phủ giao hàng
- Phạm vi ảnh hưởng của thiết bị
- Phạm vi tìm kiếm xung quanh một điểm

## Cấu hình khi tạo

Trên trang 「Configure fields」 của bảng dữ liệu, nhấp vào 「Add field」 rồi chọn 「Hình tròn」 để tạo trường hình tròn.

![20240512181522](https://static-docs.nocobase.com/20240512181522.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Hình tròn tương ứng với `circle`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như 「Bán kính phục vụ」, 「Phạm vi bao phủ」, 「Phạm vi ảnh hưởng」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình công việc và các chức năng khác. Sau khi tạo thường không nên thay đổi; chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường hình tròn mặc định là `circle`. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Thông thường chỉ cần cấu hình bắt buộc nhập. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình công việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường hình tròn như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Default Field interface | `circle`. |
| Default Field type | `circle`. |
| Field type tùy chọn | `circle`. |
| Thành phần trên trang | Sử dụng thành phần vẽ trên bản đồ trong chế độ chỉnh sửa. |
| Lọc | Khả năng lọc không gian phụ thuộc vào plugin bản đồ và khả năng của nguồn dữ liệu. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ các quy tắc xác thực cơ bản như bắt buộc nhập. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào 「Edit」 ở bên phải trường để chỉnh sửa cấu hình trường hình tròn. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ một bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trên giao diện mà không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ tùy điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Việc điều chỉnh sẽ ảnh hưởng đến cách nhập, hiển thị và xác thực trên trang. |
| Field type | Hỗ trợ tùy điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng với kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình công việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào 「Delete」 ở bên phải trường để xóa trường hình tròn. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường hình tròn được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tương ứng trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Việc xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình công việc, API, việc nhập xuất dữ liệu và dữ liệu hiện có. Hãy xác nhận trường không còn được cấu hình nghiệp vụ nào tham chiếu trước khi xóa.

:::

## Sử dụng trong cấu hình trang

Trường hình tròn phù hợp để sử dụng trong các trường hợp liên quan đến phạm vi phục vụ và phạm vi bao phủ.
![20260710145031](https://static-docs.nocobase.com/20260710145031.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Vẽ phạm vi hình tròn. |
| Khối chi tiết | Hiển thị khu vực hình tròn. |
| Khối bản đồ | Hiển thị phạm vi bao phủ trên bản đồ. |
| Quy trình công việc | Tham gia vào quy trình dưới dạng dữ liệu liên quan đến phạm vi. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về tác dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../../../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Điểm](./point.md) — Lưu vị trí trung tâm
- [Đa giác](./polygon.md) — Lưu các khu vực không có dạng hình tròn