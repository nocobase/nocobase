---
pkg: '@nocobase/plugin-file-manager'
title: "URL ổn định (URL proxy)"
description: "Giải thích định dạng, quyền truy cập, chuyển hướng và hành vi của URL file ổn định trong NocoBase."
keywords: "URL ổn định,URL proxy,URL vĩnh viễn,truy cập file,xem trước Office,NocoBase"
---

# URL ổn định (URL proxy)

File do storage engine của NocoBase quản lý được truy cập qua **URL ổn định**. NocoBase kiểm tra bản ghi file và quyền truy cập, sau đó chuyển hướng đến URL thực tế do storage engine tạo ra.

Tên gọi cũ “URL vĩnh viễn” chỉ có nghĩa là URL được lưu không thay đổi theo chữ ký tạm thời của dịch vụ lưu trữ. Nó không làm cho file trở thành công khai hoặc tồn tại mãi mãi.

## Định dạng

```text
/files/<app>/<dataSource>/<collection>/<id><extname>
```

Khi cấu hình `APP_PUBLIC_PATH=/nocobase`, đường dẫn bắt đầu bằng `/nocobase/files/`. ID và phần mở rộng không thể thay đổi sau khi tạo, vì vậy URL giữ ổn định trong vòng đời của bản ghi.

| Mục đích | URL | Hành vi |
|---|---|---|
| Mở file | `/files/.../42.pdf` | Kiểm tra quyền rồi chuyển hướng đến file |
| Xem trước | `/files/.../42.png?preview=1` | Chuyển hướng đến ảnh thu nhỏ hoặc URL xem trước |
| Tải xuống | `/files/.../42.pdf?download=1` | Chuyển hướng với chế độ tải xuống |
| Office | `/files/.../42.xlsx?temporaryAccessToken=...` | Cấp quyền tạm thời cho Office Online Viewer |

## Biểu hiện trong NocoBase

- Field đính kèm, file collection và [HTTP API](./http-api.md) trả về URL ổn định trong `url` và `preview`
- Markdown lưu URL ổn định và hỗ trợ S3, OSS, COS hoặc S3 Pro riêng tư
- Field URL đính kèm giữ nguyên URL ngoài được nhập thủ công và dùng URL ổn định cho file do NocoBase quản lý
- Chế độ xem trước thông thường dùng phiên đăng nhập và quyền file hiện tại của NocoBase
- Form công khai chỉ cấp quyền giới hạn cho file được tải lên trong phiên form hiện tại

## Xem trước Office

Microsoft Office Online Viewer không thể dùng cookie NocoBase của người dùng. Khi mở xem trước, NocoBase kiểm tra quyền trước rồi cấp một URL tạm thời gắn với file. Thời hạn mặc định là 10 phút và có thể cấu hình từ 5 đến 10 phút bằng `TEMPORARY_FILE_ACCESS_EXPIRES_IN`.

Không lưu URL tạm thời vào field, Markdown hoặc dữ liệu nghiệp vụ, và không dùng nó làm liên kết chia sẻ.

## Lưu ý

- Ổn định không có nghĩa là công khai; người nhận vẫn cần quyền truy cập
- Xóa hoặc chuyển bản ghi sang ngữ cảnh khác sẽ làm URL cũ mất hiệu lực
- Phản hồi là chuyển hướng `302`; client phải theo chuyển hướng
- Không lưu `302 Location` hoặc `temporaryAccessToken`
- Reverse proxy phải chuyển tiếp `/files/` dưới `APP_PUBLIC_PATH` đến NocoBase

## Liên kết liên quan

- [HTTP API](./http-api.md) — Tải lên và truy vấn file
- [Xem trước file](./file-preview/index.md) — Các định dạng được hỗ trợ
- [Xem trước Office](./file-preview/ms-office.md) — Cấu hình Office Viewer
- [Storage engine](./storage/index.md) — Cấu hình lưu trữ file
