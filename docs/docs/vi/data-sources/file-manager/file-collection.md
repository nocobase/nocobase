---
title: "Bảng tệp"
description: "Bảng tệp lưu tiêu đề tệp, tên tệp, kích thước, loại MIME, đường dẫn, URL, địa chỉ xem trước, vị trí lưu trữ và siêu thông tin mở rộng, dùng để liên kết với trường tệp đính kèm."
keywords: "Bảng tệp,File Collection,attachments,siêu thông tin,tệp đính kèm,NocoBase"
---

# Bảng tệp

<PluginInfo name="file-manager"></PluginInfo>

## Giới thiệu

Bảng tệp phù hợp để lưu siêu thông tin tệp, chẳng hạn như tên tệp, phần mở rộng, kích thước, loại MIME, đường dẫn, URL, địa chỉ xem trước, vị trí lưu trữ và meta tùy chỉnh. Nội dung tệp được lưu bởi công cụ lưu trữ tệp, còn bảng tệp lưu siêu dữ liệu của tệp.

Chỉ có thể tạo bảng tệp thông qua trang cơ sở dữ liệu chính; cơ sở dữ liệu bên ngoài, nguồn dữ liệu REST API và nguồn dữ liệu NocoBase bên ngoài không hỗ trợ tạo bảng tệp.

## Trường hợp sử dụng

Bảng tệp phù hợp với các trường hợp nghiệp vụ sau:

- Tệp đính kèm hợp đồng, tệp hóa đơn, chứng từ hoàn ứng
- Ảnh sản phẩm, giấy tờ nhân viên, tài liệu dự án
- Tệp tải lên, tệp xem trước và tệp tải xuống của bản ghi nghiệp vụ
- Thư viện tệp đính kèm cần quản lý riêng siêu thông tin tệp

## Quy trình sử dụng

Bảng tệp thường không được sử dụng trực tiếp làm bảng nghiệp vụ chính. Quy trình phổ biến là:

1. Tạo bảng tệp để lưu tiêu đề tệp, tên tệp, kích thước, loại, URL, vị trí lưu trữ và các siêu thông tin khác.
2. Tạo trường quan hệ trong bảng nghiệp vụ để liên kết với bảng tệp. Ví dụ: liên kết với bảng tệp «Tệp đính kèm hợp đồng» trong bảng «Hợp đồng».
3. Thêm trường quan hệ vào khối biểu mẫu của bảng nghiệp vụ để người dùng tải tệp lên khi thêm hoặc chỉnh sửa bản ghi nghiệp vụ.
4. Sau khi tải lên hoàn tất, NocoBase sẽ ghi siêu thông tin tệp vào bảng tệp và liên kết bản ghi tệp với bản ghi nghiệp vụ hiện tại thông qua trường quan hệ.
5. Hiển thị trường tệp đính kèm trong khối chi tiết, khối bảng hoặc khối danh sách của bảng nghiệp vụ để người dùng xem, xem trước hoặc tải xuống tệp.

## Cấu hình tạo

Trong cơ sở dữ liệu chính, nhấp vào «Create collection», chọn «File collection» để tạo bảng tệp.

![20240324090414](https://static-docs.nocobase.com/20240324090414.png)

Cấu hình tạo bảng tệp về cơ bản giống với bảng thông thường. Bảng tệp được thiết lập sẵn một nhóm trường siêu thông tin tệp để lưu tiêu đề, đường dẫn, URL, vị trí lưu trữ và thông tin mở rộng của tệp tải lên.

| Cấu hình | Mô tả |
| --- | --- |
| Collection display name | Tên hiển thị của bảng dữ liệu trên giao diện, chẳng hạn như «Tệp đính kèm hợp đồng», «Tệp hóa đơn», «Ảnh sản phẩm». |
| Collection name | Tên định danh của bảng dữ liệu, dùng cho các tham chiếu nội bộ như API, trường quan hệ, quyền và quy trình công việc. |
| Categories | Phân loại bảng dữ liệu. Phân loại chỉ ảnh hưởng đến cách tổ chức trong giao diện quản lý bảng dữ liệu, không thay đổi cấu trúc bảng dữ liệu. |
| Description | Mô tả bảng dữ liệu. Có thể ghi bảng tệp này lưu những tệp nào, do ai tải lên và liên quan đến những bảng nghiệp vụ nào. |
| Preset fields | Các trường đặt sẵn. Khi tạo bảng tệp, nên giữ lại các trường hệ thống và trường tích hợp sẵn của bảng tệp. |

### Các trường tích hợp sẵn

Sau khi tạo, bảng tệp thường chứa các trường tích hợp sẵn sau. Nội dung tệp được lưu trong bộ lưu trữ tệp, còn bảng tệp lưu các siêu thông tin này.

| Trường | Tên trường | Mô tả |
| --- | --- | --- |
| ID | `id` | Trường khóa chính mặc định, dùng để định danh duy nhất một bản ghi tệp. |
| Title | `title` | Tiêu đề tệp, thường dùng để hiển thị trên giao diện. |
| File name | `filename` | Tên tệp. |
| Extension name | `extname` | Phần mở rộng tệp. |
| Size | `size` | Kích thước tệp. |
| MIME type | `mimetype` | Loại MIME của tệp. |
| Path | `path` | Đường dẫn của tệp trong bộ lưu trữ. |
| URL | `url` | Địa chỉ truy cập tệp. |
| Preview | `preview` | Địa chỉ xem trước tệp. |
| Storage | `storage` / `storageId` | Bộ lưu trữ chứa tệp. `storage` là trường quan hệ, `storageId` là khóa ngoại tương ứng. |
| Meta | `meta` | Siêu thông tin mở rộng của tệp. |
| Thời gian tạo | `createdAt` | Tự động ghi lại thời gian tạo bản ghi tệp. |
| Người tạo | `createdBy` | Tự động ghi lại người dùng tải lên hoặc tạo bản ghi tệp. |
| Thời gian cập nhật | `updatedAt` | Tự động ghi lại thời gian cập nhật gần nhất của bản ghi tệp. |
| Người cập nhật | `updatedBy` | Tự động ghi lại người dùng cập nhật bản ghi tệp lần cuối. |
| Không gian | `space` | Có sẵn sau khi bật [plugin đa không gian](../../multi-app/multi-space/index.md), dùng để cô lập dữ liệu theo không gian. Sẽ không xuất hiện khi chưa bật đa không gian. |

![20240324090527](https://static-docs.nocobase.com/20240324090527.png)

### Trường khóa chính

Bảng tệp, cũng như bảng thông thường, cần có trường khóa chính. Trường tệp đính kèm và trường quan hệ sẽ liên kết với siêu thông tin tệp thông qua bản ghi khóa chính.

Nếu bảng tệp không có khóa chính, cần thiết lập «Record unique key» khi chỉnh sửa bảng dữ liệu; nếu không, bản ghi tệp đính kèm có thể không được liên kết, xem trước hoặc chỉnh sửa chính xác.

## Tạo quan hệ liên kết
Tạo trường quan hệ trong bảng nghiệp vụ để liên kết với bảng tệp.

![20240324091529](https://static-docs.nocobase.com/20240324091529.png)

## Cấu hình và sử dụng trên trang

Dữ liệu của bảng tệp thường được tự động tạo thông qua thao tác tải lên của component tệp đính kèm. Sử dụng trong khối biểu mẫu, khối chi tiết hoặc khối quan hệ.

![20260710160424](https://static-docs.nocobase.com/20260710160424.png)

![20240324091321](https://static-docs.nocobase.com/20240324091321.png)

| Vị trí cấu hình | Mục đích |
| --- | --- |
| [Khối biểu mẫu](../../interface-builder/blocks/data-blocks/form.md) | Tải tệp đính kèm lên trong bản ghi của bảng nghiệp vụ. |
| [Khối chi tiết](../../interface-builder/blocks/data-blocks/details.md) | Hiển thị, xem trước hoặc tải xuống tệp đính kèm. |
| [Khối bảng](../../interface-builder/blocks/data-blocks/table.md) | Hiển thị trường tệp đính kèm trong danh sách. |
| [Khối quan hệ](../../interface-builder/blocks/data-blocks/table.md) | Quản lý trực tiếp các bản ghi tệp liên kết với bản ghi nghiệp vụ hiện tại. |


## Chỉnh sửa cấu hình

Trong danh sách bảng dữ liệu, nhấp vào «Edit» ở bên phải bảng tệp để sửa đổi các cấu hình như tên hiển thị, phân loại, mô tả, chế độ phân trang đơn giản và «Record unique key» của bảng dữ liệu.

Các trường siêu thông tin tệp thường được tự động ghi trong quá trình tải lên; không nên thay đổi ý nghĩa nghiệp vụ của các trường như `url`, `path`, `storageId`. Nếu cần mở rộng thông tin nghiệp vụ của tệp, có thể thêm các trường mới, chẳng hạn như «Loại tệp», «Giai đoạn», «Đã lưu trữ».

## Xóa bảng dữ liệu

Trong danh sách bảng dữ liệu, nhấp vào «Delete» ở bên phải bảng tệp để xóa bảng tệp.

Xóa bảng tệp sẽ xóa các bản ghi siêu thông tin tệp và siêu dữ liệu Collection liên quan. Trước khi xóa, hãy xác nhận các trường tệp đính kèm, trường quan hệ, khối trang, quyền, quy trình công việc và API trong bảng nghiệp vụ không còn phụ thuộc vào bảng này.

:::danger Cảnh báo

Bảng tệp lưu siêu thông tin tệp. Việc xóa bản ghi bảng tệp có thể khiến tham chiếu tệp đính kèm trong bản ghi nghiệp vụ mất hiệu lực; việc có đồng thời xóa nội dung tệp hay không phụ thuộc vào bộ lưu trữ tệp và cấu hình nghiệp vụ. Trước khi thao tác, hãy xác nhận tệp còn được nghiệp vụ sử dụng hay không.

:::

## Liên kết liên quan

- [Bảng thông thường](../data-source-main/general-collection.md) — Xem cấu hình chung và cách sử dụng các khối
- [Các trường của bảng dữ liệu](../data-modeling/collection-fields/index.md) — Xem cấu hình trường tệp đính kèm và trường quan hệ
- [Trình quản lý tệp](../../plugins/@nocobase/plugin-file-manager/index.md) — Xem cấu hình liên quan đến bộ lưu trữ tệp
- [Đa không gian](../../multi-app/multi-space/index.md) — Tìm hiểu về trường không gian và khả năng cô lập không gian