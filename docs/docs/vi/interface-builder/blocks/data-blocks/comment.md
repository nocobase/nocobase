---
pkg: "@nocobase/plugin-block-comment"
title: "Block Bình luận"
description: "Block Bình luận: dùng để xem và tạo bình luận trong chi tiết bản ghi, pop-up và các tình huống tương tự, hỗ trợ ánh xạ field, phân trang, phạm vi dữ liệu, quy tắc sắp xếp mặc định và tự động chuyển đến trang cuối."
keywords: "Block Bình luận,CommentBlock,bảng bình luận,ánh xạ field,phạm vi dữ liệu,sắp xếp mặc định,xây dựng giao diện,NocoBase"
---

# Block Bình luận

## Giới thiệu

Block Bình luận thêm khả năng bình luận cho bản ghi nghiệp vụ. Bạn có thể thêm block này vào trang chi tiết hoặc pop-up của công việc, bài viết, ticket, khách hàng và các bản ghi khác, để người dùng có thể xem, trả lời và tạo bình luận cho bản ghi hiện tại.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_02_PM.png)

:::tip Gợi ý

Block Bình luận không tự tạo collection. Trước khi sử dụng, hãy chuẩn bị một collection để lưu bình luận và cấu hình các field như nội dung bình luận, người bình luận, chủ sở hữu bình luận và thời gian bình luận.

:::

## Thêm block

Block Bình luận thường được thêm vào trang chi tiết hoặc pop-up của một bản ghi nghiệp vụ.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_03_PM.png)

1. Mở trang chi tiết hoặc pop-up của bản ghi mục tiêu
2. Nhấp vào "Thêm block"
3. Chọn "Bình luận"
4. Chọn collection dùng để lưu bình luận
5. Hoàn tất ánh xạ field theo hướng dẫn

Nếu Block Bình luận được tạo từ quan hệ, NocoBase sẽ cố gắng tự động xác định field chủ sở hữu bình luận và giá trị bản ghi hiện tại dựa trên quan hệ hiện tại. Trong trường hợp này, "Field chủ sở hữu bình luận" và "Giá trị field chủ sở hữu bình luận" sẽ được tự động điền, thường không cần cấu hình thủ công.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_04_PM.png)

Nếu block được tạo trực tiếp từ collection bình luận, bạn cần cấu hình thủ công field chủ sở hữu bình luận và giá trị tương ứng.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_03_PM%20(1).png)

## Ánh xạ field

Block Bình luận dùng "Ánh xạ field" để biết mỗi bình luận nên được hiển thị và lưu như thế nào.

| Cấu hình | Mô tả |
| --- | --- |
| Field nội dung bình luận | Chọn field dùng để lưu nội dung bình luận. |
| Field người bình luận | Chọn field nhiều-một liên kết với collection người dùng. |
| Field chủ sở hữu bình luận | Chọn field dùng để lưu định danh của bản ghi nghiệp vụ hiện tại. |
| Giá trị field chủ sở hữu bình luận | Chỉ định giá trị của bản ghi nghiệp vụ hiện tại, ví dụ `{{ ctx.popup.record.id }}`. |
| Field ngày bình luận | Chọn field thời gian bình luận, dùng để hiển thị và sắp xếp mặc định. |

### Field chủ sở hữu bình luận

"Field chủ sở hữu bình luận" dùng để lọc bình luận của bản ghi hiện tại và cũng được ghi khi tạo bình luận mới.

Khi chọn thủ công, danh sách thả xuống chỉ hiển thị field scalar thông thường, không hiển thị field quan hệ. Các cấu hình phổ biến:

| Collection nghiệp vụ | Field chủ sở hữu trong collection bình luận | Giá trị field chủ sở hữu bình luận |
| --- | --- | --- |
| Công việc | `taskId` | `{{ ctx.popup.record.id }}` |
| Bài viết | `postId` | `{{ ctx.popup.record.id }}` |
| Ticket | `ticketId` | `{{ ctx.popup.record.id }}` |

Nếu bản ghi hiện tại dùng định danh duy nhất không phải `id`, hãy đổi "Giá trị field chủ sở hữu bình luận" sang field tương ứng, ví dụ `{{ ctx.popup.record.uuid }}`.

### Tự động ánh xạ từ quan hệ

Nếu block được tạo từ quan hệ của bản ghi nghiệp vụ, Block Bình luận sẽ ưu tiên dùng field khóa ngoại của quan hệ đó làm field chủ sở hữu bình luận, và dùng giá trị bản ghi hiện tại làm giá trị field chủ sở hữu bình luận.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_04_PM.png)

Ví dụ, nếu giữa collection công việc và collection bình luận công việc có quan hệ một-nhiều, và field khóa ngoại trong collection bình luận công việc là `taskId`, khi thêm Block Bình luận từ quan hệ trong trang chi tiết công việc, block sẽ tự động dùng:

- Field chủ sở hữu bình luận: `taskId`
- Giá trị field chủ sở hữu bình luận: định danh của bản ghi công việc hiện tại

Cách này phù hợp với hầu hết tình huống và giảm lỗi cấu hình thủ công.

## Cấu hình block

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_07_PM.png)

### Kích thước trang

Thiết lập số lượng bình luận hiển thị trên mỗi trang. Các giá trị có thể chọn gồm `5`, `10`, `20`, `50`, `100` và `200`.

### Phạm vi dữ liệu

Thiết lập phạm vi lọc dữ liệu cho danh sách bình luận. Bạn có thể thêm điều kiện tại đây, ví dụ chỉ hiển thị bình luận thỏa mãn một số trạng thái hoặc điều kiện quyền.

Tham khảo thêm [Cấu hình phạm vi dữ liệu](../block-settings/data-scope.md).

### Quy tắc sắp xếp mặc định

Thiết lập quy tắc sắp xếp mặc định cho danh sách bình luận. Thông thường có thể sắp xếp theo field ngày bình luận theo thứ tự tăng dần hoặc giảm dần.

Nếu không cấu hình riêng quy tắc sắp xếp mặc định, Block Bình luận sẽ ưu tiên dùng "Field ngày bình luận" làm field sắp xếp mặc định.

Tham khảo thêm [Cấu hình quy tắc sắp xếp](../block-settings/sorting-rule.md).

### Tự động chuyển đến trang cuối

Mặc định tắt. Khi tắt, Block Bình luận sẽ ở trang đầu tiên sau khi mở.

Khi bật, Block Bình luận sẽ chuyển đến trang cuối trong lần tải đầu tiên. Tùy chọn này phù hợp khi bạn muốn người dùng xem các bình luận mới nhất trước.
