---
title: Thiết lập phát triển cục bộ
description: Chuẩn bị môi trường hệ điều hành cục bộ cho NocoBase CLI và ứng dụng NocoBase, bao gồm Windows WSL, macOS, Linux, Node.js, Yarn và Docker.
---

# Thiết lập phát triển cục bộ

Trang này giúp bạn chuẩn bị môi trường cục bộ cho NocoBase CLI và ứng dụng NocoBase. Nội dung phù hợp cho phát triển cục bộ, trải nghiệm tính năng và để AI Agent cài đặt hoặc quản lý NocoBase trên máy tính của bạn.

Nếu bạn triển khai cho người dùng thực tế, hãy xem trước [yêu cầu hệ thống cho môi trường production](../get-started/system-requirements.md).

## Windows: dùng WSL

Khi thiết lập cục bộ trên Windows, chúng tôi khuyến nghị đặt môi trường phát triển chính trong WSL 2: cài Node.js, Yarn và NocoBase CLI trong bản phân phối Linux của WSL, rồi chạy các lệnh liên quan từ terminal WSL.

WSL gần với các môi trường Linux mà NocoBase thường được triển khai. Cách này có một số lợi ích:

- Cài đặt dependency, build, khởi động và kiểm tra log gần với quy trình thực tế trên server hơn
- Sau khi bật Docker Desktop WSL integration, bạn có thể chạy lệnh `docker` trực tiếp trong WSL
- Giảm các vấn đề phát sinh từ định dạng đường dẫn Windows native, quyền tệp, symlink và build dependency native
- Phù hợp hơn với quy trình AI Agent. Khi agent chạy `nb`, `yarn` hoặc `docker`, nó dùng cùng một hệ đường dẫn Linux, cú pháp shell và môi trường runtime, nên việc xử lý sự cố trực tiếp hơn

Nếu môi trường phát triển cục bộ dựa trên WSL chưa sẵn sàng, xem [Thiết lập môi trường phát triển cục bộ trên Windows với WSL](./windows-wsl.md).

Cấu hình khuyến nghị:

- Windows 10 / 11
- WSL 2
- Ubuntu LTS
- Node.js >= 22
- Yarn 1.x
- Docker Desktop, nếu bạn định cài NocoBase bằng Docker

Thông thường, Node.js, Yarn và NocoBase CLI đều được cài trong WSL. Nếu dùng Docker Desktop, hãy bật WSL integration trong Docker Desktop để WSL có thể truy cập Docker.

Kiểm tra môi trường:

```bash
node -v
yarn -v
docker version
```

:::tip Ghi chú

NocoBase cũng có thể được cài trên Windows Server. WSL được khuyến nghị ở đây cho phát triển cục bộ và thiết lập AI Agent trên máy tính cá nhân. Điều này không có nghĩa là Windows Server không thể dùng để triển khai.

:::

## macOS

Trên macOS, bạn có thể dùng trực tiếp terminal của máy.

Cần chuẩn bị:

- Node.js >= 22
- Yarn 1.x
- Docker Desktop, OrbStack hoặc Colima, nếu bạn định cài NocoBase bằng Docker

Kiểm tra môi trường:

```bash
node -v
yarn -v
docker version
```

Nếu không dùng Docker, bạn có thể bỏ qua `docker version`.

## Linux

Linux có thể dùng trực tiếp làm môi trường phát triển cục bộ. Khuyến nghị dùng Ubuntu, Debian hoặc các bản phân phối phổ biến khác.

Cần chuẩn bị:

- Node.js >= 22
- Yarn 1.x
- Docker Engine, nếu bạn định cài NocoBase bằng Docker

Kiểm tra môi trường:

```bash
node -v
yarn -v
docker version
```

Nếu không dùng Docker, bạn có thể bỏ qua `docker version`.

## Bước tiếp theo

- [So sánh phương thức cài đặt và phiên bản](../get-started/quickstart.md) — So sánh trước các phương thức cài đặt và kênh phiên bản
- [Cài đặt ứng dụng NocoBase](./install-nocobase-app.md) — Khởi tạo một app cục bộ bằng NocoBase CLI
- [Hướng dẫn tích hợp AI Agent](./quick-start.mdx) — Cho phép AI Agent kết nối và thao tác với NocoBase
