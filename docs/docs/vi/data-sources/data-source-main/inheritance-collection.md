---
pkg: "@nocobase/plugin-data-source-main"
title: "Bảng kế thừa"
description: "Bảng kế thừa được dẫn xuất từ bảng cha để tạo thành bảng con. Bảng con kế thừa cấu trúc trường của bảng cha và có thể định nghĩa các trường riêng. Chỉ được hỗ trợ khi cơ sở dữ liệu chính là PostgreSQL."
keywords: "Bảng kế thừa,Inheritance Collection,Kế thừa bảng,Mở rộng bảng dữ liệu,PostgreSQL,NocoBase"
---

# Bảng kế thừa

## Giới thiệu

Bảng kế thừa là phần mở rộng dựa trên bảng thông thường, phù hợp khi nhiều bảng dữ liệu cần dùng chung một nhóm trường, đồng thời mỗi bảng con vẫn có các trường riêng.

Ví dụ, trước tiên tạo bảng cha 「Tài sản」 để lưu các trường chung như mã tài sản, tên tài sản, ngày mua, người phụ trách, sau đó dẫn xuất các bảng con như 「Tài sản máy tính」「Tài sản xe cộ」「Nội thất văn phòng」. Bảng con sẽ kế thừa cấu trúc trường của bảng cha và có thể tiếp tục định nghĩa các trường riêng.

:::warning Lưu ý

Chỉ có thể tạo bảng kế thừa khi cơ sở dữ liệu chính là PostgreSQL. Các cơ sở dữ liệu chính khác, cơ sở dữ liệu bên ngoài, nguồn dữ liệu REST API và nguồn dữ liệu NocoBase bên ngoài đều không hỗ trợ bảng kế thừa.

:::

## Các trường hợp áp dụng

Bảng kế thừa phù hợp với các trường hợp nghiệp vụ sau:

- Dẫn xuất tài sản máy tính, tài sản xe cộ, nội thất văn phòng từ bảng cha tài sản
- Dẫn xuất nhân viên, nhân sự thuê ngoài, khách từ bảng cha nhân sự
- Dẫn xuất nhiệm vụ, lỗi, yêu cầu từ bảng cha công việc
- Dẫn xuất hợp đồng mua sắm, hợp đồng bán hàng, hợp đồng dịch vụ từ bảng cha hợp đồng

Điều kiện phù hợp để sử dụng bảng kế thừa là: các đối tượng này có các trường chung ổn định, và điểm khác biệt giữa các bảng con chủ yếu nằm ở một số ít trường riêng.

## Tạo cấu hình

Trong cơ sở dữ liệu chính, khi nhấp vào 「Create collection」 và chọn bảng thông thường hoặc mục tạo hỗ trợ kế thừa, bạn có thể chọn bảng cha thông qua `Inherits`.

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)

| Cấu hình | Mô tả |
| --- | --- |
| Collection display name | Tên hiển thị của bảng dữ liệu trên giao diện, chẳng hạn như 「Tài sản máy tính」「Tài sản xe cộ」「Nội thất văn phòng」. |
| Collection name | Tên định danh của bảng dữ liệu, được dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc và các chức năng khác. |
| Inherits | Chọn bảng cha cần kế thừa. Bảng dữ liệu hiện tại sẽ kế thừa cấu trúc trường của bảng cha và có thể tiếp tục định nghĩa các trường riêng. |
| Categories | Phân loại bảng dữ liệu. Phân loại chỉ ảnh hưởng đến cách tổ chức trong giao diện quản lý bảng dữ liệu, không thay đổi cấu trúc bảng dữ liệu. |
| Description | Mô tả bảng dữ liệu. Có thể ghi loại dữ liệu mà bảng con lưu trữ, bảng con được dẫn xuất từ bảng cha nào và do ai quản lý. |
| Preset fields | Các trường cài đặt sẵn. Bảng kế thừa thường vẫn giữ các trường ID, thời gian tạo, người tạo, thời gian cập nhật, người cập nhật của bảng thông thường. |

Bảng kế thừa có thể sử dụng cách cấu hình khối và trường của [bảng thông thường](./general-collection.md). Đối với các khối trên trang, bảng này vẫn là một bảng dữ liệu có thể thêm, xóa, sửa và truy vấn.

:::warning Lưu ý

Bảng kế thừa phù hợp với các đối tượng nghiệp vụ có cấu trúc tương đồng cao. Nếu quy trình nghiệp vụ, quyền hạn và giao diện của các đối tượng khác biệt lớn, việc tách thành các bảng thông thường rồi liên kết bằng trường quan hệ thường sẽ rõ ràng hơn.

:::

### Các trường tích hợp sẵn

Bảng kế thừa sẽ kế thừa các trường hiện có của bảng cha, đồng thời có thể tiếp tục thêm các trường riêng.

| Nguồn trường | Mô tả |
| --- | --- |
| Trường của bảng cha | Bảng con sẽ kế thừa các trường chung của bảng cha, chẳng hạn như mã tài sản, tên tài sản, người phụ trách. |
| Trường của bảng con | Bảng con có thể tiếp tục định nghĩa các trường riêng, chẳng hạn như 「Mẫu CPU」 của tài sản máy tính và 「Biển số xe」 của tài sản xe cộ. |
| Trường hệ thống | Nếu giữ lại `Preset fields` khi tạo, bảng sẽ bao gồm các trường ID, thời gian tạo, người tạo, thời gian cập nhật, người cập nhật và các trường khác. |

:::warning Lưu ý

Các trường của bảng cha sẽ ảnh hưởng đến tất cả bảng con kế thừa bảng đó. Trước khi sửa đổi trường của bảng cha, hãy xác nhận xem các trang, quyền hạn, quy trình làm việc và API của bảng con có phụ thuộc vào những trường này hay không.

:::

### Trường khóa chính

Bảng kế thừa cũng cần có trường khóa chính như bảng thông thường. Khi tạo bảng, nên giữ lại trường cài đặt sẵn ID; kiểu khóa chính mặc định là `Snowflake ID (53-bit)`.

Nếu bảng kế thừa sau khi kết nối hoặc đồng bộ không có khóa chính, cần thiết lập 「Record unique key」 khi chỉnh sửa bảng dữ liệu, nếu không các khối trên trang có thể không xem hoặc chỉnh sửa bản ghi chính xác.

## Sử dụng cấu hình trang

Bảng kế thừa có thể được sử dụng trong hầu hết các khối trên trang mà bảng thông thường hỗ trợ. Cách dùng phổ biến là cấu hình từng bảng con thành các khối bảng, biểu mẫu, chi tiết hoặc bảng kanban độc lập.

| Khối | Công dụng |
| --- | --- |
| [Khối bảng](../../interface-builder/blocks/data-blocks/table.md) | Xem, lọc, sắp xếp và xử lý hàng loạt các bản ghi của bảng con. |
| [Khối biểu mẫu](../../interface-builder/blocks/data-blocks/form.md) | Thêm hoặc chỉnh sửa một bản ghi của bảng con. |
| [Khối chi tiết](../../interface-builder/blocks/data-blocks/details.md) | Xem thông tin chi tiết của một bản ghi thuộc bảng con. |
| [Khối kanban](../../interface-builder/blocks/data-blocks/kanban.md) | Nhóm và hiển thị các bản ghi của bảng con theo các trường như trạng thái, giai đoạn, người phụ trách. |

## Chỉnh sửa cấu hình

Trong danh sách bảng dữ liệu, nhấp vào 「Edit」 ở bên phải bảng kế thừa để sửa đổi các cấu hình như tên hiển thị, phân loại, mô tả, chế độ phân trang đơn giản và 「Record unique key」 của bảng dữ liệu.

Không nên thường xuyên điều chỉnh quan hệ kế thừa sau khi đã sử dụng rộng rãi trong các cấu hình nghiệp vụ hiện có. Các khối trên trang, trường quan hệ, quyền hạn và quy trình làm việc đều có thể phụ thuộc vào cấu trúc trường hiện tại.

## óa bảng dữ liệu

Trong danh sách bảng dữ liệu, nhấp vào 「Delete」 ở bên phải bảng kế thừa để xóa bảng kế thừa.

Xóa bảng kế thừa sẽ xóa siêu dữ liệu Collection của bảng con này và bảng dữ liệu thực trong cơ sở dữ liệu chính. Trước khi xóa, hãy xác nhận xem còn khối trên trang, trường quan hệ, quyền hạn, quy trình làm việc hoặc API nào đang sử dụng bảng con này hay không.

:::danger Cảnh báo

Xóa bảng kế thừa không tự động đồng nghĩa với việc xóa bảng cha. Việc có xóa các đối tượng phụ thuộc hay không tùy thuộc vào các tùy chọn trong bước xác nhận xóa. Trước khi thao tác, hãy xác nhận xem bảng cha và các bảng con khác có còn cần được giữ lại hay không.

:::

## Liên kết liên quan

- [Bảng thông thường](./general-collection.md) — Xem cấu hình chung của bảng thông thường
- [Cơ sở dữ liệu chính](./index.md) — Xem các loại cơ sở dữ liệu được cơ sở dữ liệu chính hỗ trợ
- [Trường bảng dữ liệu](../data-modeling/collection-fields/index.md) — Xem cách cấu hình trường