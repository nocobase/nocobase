---
pkg: "@nocobase/plugin-collection-tree"
title: "Bảng cây"
description: "Bảng cây dùng để lưu trữ dữ liệu có quan hệ cấp trên - cấp dưới như cơ cấu tổ chức, phân loại sản phẩm, phân cấp khu vực, danh mục phòng ban, sử dụng cấu trúc bảng kề để lưu quan hệ cha-con."
keywords: "bảng cây,bộ sưu tập dạng cây,bảng kề,dữ liệu phân cấp,Tree Collection,NocoBase"
---

# Bảng cây

## Giới thiệu

Bảng cây phù hợp để lưu trữ dữ liệu có quan hệ cấp trên - cấp dưới, chẳng hạn như cơ cấu tổ chức, phân loại sản phẩm, phân cấp khu vực, danh mục phòng ban và danh mục cơ sở tri thức. Bảng cây sử dụng cấu trúc bảng kề để lưu quan hệ cha-con, mỗi bản ghi đều có thể trỏ đến nút cha của chính nó.

Chỉ có thể tạo bảng cây thông qua trang cơ sở dữ liệu chính. Cơ sở dữ liệu bên ngoài, nguồn dữ liệu REST API và nguồn dữ liệu NocoBase bên ngoài không hỗ trợ tạo bảng cây.

## Trường hợp sử dụng

Bảng cây phù hợp với các trường hợp sau:

- Cơ cấu tổ chức công ty, cấp bậc phòng ban
- Phân loại sản phẩm, danh mục cơ sở tri thức, danh mục tài liệu
- Cấp tỉnh, thành phố, quận, huyện; khu vực bán hàng; cấp bậc điểm dịch vụ
- Phân loại BOM, phân loại thiết bị, phân loại tài sản

## Cấu hình tạo

Trong cơ sở dữ liệu chính, nhấp vào 「Create collection」 rồi chọn 「Tree collection」 để tạo bảng cây.

![20240324143228](https://static-docs.nocobase.com/20240324143228.png)

Cấu hình tạo bảng cây về cơ bản giống với bảng thông thường.

| Cấu hình | Mô tả |
| --- | --- |
| Collection display name | Tên hiển thị của bảng dữ liệu trên giao diện, chẳng hạn như 「Cơ cấu tổ chức」「Phân loại sản phẩm」「Phân cấp khu vực」. |
| Collection name | Tên định danh của bảng dữ liệu, dùng để tham chiếu nội bộ trong API, trường quan hệ, quyền hạn, quy trình làm việc, v.v. |
| Inherits | Chọn bảng cha cần kế thừa. Chỉ hiển thị khi cơ sở dữ liệu chính là PostgreSQL. |
| Categories | Phân loại bảng dữ liệu. Phân loại chỉ ảnh hưởng đến cách tổ chức trong giao diện quản lý bảng dữ liệu, không thay đổi cấu trúc bảng dữ liệu. |
| Description | Mô tả bảng dữ liệu. Có thể ghi rõ bảng cây này lưu trữ dữ liệu phân cấp nào, do ai duy trì và được dùng để lọc ở những trang nào. |
| Preset fields | Các trường đặt trước. Khi tạo bảng cây, bạn nên giữ lại các trường hệ thống và trường tích hợp sẵn của bảng cây. |

### Các trường tích hợp sẵn

Sau khi tạo bảng cây, bảng thường bao gồm các trường tích hợp sẵn sau. `parentId`, `parent` và `children` được dùng để lưu quan hệ phân cấp dạng cây.

| Trường | Tên trường | Mô tả |
| --- | --- | --- |
| ID | `id` | Trường khóa chính mặc định, dùng để định danh duy nhất một bản ghi. |
| Thời gian tạo | `createdAt` | Tự động ghi lại thời gian tạo bản ghi này. |
| Người tạo | `createdBy` | Tự động ghi lại người dùng đã tạo bản ghi này. |
| Thời gian cập nhật | `updatedAt` | Tự động ghi lại thời điểm cập nhật bản ghi này lần cuối. |
| Người cập nhật | `updatedBy` | Tự động ghi lại người dùng đã cập nhật bản ghi này lần cuối. |
| Parent ID | `parentId` | Lưu ID của nút cha. Nút gốc thường để trống. |
| Parent | `parent` | Trường quan hệ nhiều-một, trỏ đến nút cha trong bảng hiện tại. |
| Children | `children` | Trường quan hệ một-nhiều, biểu thị các nút con của nút hiện tại. |
| Không gian | `space` | Khả dụng sau khi bật [plugin đa không gian](../../multi-app/multi-space/index.md), dùng để cô lập dữ liệu theo không gian. Sẽ không xuất hiện nếu chưa bật tính năng đa không gian. |

![20240324143555](https://static-docs.nocobase.com/20240324143555.png)

:::warning Lưu ý

Dữ liệu bảng cây cần tránh hình thành quan hệ vòng lặp, chẳng hạn nút cha của A là B, còn nút cha của B lại là A. Quan hệ vòng lặp sẽ khiến việc hiển thị dạng cây và kết quả lọc trở nên bất thường.

:::

### Trường khóa chính

Bảng cây, giống như bảng thông thường, cần có trường khóa chính. Các trường quan hệ dạng cây sẽ liên kết ID nút cha với bản ghi khóa chính trong cùng một bảng.

Nếu bảng cây không có khóa chính, cần đặt 「Record unique key」 khi chỉnh sửa bảng dữ liệu; nếu không, các khối trên trang có thể không xem hoặc chỉnh sửa bản ghi chính xác, đồng thời việc định vị nút trong chế độ hiển thị dạng cây cũng có thể không ổn định.

## Sử dụng cấu hình trang

Bảng cây có thể sử dụng phần lớn các khối dữ liệu của [bảng thông thường](../data-source-main/general-collection.md) để thực hiện các thao tác thêm, xóa, sửa và tra cứu. Ngoài ra, bảng cây còn có thể kết hợp với tính năng dạng cây:

| Khối | Công dụng |
| --- | --- |
| [Khối bảng](../../interface-builder/blocks/data-blocks/table.md#启用树表) | Hiển thị các bản ghi dạng cây, dùng để xem và duy trì cấu trúc cấp trên - cấp dưới. |
| [Khối biểu mẫu](../../interface-builder/blocks/data-blocks/form.md) | Thêm hoặc chỉnh sửa một bản ghi nút cây. |
| [Khối chi tiết](../../interface-builder/blocks/data-blocks/details.md) | Xem chi tiết của một nút cây. |
| [Khối lọc dạng cây](../../interface-builder/blocks/filter-blocks/tree.md) | Dùng cấu trúc cây để lọc các khối dữ liệu khác, thường được sử dụng để lọc theo cấp phân loại, tổ chức, khu vực, v.v. |

## Cấu hình chỉnh sửa

Trong danh sách bảng dữ liệu, nhấp vào 「Edit」 ở bên phải bảng cây để sửa các cấu hình như tên hiển thị, phân loại, mô tả, chế độ phân trang đơn giản và 「Record unique key」 của bảng dữ liệu.

Thông thường không nên tùy ý xóa các trường quan hệ cha-con của bảng cây hoặc chuyển chúng sang mục đích sử dụng khác. Nếu cần điều chỉnh cấu trúc phân cấp, trước tiên hãy sửa quan hệ nút cha trong dữ liệu bản ghi.

## Xóa bảng dữ liệu

Trong danh sách bảng dữ liệu, nhấp vào 「Delete」 ở bên phải bảng cây để xóa bảng cây.

Xóa bảng cây sẽ xóa siêu dữ liệu Collection, bảng dữ liệu thực và dữ liệu quan hệ dạng cây của bảng này. Trước khi xóa, hãy xác nhận xem các khối trên trang, khối lọc dạng cây, trường quan hệ, quyền hạn, quy trình làm việc và API còn phụ thuộc vào bảng này hay không.

:::danger Cảnh báo

Bảng cây thường được dùng làm điều kiện lọc cho các khối khác. Sau khi xóa bảng cây, các khối lọc dạng cây liên quan và cấu hình trang phụ thuộc vào cấp phân loại đó đều có thể ngừng hoạt động.

:::

## Liên kết liên quan

- [Bảng thông thường](../data-source-main/general-collection.md) — Xem cấu hình chung và cách sử dụng các khối
- [Khối bảng](../../interface-builder/blocks/data-blocks/table.md) — Bật chế độ hiển thị bảng cây trong bảng
- [Khối lọc dạng cây](../../interface-builder/blocks/filter-blocks/tree.md) — Sử dụng cấu trúc cây để lọc dữ liệu
- [Đa không gian](../../multi-app/multi-space/index.md) — Tìm hiểu về trường không gian và khả năng cô lập không gian