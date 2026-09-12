---
title: "URL tệp đính kèm"
description: "Trường URL tệp đính kèm dùng để lưu địa chỉ tệp bên ngoài, phù hợp với các trường hợp không tải lên tệp gốc."
keywords: "URL tệp đính kèm,attachment url,tệp bên ngoài,URL,NocoBase"
---

# URL tệp đính kèm

## Giới thiệu

Trong NocoBase, **URL tệp đính kèm (Attachment URL)** dùng để lưu địa chỉ truy cập tệp bên ngoài.

Trường URL tệp đính kèm phù hợp với các trường hợp tệp đã được lưu trữ trong hệ thống bên ngoài, dịch vụ lưu trữ đối tượng hoặc CDN, và chỉ cần lưu địa chỉ truy cập trong NocoBase.

Nếu cần NocoBase tải lên và quản lý tệp, hãy chọn [Tệp đính kèm](../file-manager/field-attachment.md). Nếu chỉ là địa chỉ trang web thông thường, hãy chọn [URL](../data-modeling/collection-fields/basic/url.md).

## Trường hợp áp dụng

URL tệp đính kèm phù hợp với các trường hợp nghiệp vụ sau:

- Địa chỉ tệp trong dịch vụ lưu trữ đối tượng bên ngoài
- Địa chỉ hình ảnh CDN
- Địa chỉ tài liệu trong hệ thống bên thứ ba
- Liên kết tệp sau khi di chuyển dữ liệu lịch sử

## Tạo cấu hình

Trên trang «Configure fields» của bảng dữ liệu, nhấp vào «Add field» rồi chọn «URL tệp đính kèm» để tạo trường URL tệp đính kèm.

![20241017092323](https://static-docs.nocobase.com/20241017092323.png)

![20241017092456](https://static-docs.nocobase.com/20241017092456.png)

![20241017092759](https://static-docs.nocobase.com/20241017092759.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. URL tệp đính kèm tương ứng với `attachmentUrl`, quyết định cách nhập và hiển thị trong trang. |
| Field display name | Tên hiển thị của trường trên giao diện, chẳng hạn như «Địa chỉ tệp», «URL hình ảnh» hoặc «Tệp đính kèm bên ngoài». Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc, v.v. Sau khi tạo thường không thể sửa đổi, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Loại của trường ở tầng dữ liệu. URL tệp đính kèm thường sử dụng `string` hoặc `text` để lưu địa chỉ. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể cấu hình định dạng URL, độ dài hoặc bắt buộc nhập. |
| Description | Mô tả trường. Thích hợp để ghi rõ ý nghĩa trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sẽ được các khối trang, quyền hạn, quy trình làm việc và API tham chiếu sau khi tạo. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình khi sửa đổi về sau.

:::

## Đặc điểm trường

Hành vi mặc định của trường URL tệp đính kèm như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Field interface mặc định | `attachmentUrl`. |
| Field type mặc định | `string`. |
| Field type tùy chọn | `string`、`text`, tùy theo cấu hình trường thực tế. |
| Thành phần trang | Chế độ chỉnh sửa sử dụng thành phần nhập URL hoặc địa chỉ tệp đính kèm. |
| Lọc | Hỗ trợ bộ lọc dạng văn bản và điều kiện trống. |
| Sắp xếp | Thông thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ xác thực định dạng URL, độ dài, bắt buộc nhập, v.v. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào «Edit» ở bên phải trường để chỉnh sửa cấu hình trường URL tệp đính kèm. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như sửa tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng đã được đồng bộ trong cơ sở dữ liệu chính, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Sửa tên hiển thị của trường trên giao diện, không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Việc điều chỉnh sẽ ảnh hưởng đến cách nhập, hiển thị và xác thực trên trang. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường được đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi mới. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa trường, yêu cầu nhập, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không chỉ đơn giản là thay đổi tên hiển thị. Điều này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, hãy xác nhận trước rằng định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào «Delete» ở bên phải trường để xóa trường URL tệp đính kèm. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường URL tệp đính kèm được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế trong cơ sở dữ liệu và dữ liệu hiện có trong cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, chức năng nhập xuất và dữ liệu hiện có. Hãy xác nhận trước khi xóa rằng trường không còn được các cấu hình nghiệp vụ tham chiếu.

:::

## Sử dụng trong cấu hình trang

Trường URL tệp đính kèm phù hợp để hiển thị và truy cập các tệp bên ngoài.
![20260709231803](https://static-docs.nocobase.com/20260709231803.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Nhập địa chỉ tệp bên ngoài. |
| Khối chi tiết | Hiển thị liên kết tệp. |
| Khối bảng | Hiển thị liên kết hoặc lối vào dạng hình thu nhỏ. |
| Quy trình làm việc | Đưa địa chỉ tệp vào thông báo hoặc yêu cầu bên ngoài. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về công dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Tệp đính kèm](../file-manager/field-attachment.md) — Tải lên và liên kết tệp NocoBase
- [URL](../data-modeling/collection-fields/basic/url.md) — Lưu liên kết thông thường