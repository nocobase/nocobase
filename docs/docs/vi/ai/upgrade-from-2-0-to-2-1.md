---
title: Hướng dẫn nâng cấp NocoBase 2.0 lên 2.1
description: Nâng cấp ứng dụng NocoBase 2.0 lên 2.1, bao gồm cách cài đặt cũ, tùy chọn nb CLI và lộ trình di chuyển được khuyến nghị.
---

# Cách nâng cấp NocoBase từ 2.0 lên 2.1

Việc nâng cấp từ NocoBase 2.0 lên NocoBase 2.1 diễn ra mượt mà với chính ứng dụng. Thay đổi lớn hơn nằm ở NocoBase CLI.

Cụ thể:

- Ở 2.0 và các phiên bản cũ hơn, lệnh CLI thường bắt đầu bằng `yarn nocobase`
- Ở 2.1 và các phiên bản mới hơn, CLI dùng `nb` được cài đặt toàn cục

Ứng dụng cũ không bắt buộc phải chuyển sang `nb` ngay. Nếu bạn chỉ cần nâng cấp một ứng dụng NocoBase 2.0 đang chạy ổn định lên 2.1, mặc định hãy tiếp tục dùng cách cài đặt và nâng cấp ban đầu. Với ứng dụng cài mới, chúng tôi khuyến nghị dùng CLI `nb` mới.

## Tiếp tục dùng cách cài đặt và nâng cấp ban đầu

Nếu bạn đã quen với cách cài đặt trước đây, bạn có thể tiếp tục sử dụng. Việc cài đặt và nâng cấp vẫn thực hiện theo tài liệu cũ.

### Cài đặt NocoBase

- [Cài đặt bằng Docker](/get-started/installation/docker)
- [Cài đặt bằng create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Cài đặt từ mã nguồn Git](/get-started/installation/git)

### Nâng cấp NocoBase

- [Nâng cấp bản cài đặt Docker](/get-started/upgrading/docker)
- [Nâng cấp bản cài đặt create-nocobase-app](/get-started/upgrading/create-nocobase-app)
- [Nâng cấp bản cài đặt từ mã nguồn Git](/get-started/upgrading/git)

## Dùng `nb` CLI cho ứng dụng mới

Với ứng dụng mới, chúng tôi khuyến nghị cách cài đặt và nâng cấp thuận tiện hơn bằng `nb`.

### Cài đặt NocoBase

- [Cài đặt ứng dụng NocoBase](./install-nocobase-app.md)

### Nâng cấp NocoBase

- [Nâng cấp ứng dụng NocoBase](./upgrade-nocobase-app.md)

## Cách di chuyển sang `nb` CLI

Nếu bạn muốn quản lý ứng dụng thống nhất bằng `nb` về sau, cách ổn định hơn hiện tại là tạo một ứng dụng mới rồi di chuyển dữ liệu của ứng dụng cũ sang đó.

Các bước di chuyển:

1. Trước tiên tạo một ứng dụng CLI mới bằng `nb init`
2. Di chuyển cơ sở dữ liệu, `storage` và các biến môi trường cần thiết của ứng dụng cũ
3. Sau khi xác nhận ứng dụng mới hoạt động bình thường, chuyển môi trường production sang ứng dụng mới

Bạn cũng có thể chờ thêm một thời gian. Khả năng để `nb` tiếp quản các ứng dụng cục bộ hiện có vẫn đang được phát triển.

![2026-06-13-21-29-24](https://static-docs.nocobase.com/2026-06-13-21-29-24.png)
