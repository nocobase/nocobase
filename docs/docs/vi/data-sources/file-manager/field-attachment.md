---
title: "Tệp đính kèm"
description: "Trường tệp đính kèm dùng để tải lên và liên kết tệp, siêu dữ liệu tệp được lưu trong bảng tệp."
keywords: "Tệp đính kèm,attachment,tải tệp lên,bảng tệp,NocoBase"
---

# Tệp đính kèm (đã ngừng sử dụng)

## Giới thiệu

:::warning Lưu ý

Trường tệp đính kèm đã ngừng sử dụng, bạn nên sử dụng trường [bảng tệp](./file-collection.md) hoặc [URL tệp đính kèm](../field-attachment-url/index.md).

:::

Trong NocoBase, **tệp đính kèm (Attachment)** được dùng để tải tệp lên và liên kết bản ghi tệp với bản ghi nghiệp vụ hiện tại.

Trường tệp đính kèm thường được liên kết với bảng tệp. Nội dung tệp được lưu bởi công cụ lưu trữ tệp, còn các siêu dữ liệu như tên tệp, kích thước, URL và loại MIME được lưu trong bảng tệp.

Nếu chỉ cần lưu liên kết tệp bên ngoài, hãy chọn [URL tệp đính kèm](../field-attachment-url/index.md) hoặc [URL](../data-modeling/collection-fields/basic/url.md).

## Các trường hợp áp dụng

Tệp đính kèm phù hợp với các trường hợp nghiệp vụ sau:

- Tệp đính kèm hợp đồng, tệp hóa đơn, chứng từ hoàn ứng
- Ảnh sản phẩm, giấy tờ tùy thân của nhân viên, tài liệu dự án
- Ảnh chụp màn hình phiếu công việc, tệp đính kèm vấn đề
- Nhiều tệp liên kết với bản ghi nghiệp vụ

## Tạo cấu hình

Trên trang「Configure fields」của bảng dữ liệu, nhấp vào「Add field」, chọn「Tệp đính kèm」để tạo trường tệp đính kèm.

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

| Cấu hình | Mô tả |
| --- | --- |
| Field interface | Loại giao diện của trường. Tệp đính kèm tương ứng với `attachment`, quyết định cách nhập và hiển thị trên trang. |
| Field display name | Tên hiển thị của trường trong giao diện, chẳng hạn như「Tệp đính kèm hợp đồng」「Tệp hóa đơn」「Ảnh sản phẩm」. Nên sử dụng tên mà nhân viên nghiệp vụ có thể hiểu trực tiếp. |
| Field name | Tên định danh của trường, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc, v.v. Sau khi tạo thường không thể sửa đổi, chỉ hỗ trợ chữ cái, chữ số và dấu gạch dưới, đồng thời phải bắt đầu bằng chữ cái. |
| Field type | Kiểu của trường ở tầng dữ liệu. Trường tệp đính kèm thường là trường quan hệ, liên kết với bản ghi tệp trong bảng tệp. |
| Default value | Giá trị mặc định. Khi thêm bản ghi, nếu người dùng không nhập, hệ thống có thể tự động điền giá trị mặc định. |
| Validation rules | Quy tắc xác thực. Có thể giới hạn việc có bắt buộc hay không; số lượng, kích thước và loại tệp thường được kiểm soát trong thành phần tải lên hoặc cấu hình lưu trữ tệp. |
| Description | Mô tả trường. Phù hợp để ghi ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Tên trường sau khi tạo sẽ được các khối trang, quyền hạn, quy trình làm việc và API tham chiếu. Hãy xác nhận cách đặt tên trước khi tạo để tránh phát sinh chi phí điều chỉnh cấu hình về sau.

:::

## Đặc điểm của trường

Hành vi mặc định của trường tệp đính kèm như sau:

| Đặc điểm | Mô tả |
| --- | --- |
| Mặc định Field interface | `attachment`。 |
| Mặc định Field type | `belongsToMany`。 |
| Field type tùy chọn | `belongsToMany` và các kiểu quan hệ khác, tùy theo cấu hình trường tệp. |
| Thành phần trang | Chế độ chỉnh sửa sử dụng thành phần tải tệp đính kèm lên. |
| Lọc | Thường lọc theo việc có trống hay không, hoặc có tệp liên kết hay không. |
| Sắp xếp | Thường không dùng để sắp xếp. |
| Xác thực | Hỗ trợ các xác thực cơ bản như bắt buộc nhập; giới hạn tải lên tùy theo cấu hình thành phần. |

## Chỉnh sửa cấu hình

Sau khi tạo, nhấp vào「Edit」bên phải trường để chỉnh sửa cấu hình trường tệp đính kèm. Việc chỉnh sửa trường chủ yếu dùng để điều chỉnh cách trường được hiển thị và sử dụng trong NocoBase, chẳng hạn như thay đổi tên hiển thị, mô tả, giá trị mặc định, quy tắc xác thực hoặc cấu hình riêng của trường.

Nếu trường đến từ bảng trong cơ sở dữ liệu chính đã được đồng bộ hóa, việc chỉnh sửa thường là ánh xạ trường — ánh xạ trường cơ sở dữ liệu thành Field type và Field interface của NocoBase.

| Cấu hình | Cho phép chỉnh sửa | Mô tả |
| --- | --- | --- |
| Field display name | Có | Thay đổi tên hiển thị của trường trong giao diện, không thay đổi tên định danh của trường. |
| Field name | Không | Tên định danh của trường thường không thể chỉnh sửa trong biểu mẫu chỉnh sửa sau khi đã tạo. |
| Field interface | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Sau khi điều chỉnh, cách nhập, hiển thị và xác thực trên trang sẽ bị ảnh hưởng. |
| Field type | Hỗ trợ có điều kiện | Có thể điều chỉnh khi ánh xạ trường cơ sở dữ liệu chính hoặc trường đồng bộ. Trước khi điều chỉnh, cần xác nhận dữ liệu hiện có có thể được sử dụng theo kiểu mới hay không. |
| Default value | Có | Điều chỉnh giá trị mặc định khi thêm bản ghi. |
| Validation rules | Có | Điều chỉnh quy tắc xác thực của trường. |
| Description | Có | Bổ sung ý nghĩa của trường, yêu cầu nhập liệu, nguồn dữ liệu hoặc người phụ trách bảo trì. |

:::warning Lưu ý

Việc chuyển đổi Field type hoặc Field interface không đơn giản chỉ là thay đổi tên hiển thị. Thao tác này sẽ ảnh hưởng đến cách lưu trữ trường, thành phần nhập liệu, quy tắc xác thực, điều kiện lọc và cách sử dụng biến quy trình làm việc. Khi có nhiều dữ liệu hiện có, trước tiên hãy xác nhận định dạng dữ liệu có tương thích hay không.

:::

## Xóa trường

Nhấp vào「Delete」bên phải trường để xóa trường tệp đính kèm. Trong cơ sở dữ liệu chính, bạn cũng có thể chọn nhiều trường rồi xóa hàng loạt.

Khi xóa trường tệp đính kèm được tạo mới trong cơ sở dữ liệu chính, thông thường cột thực tế tương ứng trong cơ sở dữ liệu và dữ liệu hiện có của cột đó cũng sẽ bị xóa. Khi xóa trường được đồng bộ từ cơ sở dữ liệu hoặc ánh xạ từ nguồn dữ liệu bên ngoài, phạm vi ảnh hưởng phụ thuộc vào nguồn dữ liệu và nguồn gốc của trường tương ứng.

:::danger Cảnh báo

Việc xóa trường có thể ảnh hưởng đến các khối trang, biểu mẫu, bộ lọc, quyền hạn, quy trình làm việc, API, chức năng nhập xuất và dữ liệu hiện có. Trước khi xóa, hãy xác nhận trường đó có còn được các cấu hình nghiệp vụ tham chiếu hay không.

:::

## Sử dụng trong cấu hình trang

Trường tệp đính kèm phù hợp để sử dụng trong các trường hợp biểu mẫu, chi tiết và quản lý tệp.
![20260709231642](https://static-docs.nocobase.com/20260709231642.png)

| Trường hợp | Công dụng |
| --- | --- |
| Khối biểu mẫu | Tải lên một hoặc nhiều tệp. |
| Khối chi tiết | Xem, xem trước hoặc tải xuống tệp đính kèm. |
| Khối bảng | Hiển thị số lượng tệp đính kèm hoặc lối vào tệp đính kèm. |
| Quy trình làm việc | Sử dụng tệp đính kèm làm tệp liên quan đến phê duyệt, thông báo hoặc xuất dữ liệu. |

## Liên kết liên quan

- [Trường](../index.md) — Tìm hiểu về tác dụng, phân loại và logic ánh xạ của trường
- [Bảng thông thường](../data-source-main/general-collection.md) — Tạo và quản lý trường trong bảng thông thường
- [Bảng tệp](./file-collection.md) — Tìm hiểu cách lưu siêu dữ liệu tệp
- [URL tệp đính kèm](../field-attachment-url/index.md) — Lưu địa chỉ tệp bên ngoài
- [URL](../data-modeling/collection-fields/basic/url.md) — Lưu liên kết thông thường