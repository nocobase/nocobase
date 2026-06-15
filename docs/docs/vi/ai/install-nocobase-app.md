---
title: Cài đặt ứng dụng NocoBase
description: Cài đặt NocoBase CLI và nhanh chóng tạo một ứng dụng NocoBase mới bằng `nb init --ui`, để AI Agent có thể bắt đầu làm việc ngay.
---

# Cài đặt ứng dụng NocoBase

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

Cách được khuyến nghị là cài đặt qua UI wizard:

```bash
nb init --ui
```

1. `Getting started` - đặt identifier `--env` và chọn `Install a new app`

![2026-06-11-20-14-32](https://static-docs.nocobase.com/2026-06-11-20-14-32.png)

2. `App environment` - thiết lập thông tin cơ bản của ứng dụng, vị trí lưu trữ và cổng runtime

![2026-06-14-10-03-06](https://static-docs.nocobase.com/2026-06-14-10-03-06.png)

3. `App source and version` - chọn cách lấy ứng dụng cùng source và version sẽ dùng

![2026-06-14-09-51-33](https://static-docs.nocobase.com/2026-06-14-09-51-33.png)

4. `Configure the database` - chọn cơ sở dữ liệu tích hợp sẵn hoặc cơ sở dữ liệu tùy chỉnh

![2026-06-14-09-52-05](https://static-docs.nocobase.com/2026-06-14-09-52-05.png)

5. `Create an admin account` - thiết lập tài khoản quản trị đầu tiên

![2026-06-14-09-52-56](https://static-docs.nocobase.com/2026-06-14-09-52-56.png)

6. `Connection & authentication` - nhập URL truy cập ứng dụng và chọn phương thức xác thực

![2026-06-14-10-00-35](https://static-docs.nocobase.com/2026-06-14-10-00-35.png)

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
nb env info
nb app logs
```

Với cài đặt local mặc định, thông thường bạn có thể mở trực tiếp `http://localhost:13000` trên trình duyệt. Sau khi đăng nhập, mở phiên AI Agent mới hoặc khởi động lại phiên hiện tại là AI có thể bắt đầu làm việc với ứng dụng NocoBase này.

Cấu hình CLI mặc định được lưu trong `~/.nocobase/`, vì vậy AI Agents thường có thể truy cập từ bất kỳ thư mục làm việc nào.

Nếu sau này ứng dụng này cần phục vụ người dùng thực tế, bạn không nên dùng trực tiếp `IP + port` trong thời gian dài. Bước tiếp theo thường là thêm reverse proxy và bật HTTPS.

## Bước tiếp theo

- Nếu bạn đã có một ứng dụng NocoBase đang chạy, xem [Hướng dẫn tích hợp AI Agent](./quick-start.mdx)
- Nếu bạn muốn quản lý việc khởi động, dừng, xem log và nâng cấp ứng dụng, xem [Quản lý ứng dụng](../nocobase-cli/operations/manage-app.md)
- Nếu bạn muốn tiếp tục triển khai production, xem [Cài đặt ứng dụng bằng CLI](../nocobase-cli/installation/cli.md) và [Tổng quan triển khai production](../nocobase-cli/production/index.md)
- Nếu bạn muốn để AI bắt đầu xây dựng ứng dụng, xem [AI Builder](../ai-builder/index.md)

## Liên kết liên quan

- [So sánh phương thức cài đặt và phiên bản](../get-started/quickstart.md) — So sánh trước các phương thức cài đặt và kênh phiên bản, rồi mới quyết định cài theo cách nào
- [Hướng dẫn tích hợp AI Agent](./quick-start.mdx) — Kết nối ứng dụng NocoBase đang có và để AI Agent bắt đầu làm việc
- [Tài liệu lệnh `nb init`](../api/cli/init.md) — Khởi tạo ứng dụng mới, tiếp quản ứng dụng cục bộ sẵn có hoặc kết nối ứng dụng từ xa
- [Tài liệu lệnh `nb env info`](../api/cli/env/info.md) — Xem thông tin kết nối và cấu hình runtime của env hiện tại
- [NocoBase CLI](../api/cli/index.md) — Tài liệu đầy đủ cho toàn bộ lệnh `nb`
- [Quản lý ứng dụng](../nocobase-cli/operations/manage-app.md) — Khởi động, dừng, khởi động lại, xem log và nâng cấp ứng dụng
- [Quản lý đa môi trường](../nocobase-cli/operations/multi-environment.md) — Các thao tác thường dùng khi bạn duy trì nhiều env cùng lúc
