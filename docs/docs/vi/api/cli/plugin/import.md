---
title: "nb plugin import"
description: "Tài liệu lệnh nb plugin import: nhập gói plugin đã đóng gói hoặc gói npm vào thư mục storage/plugins của env NocoBase đã chọn, hoặc vào một đường dẫn storage tuỳ chỉnh."
keywords: "nb plugin import,NocoBase CLI,nhập plugin,storage-path,npm-registry"
---

# nb plugin import

Nhập gói plugin đã đóng gói hoặc gói npm vào `storage/plugins`. Lệnh này chỉ đặt plugin vào thư mục đích. Nó không tự động bật plugin.

## Cách dùng

```bash
nb plugin import <archive> [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `<archive>` | string | Nguồn plugin. Bắt buộc. Hỗ trợ đường dẫn `.tgz` cục bộ, URL gói nén từ xa `http(s)`, hoặc tên gói / tag npm |
| `--env`, `-e` | string | Tên env của CLI. Nếu bỏ qua, thông thường sẽ dùng env hiện tại. Nếu bạn truyền `--storage-path` một cách tường minh, bạn có thể bỏ qua `--env` |
| `--yes`, `-y` | boolean | Bỏ qua bước xác nhận tương tác khi `--env` được truyền tường minh trỏ tới một env khác với env hiện tại |
| `--storage-path` | string | Ghi đè đường dẫn gốc storage đích. Thư mục import thực tế là `<storage-path>/plugins` |
| `--npm-registry` | string | Chỉ định registry npm sẽ dùng khi nguồn là tên gói hoặc tag npm |

## Ví dụ

```bash
# Gói nén từ xa
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# Gói nén cục bộ
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# Gói npm hoặc tag
nb plugin import @my-scope/plugin-auth-cas@beta

# Registry npm riêng tư
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com

# Ghi trực tiếp vào một đường dẫn storage cục bộ mà không phụ thuộc vào env hiện tại
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

## Ghi chú

Nếu bạn đã chọn env đích, thông thường chỉ cần import trực tiếp vào `storage/plugins` của env đó.

Nếu bạn chỉ muốn ghi plugin vào một thư mục storage cục bộ, hãy truyền `--storage-path`. Trong trường hợp đó bạn có thể bỏ qua `--env`, và CLI sẽ ghi trực tiếp vào `<storage-path>/plugins`.

Sau khi import xong, bước tiếp theo thường là khởi động lại ứng dụng, rồi mới quyết định xem có cần bật plugin hay không. Trong hầu hết các trường hợp:

- Với lần cài đặt đầu tiên, hãy chạy [`nb app restart`](../app/restart.md) trước, rồi chạy [`nb plugin enable`](./enable.md)
- Nếu bạn chỉ import lại một phiên bản mới hơn, hãy khởi động lại ứng dụng trước rồi xác nhận rằng phiên bản mới đã được nạp

Nếu nguồn nằm trong một registry npm riêng tư, hãy đăng nhập trước rồi mới import:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

:::warning Lưu ý

Bạn không cần tự giải nén bất cứ thứ gì vào `storage/plugins`. `nb plugin import` sẽ tự động đặt plugin vào đúng thư mục.

:::

## Lệnh liên quan

- [`nb app restart`](../app/restart.md)
- [`nb plugin enable`](./enable.md)
- [`Cài đặt và nâng cấp plugin bên thứ ba`](../../../nocobase-cli/plugins/third-party.md)
