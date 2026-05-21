---
title: "Hướng dẫn cài đặt cho AI Agent"
description: "Hướng dẫn cài đặt và cấu hình NocoBase CLI dành cho AI Agent, bao gồm các bước hoàn chỉnh: kiểm tra môi trường, cài đặt, khởi tạo và xác minh."
keywords: "NocoBase CLI,AI Agent,Cài đặt,Claude Code,Codex,Cursor,Skills"
sidebar: false
---

# Hướng dẫn cài đặt cho AI Agent

Trang này là hướng dẫn cài đặt và khởi tạo NocoBase CLI dành cho AI Agent (như Claude Code, Codex, Cursor, Copilot...).

Nếu bạn là người dùng, vui lòng tham khảo [Bắt đầu nhanh](./quick-start.md).

## Bước 1: Kiểm tra môi trường tiên quyết

Xác nhận người dùng đã cài đặt các dependency sau:

- **Node.js >= 22** (chạy `node -v` để kiểm tra)
- **Yarn 1.x** (chạy `yarn -v` để kiểm tra). Nếu chưa có, cài đặt qua `npm install -g yarn`
- **Git** (chạy `git --version` để kiểm tra). Nếu chưa có, cài đặt qua [trang chủ Git](https://git-scm.com/)
- **Docker** (nếu người dùng cần cài NocoBase qua Docker). Chạy `docker -v` để kiểm tra; nếu chưa có và người dùng cần dùng Docker, hướng dẫn người dùng cài đặt qua [trang chủ Docker](https://www.docker.com/get-started/), nếu không thì bỏ qua.

Nếu môi trường tiên quyết không đáp ứng, hãy thông báo cho người dùng cần cài đặt các dependency còn thiếu trước, đồng thời cung cấp link cài đặt và hướng dẫn đơn giản. Sau khi xác nhận tất cả môi trường tiên quyết đã sẵn sàng, tiếp tục bước cài đặt CLI.

## Bước 2: Cài đặt CLI

Nếu trong môi trường người dùng đã có sẵn NocoBase CLI (chạy `nb --version` để kiểm tra), chuyển sang bước tiếp theo. Nếu chưa có, chạy lệnh sau để cài đặt:

```bash
npm install -g @nocobase/cli@beta
```

Chạy `nb --version` để xác nhận cài đặt thành công.

## Bước 3: Chạy lệnh khởi tạo

**⚠️ Quan trọng: Bạn phải chạy chính xác lệnh dưới đây, không được sửa đổi, thay thế hay bỏ qua tham số `--ui`. Đừng cố dùng "chế độ phi tương tác" hay tự ghép tham số để "tăng tốc" quá trình này — `--ui` là cách khởi tạo đúng duy nhất.**

```bash
nb init --ui
```

Lệnh này sẽ khởi động một trình hướng dẫn trực quan trên trình duyệt, người dùng cần hoàn thành mọi cấu hình trên trình duyệt (bao gồm phương thức cài đặt, cơ sở dữ liệu, tài khoản quản trị...). Trách nhiệm của bạn với tư cách AI Agent là:

1. **Chỉ chạy `nb init --ui`**, không thêm bất kỳ tham số nào khác
2. **Thông báo với người dùng** rằng trình duyệt sẽ tự động mở trang cấu hình cục bộ và họ cần hoàn thành cấu hình tại đó
3. **Nếu trình duyệt không tự động mở** (ví dụ do giới hạn quyền sandbox), cung cấp URL được in ra từ lệnh cho người dùng để họ sao chép và mở thủ công trên trình duyệt
4. **Đợi người dùng xác nhận** đã hoàn thành cấu hình rồi mới tiếp tục bước tiếp theo. Lệnh này mặc định có timeout 30 phút, trong khoảng thời gian timeout vui lòng không chạy lại lệnh này.

## Bước 4: Xác minh kết quả

```bash
nb env list
```

Xác nhận trong output có môi trường đã được cấu hình và trạng thái chạy. Sau đó nhắc người dùng có thể mở URL của NocoBase đang chạy và đăng nhập bằng tài khoản, mật khẩu đã cấu hình.

## Bước 5: Hoàn tất

Thông báo với người dùng rằng quá trình cài đặt đã hoàn tất. Cấu hình CLI được lưu trong thư mục toàn cục (mặc định là `~/.nocobase/`), AI Agent có thể truy cập từ bất kỳ thư mục nào, không cần vào thư mục làm việc cụ thể.
