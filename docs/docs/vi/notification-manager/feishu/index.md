---
pkg: '@nocobase/plugin-feishu'
---

# Thông báo: Feishu / Lark

## Giới thiệu

Plugin **Feishu / Lark** cho phép ứng dụng gửi thông báo tới người dùng Feishu.

## Thêm và cấu hình authenticator Feishu

Trước tiên thêm và cấu hình authenticator Feishu trên NocoBase, xem [Xác thực: Feishu / Lark](/auth-verification/auth-feishu/). Chỉ người dùng hệ thống đã đăng nhập qua Feishu mới nhận được thông báo hệ thống qua Feishu.

Tin nhắn được gửi qua ứng dụng Feishu của authenticator đã chọn, kèm điều kiện:

1. Đã thêm năng lực **Bot** trong **Chức năng ứng dụng** trên nền tảng mở — thiếu nó việc gửi sẽ thất bại;
2. Đã bật quyền **Gửi tin nhắn với tư cách bot** (`im:message:send_as_bot`) trong **Quản lý quyền** và phát hành phiên bản mới;
3. Người nhận nằm trong **phạm vi quyền danh bạ** (phạm vi khả dụng) của ứng dụng.

Sau khi thay đổi năng lực hoặc quyền, phát hành phiên bản mới rồi thử lại.

## Thêm kênh thông báo Feishu

Vào **Quản lý thông báo** → kênh, thêm kênh **Feishu / Lark** và chọn authenticator đã cấu hình.

Tùy chọn cấu hình **Kiểu ID người nhận** (`open_id`, `user_id`, `union_id` hoặc `email`); mặc định theo trường định danh của authenticator.

## Kiểu tin nhắn

| Kiểu | Mô tả |
| --- | --- |
| Tin nhắn văn bản | Văn bản thuần. |
| Tin nhắn Post | Văn bản định dạng theo chuẩn Post của Feishu. |
| Thẻ tương tác | Thẻ Feishu cấu hình bằng JSON. |

Người nhận được phân giải theo định danh Feishu gắn với authenticator (theo kiểu ID người nhận); người chưa gắn sẽ fallback về email hoặc tên người dùng.

## Node thông báo trong workflow

Chọn kênh Feishu đã cấu hình trong node thông báo của workflow để gửi tin nhắn Feishu tới người dùng trong ngữ cảnh workflow.

## Xử lý sự cố

- Gửi thất bại với lỗi quyền (ví dụ mã `230002`): kiểm tra đã thêm **Bot**, bật quyền **Gửi tin nhắn với tư cách bot** và phát hành phiên bản mới nhất.
- Gửi thất bại do người nhận không hợp lệ (lỗi `receive_id`): người nhận ngoài phạm vi quyền danh bạ, hoặc kiểu ID người nhận không khớp cấu hình kênh.
- Tác vụ chỉ hiển thị lỗi chung: tra mục `FeishuNotificationChannel.send failed` trong log máy chủ; phiên bản plugin mới ghi kèm mã và thông báo lỗi từ Feishu.
