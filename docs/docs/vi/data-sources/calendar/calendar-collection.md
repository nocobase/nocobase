---
pkg: "@nocobase/plugin-calendar"
title: "Bảng lịch"
description: "Bảng lịch dùng để lưu dữ liệu có phạm vi thời gian như cuộc họp, lịch trình, khóa học, lịch trực, kết hợp với khối lịch để hiển thị và chỉnh sửa bản ghi sự kiện."
keywords: "Bảng lịch,Calendar Collection,sự kiện lịch,sự kiện lặp lại,khối lịch,NocoBase"
---

# Bảng lịch

## Giới thiệu

Bảng lịch phù hợp để lưu dữ liệu có phạm vi thời gian, chẳng hạn như đặt phòng họp, lịch trình dự án, lịch học, kế hoạch trực và lịch hoạt động. Về bản chất, đây vẫn là một bảng dữ liệu, nhưng được tạo sẵn các trường liên quan đến sự kiện lịch để thuận tiện sử dụng cùng khối lịch.

Bảng lịch chỉ có thể được tạo thông qua trang cơ sở dữ liệu chính. Cơ sở dữ liệu bên ngoài, nguồn dữ liệu REST API và nguồn dữ liệu NocoBase bên ngoài không hỗ trợ tạo bảng lịch.

## Các trường hợp áp dụng

Bảng lịch phù hợp với các trường hợp nghiệp vụ sau:

- Đặt phòng họp, đặt xe, đặt thiết bị
- Lịch trình dự án, kế hoạch nhiệm vụ, kế hoạch mốc quan trọng
- Thời khóa biểu, kế hoạch đào tạo, lịch hoạt động
- Kế hoạch trực, lịch phân ca, kế hoạch kiểm tra
- Các bản ghi sự kiện cần được xem theo ngày, tuần hoặc tháng

## Cấu hình tạo

Trong cơ sở dữ liệu chính, nhấp vào「Create collection」, chọn「Calendar collection」để tạo bảng lịch.

Cấu hình tạo bảng lịch về cơ bản giống với bảng thông thường. `Preset fields` dùng để kiểm soát các trường hệ thống thường dùng; bảng lịch cũng được tạo sẵn các trường dùng để lưu sự kiện lặp lại.

| Cấu hình | Mô tả |
| --- | --- |
| Collection display name | Tên hiển thị của bảng dữ liệu trên giao diện, chẳng hạn như「Đặt phòng họp」「Lịch học」「Kế hoạch trực」。 |
| Collection name | Tên định danh của bảng dữ liệu, dùng cho các tham chiếu nội bộ như API, trường quan hệ, quyền hạn và quy trình làm việc. |
| Inherits | Chọn bảng cha cần kế thừa. Chỉ hiển thị khi cơ sở dữ liệu chính là PostgreSQL. |
| Categories | Phân loại bảng dữ liệu. Việc phân loại chỉ ảnh hưởng đến cách tổ chức trong giao diện quản lý bảng dữ liệu, không thay đổi cấu trúc bảng dữ liệu. |
| Description | Mô tả bảng dữ liệu. Có thể ghi rõ bảng lịch này lưu những sự kiện nào, do ai duy trì và liên quan đến các quy trình nghiệp vụ nào. |
| Preset fields | Các trường đặt sẵn. Khi tạo bảng lịch, nên giữ lại các trường hệ thống và trường tích hợp sẵn của bảng lịch. |

### Các trường tích hợp sẵn

Sau khi tạo, bảng lịch thường bao gồm các trường tích hợp sẵn sau. `cron` và `exclude` dùng để lưu quy tắc sự kiện lặp lại và các ngày loại trừ.

| Trường | Tên trường | Mô tả |
| --- | --- | --- |
| ID | `id` | Trường khóa chính mặc định, dùng để định danh duy nhất một bản ghi sự kiện. |
| Thời gian tạo | `createdAt` | Tự động ghi lại thời điểm tạo bản ghi sự kiện. |
| Người tạo | `createdBy` | Tự động ghi lại người dùng đã tạo bản ghi sự kiện. |
| Thời gian cập nhật | `updatedAt` | Tự động ghi lại thời điểm cập nhật bản ghi sự kiện lần cuối. |
| Người cập nhật | `updatedBy` | Tự động ghi lại người dùng đã cập nhật bản ghi sự kiện lần cuối. |
| Thứ tự | `sort` | Lưu giá trị sắp xếp của bản ghi sự kiện, dùng để hỗ trợ các khả năng sắp xếp như kéo và thả. |
| Repeats | `cron` | Lưu quy tắc sự kiện lặp lại, chẳng hạn như lặp lại hằng ngày, hằng tuần, hằng tháng hoặc hằng năm. |
| Exclude | `exclude` | Lưu các ngày bị loại trừ khỏi sự kiện lặp lại, thường được tự động duy trì thông qua tương tác với lịch. |
| Không gian | `space` | Có sẵn sau khi bật [plugin đa không gian](../../multi-app/multi-space/index.md), dùng để cô lập dữ liệu theo không gian. Sẽ không xuất hiện nếu chưa bật đa không gian. |

Khi khối lịch sử dụng bảng lịch, cần chỉ định thêm các trường nghiệp vụ dùng để hiển thị sự kiện:

| Cấu hình | Mô tả |
| --- | --- |
| Trường tiêu đề | Xác định tiêu đề của sự kiện trên lịch, chẳng hạn như「Chủ đề cuộc họp」「Tên khóa học」。 |
| Trường ngày bắt đầu | Xác định thời gian bắt đầu của sự kiện. Thường sử dụng trường ngày giờ. |
| Trường ngày kết thúc | Xác định thời gian kết thúc của sự kiện. Thường sử dụng trường ngày giờ. |

:::warning Lưu ý

`cron` và `exclude` thường được khả năng lịch duy trì, không nên chỉnh sửa trực tiếp như các trường nghiệp vụ thông thường. Cần tự tạo và cấu hình các trường tiêu đề, ngày bắt đầu và ngày kết thúc theo yêu cầu nghiệp vụ; nếu không, khối lịch sẽ không thể hiển thị sự kiện chính xác.

:::

### Trường khóa chính

Bảng lịch cũng cần có trường khóa chính như bảng thông thường. Khi tạo bảng, nên giữ lại trường ID đặt sẵn; kiểu khóa chính mặc định là `Snowflake ID (53-bit)`.

Nếu bảng lịch không có khóa chính, cần đặt「Record unique key」khi chỉnh sửa bảng dữ liệu; nếu không, khối lịch có thể không mở, chỉnh sửa hoặc định vị bản ghi sự kiện chính xác.

## Chỉnh sửa cấu hình

Trong danh sách bảng dữ liệu, nhấp vào「Edit」ở bên phải bảng lịch để sửa các cấu hình như tên hiển thị, phân loại, mô tả, chế độ phân trang đơn giản và「Record unique key」của bảng dữ liệu.

Các trường tích hợp sẵn như `cron`、`exclude` của bảng lịch thường được dùng cho khả năng lịch, không nên đổi sang ý nghĩa nghiệp vụ khác. Nếu cần mở rộng thông tin sự kiện, có thể thêm các trường nghiệp vụ thông thường như địa điểm, người tham gia, phòng họp, trạng thái.

## Xóa bảng dữ liệu

Trong danh sách bảng dữ liệu, nhấp vào「Delete」ở bên phải bảng lịch để xóa bảng lịch.

Xóa bảng lịch sẽ xóa các bản ghi sự kiện, dữ liệu của các trường tích hợp sẵn trong lịch và siêu dữ liệu Collection liên quan. Trước khi xóa, hãy xác nhận liệu khối lịch, khối bảng, quyền hạn, quy trình làm việc và API có còn phụ thuộc vào bảng này hay không.

:::danger Cảnh báo

Bảng lịch thường lưu dữ liệu về lịch trình, đặt chỗ và lịch trực. Sau khi xóa, các sự kiện lịch sử và quy tắc lặp lại sẽ bị mất. Trước khi thao tác, hãy xác nhận dữ liệu đã được sao lưu hoặc không còn cần thiết.

:::

## Sử dụng cấu hình trang

Bảng lịch có thể sử dụng phần lớn các khối dữ liệu của [bảng thông thường](../data-source-main/general-collection.md) để thực hiện các thao tác thêm, xóa, sửa và truy vấn. Ngoài ra, bảng lịch thường được sử dụng cùng khối lịch:

| Khối | Công dụng |
| --- | --- |
| [Khối lịch](../../interface-builder/blocks/data-blocks/calendar.md) | Hiển thị các bản ghi sự kiện theo chế độ xem ngày, tuần, tháng và các chế độ khác; đồng thời tạo, xem và chỉnh sửa sự kiện trên lịch. |
| [Khối bảng](../../interface-builder/blocks/data-blocks/table.md) | Xem, lọc và bảo trì hàng loạt các bản ghi sự kiện theo dạng danh sách. |
| [Khối biểu mẫu](../../interface-builder/blocks/data-blocks/form.md) | Thêm hoặc chỉnh sửa một bản ghi sự kiện. |
| [Khối chi tiết](../../interface-builder/blocks/data-blocks/details.md) | Xem thông tin chi tiết của một sự kiện. |

## Liên kết liên quan

- [Bảng thông thường](../data-source-main/general-collection.md) — Xem cấu hình chung và cách sử dụng các khối
- [Trường ngày và giờ](../data-modeling/collection-fields/datetime/datetime.md) — Tạo trường thời gian bắt đầu và thời gian kết thúc của sự kiện
- [Khối lịch](../../interface-builder/blocks/data-blocks/calendar.md) — Hiển thị dữ liệu theo dạng lịch trên trang
- [Đa không gian](../../multi-app/multi-space/index.md) — Tìm hiểu về trường không gian và khả năng cô lập không gian
