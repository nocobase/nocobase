---
title: Cài đặt ứng dụng NocoBase
description: Cài đặt NocoBase CLI và nhanh chóng tạo một ứng dụng NocoBase mới bằng `nb init --ui`, để AI Agent có thể bắt đầu làm việc ngay.
---

# Cài đặt ứng dụng NocoBase

Nếu bạn chưa có ứng dụng NocoBase, cách nhanh nhất là cài `@nocobase/cli` trước, sau đó chạy `nb init --ui` một lần. Trong đa số trường hợp, cứ đi theo cấu hình mặc định của wizard là đủ.

## Điều kiện tiên quyết

- Node.js >= 22
- Yarn 1.x
- Nếu bạn định cài bằng Docker, hãy chắc chắn Docker đã được khởi động trước

## Bước 1: Cài CLI

Trước tiên, hãy cài NocoBase CLI ở mức toàn cục:

```bash
npm install -g @nocobase/cli
nb --version
```

Nếu bạn thường mở nhiều terminal cùng lúc hoặc muốn thao tác song song với AI Agents, bạn cũng nên chạy thêm `nb session setup` một lần. Làm vậy thì mỗi phiên sẽ giữ `current env` riêng, ít bị ảnh hưởng lẫn nhau hơn.

## Bước 2: Khởi tạo ứng dụng

Theo mặc định, cách được khuyến nghị là mở thẳng wizard trực quan:

```bash
nb init --ui
```

Trong wizard, hãy hoàn thành lần lượt các bước sau:

1. Đặt tên ứng dụng - tên này cũng sẽ là tên env trong CLI
2. Chọn "Cài đặt mới hoàn toàn"
3. Chọn phương thức cài đặt - Docker, npm hoặc Git
4. Thiết lập cổng, cơ sở dữ liệu và tài khoản quản trị
5. Chờ quá trình tải xuống, cài đặt và khởi động hoàn tất

Nếu bạn quen thao tác trong terminal hơn, bạn cũng có thể chạy trực tiếp:

```bash
nb init
```

Nếu cần khởi tạo trong script hoặc CI, hãy dùng chế độ không tương tác:

```bash
nb init --yes --env app1
```

:::tip Cài đặt trên máy chủ từ xa

Nếu bạn chạy `nb init --ui` trên server, nên đổi host mặc định sang IP hiện tại của server đó trước. Như vậy bạn mới có thể mở wizard từ trình duyệt trên máy local.

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

:::

## Bước 3: Xác nhận ứng dụng đã sẵn sàng

Sau khi cài xong, thông thường bạn nên kiểm tra trước 3 điều này:

- Env đã được lưu thành công chưa
- Ứng dụng đã khởi động bình thường chưa
- Bạn có đăng nhập được bằng tài khoản quản trị hay không

Các lệnh thường dùng là:

```bash
nb env list
nb env status
nb app logs
```

Với cài đặt local mặc định, thông thường bạn có thể mở trực tiếp `http://localhost:13000` trên trình duyệt. Sau khi đăng nhập, mở phiên AI Agent mới hoặc khởi động lại phiên hiện tại là AI có thể bắt đầu làm việc với ứng dụng NocoBase này.

Cấu hình CLI mặc định được lưu trong `~/.nocobase/`, vì vậy AI Agents thường có thể truy cập từ bất kỳ thư mục làm việc nào.

Nếu sau này ứng dụng này cần phục vụ người dùng thực tế, bạn không nên dùng trực tiếp `IP + port` trong thời gian dài. Bước tiếp theo thường là thêm reverse proxy và bật HTTPS.

## Tiếp theo

- Nếu bạn đã có một instance NocoBase đang chạy, hãy xem ngay [Hướng dẫn tích hợp AI Agent](./quick-start.mdx)
- Nếu muốn tiếp tục triển khai production, hãy xem [Cài đặt bằng CLI](../nocobase-cli/installation/cli.md) và [Tổng quan triển khai production](../nocobase-cli/production/index.md)
- Nếu muốn để AI bắt đầu xây dựng ứng dụng ngay sau đó, hãy xem [AI Builder](../ai-builder/index.md)
