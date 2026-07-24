---
pkg: '@nocobase/plugin-ai'
title: 'Block AI Chat box'
description: 'Hướng dẫn dành cho quản trị viên và người xây dựng trang NocoBase về cách thêm block AI Chat box, cấu hình khả năng hội thoại, Work context, lịch sử hội thoại và Actions.'
keywords: 'AI Chat box,Nhân viên AI,block trang,Work context,Scope,Actions,NocoBase'
---

# Block AI Chat box

Trong NocoBase, **AI Chat box** là block hội thoại AI có thể được thêm trực tiếp vào trang. Bạn có thể đặt block này trên trang nghiệp vụ để cung cấp một lối vào cố định cho trợ lý AI dành riêng cho trang đó.

Mỗi block AI Chat box có hội thoại hiện tại và trạng thái nhập liệu riêng. Người xây dựng trang cũng có thể giới hạn Nhân viên AI, mô hình, tải tệp lên, tìm kiếm web và ngữ cảnh làm việc khả dụng để phù hợp với từng tình huống nghiệp vụ.

:::tip Chuẩn bị trước khi sử dụng

Trước tiên, hãy [cấu hình dịch vụ LLM](../features/llm-service.md) và [kích hoạt ít nhất một Nhân viên AI](../features/enable-ai-employee.md).

:::

## Thêm block AI Chat box

1. Mở trang cần cấu hình.
2. Nhấp `UI Editor` ở góc trên bên phải để vào chế độ chỉnh sửa trang.
3. Nhấp `Add block`.
4. Trong `Other blocks`, chọn `AI chat box`.

![Chọn AI chat box trong menu Add block](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/add-ai-chat-box-block-3.png)

## Cấu trúc block

![Block AI Chat box](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/ai-chat-box-overview-2.png)

AI Chat box gồm ba khu vực từ trên xuống dưới:

- **Khu vực thao tác phía trên** — lối vào danh sách hội thoại, Actions, thao tác tùy chỉnh và nút tạo hội thoại mới; khi khu vực tin nhắn bị ẩn, nút tin nhắn cũng được hiển thị
- **Khu vực tin nhắn** — hiển thị tin nhắn trong bản nháp hoặc hội thoại hiện tại
- **Khu vực gửi** — ô nhập, chọn ngữ cảnh, tải tệp lên, tìm kiếm web, chọn Nhân viên AI, chọn mô hình, nút gửi và tuyên bố miễn trừ trách nhiệm

### Thêm nội dung vào body của block

Trong chế độ chỉnh sửa trang, nhấp `Add block` bên trong AI Chat box để thêm một trong các block sau phía trên khu vực chat:

- JS block
- Iframe
- Markdown

Các block này phù hợp để hiển thị hướng dẫn, trang bên ngoài hoặc thông tin bổ trợ. Menu bên trong chỉ cung cấp ba loại block này và không cho phép lồng thêm một AI Chat box khác.

## Cấu hình AI Chat box

Di chuyển con trỏ lên block và mở menu cài đặt. Nhấp `Edit chat box` để cấu hình phạm vi hội thoại, tin nhắn mặc định, Work context, Nhân viên AI và mô hình.

![Hộp thoại cài đặt Edit chat box](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/edit-chat-box-settings-2.png)

### Cài đặt Edit chat box

| Cài đặt | Mô tả |
| --- | --- |
| `Scope` | Kiểm soát những AI Chat box dùng chung danh sách hội thoại. Block mới mặc định sử dụng UID của chính nó để tách biệt các hội thoại. |
| `Background` | Thêm system prompt sau định nghĩa Nhân viên AI để cung cấp vai trò, mục tiêu hoặc yêu cầu trả lời cho trang hiện tại. |
| `Default user message` | Điền sẵn tin nhắn người dùng mặc định vào khu vực gửi khi bắt đầu hội thoại mới. |
| `Work context` | Chọn các block trang được đưa vào bản nháp mới theo mặc định. |
| `AI employees` | Giới hạn các Nhân viên AI nghiệp vụ có thể được chọn trong block này. Để trống để cho phép tất cả Nhân viên AI nghiệp vụ khả dụng. |
| `Models` | Giới hạn các mô hình có thể được chọn trong block này. Để trống để cho phép tất cả mô hình khả dụng. |

### Các cài đặt block khác

| Cài đặt | Mô tả |
| --- | --- |
| `Show messages` | Kiểm soát việc khu vực tin nhắn có hiển thị trực tiếp trong block hay không. Khi tắt, sử dụng nút tin nhắn ở phía trên để mở panel bên phải. |
| `Sender placeholder` | Thay đổi văn bản placeholder trong khu vực gửi. |
| `Enable add context` | Hiển thị hoặc ẩn lối vào chọn ngữ cảnh trong khu vực gửi. |
| `Enable upload files` | Hiển thị hoặc ẩn lối vào tải tệp lên. Khi tắt, việc dán tệp cũng không bắt đầu tải lên. |
| `Enable web search` | Hiển thị hoặc ẩn công tắc tìm kiếm web. Việc tắt cũng sẽ tắt tìm kiếm web cho bản nháp hiện tại. |
| `Enable employee select` | Hiển thị hoặc ẩn bộ chọn Nhân viên AI. |
| `Enable model select` | Hiển thị hoặc ẩn bộ chọn mô hình. |
| `Show disclaimer` | Hiển thị hoặc ẩn tuyên bố AI bên dưới khu vực gửi. |

## Cấu hình Work context

Trong `Work context` của `Edit chat box`, nhấp nút thêm ngữ cảnh, chọn `Pick block`, sau đó chọn block trang muốn cung cấp cho AI. Sau khi lưu, block đã chọn trở thành ngữ cảnh làm việc mặc định cho các hội thoại mới và có thể được xóa khỏi khu vực gửi trước khi gửi tin nhắn.

## Ẩn tin nhắn và sử dụng panel bên phải

Sau khi tắt `Show messages`, body của block chỉ giữ lại khu vực gửi. Một nút tin nhắn xuất hiện ở phía trên; nhấp vào nút đó để mở panel tin nhắn từ bên phải.

![Panel tin nhắn bên phải khi khu vực tin nhắn bị ẩn](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/messages-side-panel-2.png)

Khi panel mở, phần còn lại của block được phủ bởi một lớp overlay. Nhấp vào overlay hoặc nhấp lại nút tin nhắn để đóng panel.

Bố cục này phù hợp khi AI Chat box được sử dụng như một lối nhập liệu gọn nhẹ trên trang: thông thường chỉ hiển thị khu vực gửi và mở panel khi cần xem lại tin nhắn.

## Quản lý lịch sử hội thoại

Nhấp nút danh sách hội thoại ở góc trên bên trái của block để xem lịch sử trong Scope hiện tại.

Lưu ý các quy tắc sau:

- Nhiều AI Chat box có cùng Scope có thể xem cùng một danh sách hội thoại
- Mỗi block vẫn có hội thoại hiện tại, bản nháp khu vực gửi, Nhân viên AI, mô hình, tệp đính kèm và trạng thái ngữ cảnh riêng
- Chatbox nổi toàn cục không lọc theo Scope của block, do đó không ẩn các hội thoại có Scope
- Sau khi xóa Scope, block không còn lọc danh sách theo Scope và sẽ hiển thị cả hội thoại không có Scope lẫn hội thoại sử dụng các Scope khác

Thông thường, giữ nguyên Scope được tạo cho block mới là đủ để tách lịch sử của từng trợ lý trang. Chỉ cấu hình cùng một Scope khi nhiều block cần dùng chung danh sách hội thoại.

## Thêm Actions

Trong chế độ chỉnh sửa trang, nhấp `Actions` ở phía trên block để thêm một trong các thao tác sau:

- JS Action
- AI employee

Sau khi thêm AI employee, bạn có thể cấu hình tác vụ nhanh cho nhân viên đó.

Cài đặt `Chat box uid` trong tác vụ nhanh xác định AI Chat box sẽ chạy tác vụ. AI employee được thêm trực tiếp bên trong AI Chat box mặc định trỏ đến UID của block hiện tại.

Nếu AI Chat box đã chỉ định chưa được gắn, NocoBase sẽ thông báo không tìm thấy block đích và không chuyển sang chatbox nổi toàn cục. Xem [Tác vụ nhanh của Nhân viên AI](../features/task.md) để biết cấu hình chi tiết.

## Cấu hình trợ lý riêng cho trang

Các bước sau tạo một trợ lý AI gọn nhẹ cho trang:

1. Thêm block AI Chat box và di chuyển đến vị trí phù hợp trên trang.
2. Nhập Background riêng cho trang trong `Edit chat box`.
3. Chọn một hoặc nhiều Work contexts.
4. Giới hạn nhân viên và mô hình khả dụng trong `AI employees` và `Models`.
5. Thoát chế độ chỉnh sửa, nhập câu hỏi và gửi.

## Lưu ý

- Block AI Chat box và chatbox nổi toàn cục ở góc dưới bên phải là hai lối vào riêng biệt; hội thoại hiện tại và trạng thái nhập liệu không tự động đồng bộ
- Bên trong AI Chat box, `Add block` chỉ cho phép thêm JS block, Iframe và Markdown
- Thay đổi Scope ảnh hưởng đến phạm vi truy vấn danh sách hội thoại và không sao chép hội thoại hoặc bản nháp đang mở trong block khác
