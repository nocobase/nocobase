---
title: Nâng cấp ứng dụng NocoBase
description: Nâng cấp ứng dụng NocoBase đã lưu dưới dạng CLI env bằng nb app upgrade, bao gồm xác nhận env, lệnh nâng cấp, phiên bản đích và kiểm tra sau nâng cấp.
---

# Nâng cấp ứng dụng NocoBase

## Bước 1: xác nhận env hiện tại

Trước tiên xác nhận CLI env đang có hiệu lực:

```bash
nb env current
```

Nếu chưa chắc có những env nào, xem danh sách trước:

```bash
nb env list
```

Nếu env hiện tại không phải ứng dụng cần nâng cấp, chuyển sang env mục tiêu:

```bash
nb env use <env-name>
```

## Bước 2: chạy nâng cấp

:::warning Ghi chú

Mặc định, quá trình nâng cấp sẽ tải lại source code ứng dụng hoặc Docker image.

Với env npm / Git, thư mục `source/` sẽ bị xóa rồi tải lại. Không đặt các tệp cần giữ lại trong `source/`.

Nếu bạn đã chuẩn bị source code hoặc Docker image thủ công và không muốn CLI tải lại, hãy thêm `--skip-download` vào lệnh.

:::

Lệnh nâng cấp mặc định là:

```bash
nb app upgrade
```

Lệnh này thường thực hiện các bước sau:

1. Dừng ứng dụng hiện tại
2. Tải và thay thế source hoặc image đã lưu
3. Đồng bộ plugin thương mại
4. Nâng cấp và khởi động ứng dụng
5. Làm mới thông tin runtime của env

Trong script, CI hoặc phiên AI Agent, hãy truyền rõ `--force`:

```bash
nb app upgrade --force
```

Nếu ứng dụng cần nâng cấp không phải env hiện tại, chỉ định env:

```bash
nb app upgrade --env app1 --yes --force
```

### Nâng cấp tới phiên bản cụ thể

Dùng `--version` để nâng cấp tới một kênh phiên bản cụ thể:

```bash
nb app upgrade --version beta
```

Bạn cũng có thể chỉ định số phiên bản chính xác:

```bash
nb app upgrade --version 2.1.0-beta.24
```

Sau khi nâng cấp thành công, CLI ghi phiên bản đích trở lại cấu hình env, để các lần nâng cấp hoặc khôi phục sau có thể tiếp tục dùng thông tin này.

### Bỏ qua tải xuống

Nếu bạn đã cập nhật source code hoặc Docker image và chỉ muốn chạy nâng cấp, khởi động dựa trên nội dung hiện tại, thêm `--skip-download`:

```bash
nb app upgrade --skip-download
```

Tham số này bỏ qua việc tải source hoặc image, đồng thời bỏ qua đồng bộ plugin thương mại. Thông thường chỉ dùng khi phiên bản đích đã được chuẩn bị thủ công.

## Bước 3: kiểm tra kết quả

Sau khi nâng cấp, trước tiên kiểm tra runtime env và log ứng dụng:

```bash
nb env info
nb app logs
```

Sau đó mở ứng dụng và xác nhận tài khoản quản trị có thể đăng nhập. Nếu bạn muốn AI Agent tiếp tục thao tác ứng dụng này, hãy mở phiên AI Agent mới hoặc khởi động lại phiên hiện tại để nó đọc thông tin env mới nhất.

## Liên kết liên quan

- [Quản lý ứng dụng](../nocobase-cli/operations/manage-app.md) — Khởi động, dừng, restart, xem log và nâng cấp ứng dụng
- [Tham chiếu lệnh `nb app upgrade`](../api/cli/app/upgrade.md) — Xem toàn bộ tham số của lệnh nâng cấp
- [Quản lý nhiều môi trường](../nocobase-cli/operations/multi-environment.md) — Xác nhận, chuyển đổi và duy trì nhiều CLI env
