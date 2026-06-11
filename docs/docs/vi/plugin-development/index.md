---
title: "Tổng quan phát triển Plugin NocoBase"
description: "Kiến trúc microkernel của NocoBase, vòng đời Plugin, cấu trúc thư mục, plug-and-play, tích hợp front-end và back-end, mã nguồn client/server, metadata package.json."
keywords: "phát triển plugin,Plugin NocoBase,microkernel,vòng đời plugin,front-end và back-end,mở rộng NocoBase"
---

# Tổng quan phát triển Plugin

NocoBase sử dụng **kiến trúc microkernel** — phần lõi chỉ chịu trách nhiệm điều phối vòng đời Plugin, quản lý dependency và đóng gói các năng lực cơ bản, trong khi tất cả chức năng nghiệp vụ đều được cung cấp dưới dạng Plugin. Hiểu cấu trúc tổ chức, vòng đời và cách quản lý Plugin là bước đầu tiên để bạn bắt đầu phát triển tùy chỉnh trên NocoBase.

## Triết lý cốt lõi

- **Plug-and-play**: Bạn có thể cài đặt, kích hoạt hoặc vô hiệu hóa Plugin theo nhu cầu, kết hợp linh hoạt các chức năng nghiệp vụ mà không cần sửa code.
- **Tích hợp front-end và back-end**: Plugin thường bao gồm cả implementation phía server và client, đặt logic dữ liệu và tương tác giao diện chung một chỗ để quản lý.

## Cấu trúc cơ bản của Plugin

Mỗi Plugin là một npm package độc lập, thường có cấu trúc thư mục như sau:

```bash
plugin-hello/
├─ package.json          # Tên Plugin, dependency và metadata Plugin NocoBase
├─ client-v2.js          # Sản phẩm biên dịch front-end, dùng để load lúc runtime
├─ server.js             # Sản phẩm biên dịch server, dùng để load lúc runtime
├─ src/
│  ├─ client-v2/         # Mã nguồn client, có thể đăng ký Block, Action, Field, v.v.
│  └─ server/            # Mã nguồn server, có thể đăng ký resource, event, command line, v.v.
```

## Quy ước thư mục và thứ tự load

Khi khởi động, NocoBase sẽ quét các thư mục sau để load Plugin:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Plugin đang phát triển từ source (ưu tiên cao nhất)
└── storage/
    └── plugins/          # Plugin đã biên dịch, ví dụ Plugin được upload hoặc phát hành
```

- `packages/plugins`: Thư mục Plugin phát triển local, hỗ trợ biên dịch và debug realtime.
- `storage/plugins`: Lưu Plugin đã biên dịch, ví dụ Plugin thương mại hoặc Plugin của bên thứ ba.

## Vòng đời và trạng thái Plugin

Một Plugin thường trải qua các giai đoạn sau:

1. **Tạo (create)**: Tạo template Plugin qua CLI.
2. **Pull (pull)**: Tải Plugin package về local, nhưng chưa ghi vào database.
3. **Kích hoạt (enable)**: Lần kích hoạt đầu tiên sẽ thực hiện "đăng ký + khởi tạo"; những lần kích hoạt sau chỉ load logic.
4. **Vô hiệu hóa (disable)**: Dừng Plugin chạy.
5. **Gỡ cài đặt (remove)**: Xóa hoàn toàn Plugin khỏi NocoBase.

:::tip Mẹo

- `pull` chỉ chịu trách nhiệm tải Plugin package về, quá trình cài đặt thực sự được kích hoạt bởi lần `enable` đầu tiên.
- Nếu Plugin chỉ được `pull` mà không kích hoạt thì sẽ không được load.

:::

### Ví dụ lệnh CLI

```bash
# 1. Tạo bộ khung Plugin
yarn pm create @my-project/plugin-hello

# 2. Pull Plugin package (download hoặc link)
yarn pm pull @my-project/plugin-hello

# 3. Kích hoạt Plugin (lần đầu kích hoạt sẽ tự động cài đặt)
yarn pm enable @my-project/plugin-hello

# 4. Vô hiệu hóa Plugin
yarn pm disable @my-project/plugin-hello

# 5. Gỡ cài đặt Plugin
yarn pm remove @my-project/plugin-hello
```

## Giao diện quản lý Plugin

Truy cập "Plugin Manager" trên trình duyệt, bạn có thể xem và quản lý Plugin trực quan:

**Địa chỉ mặc định:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Plugin Manager](https://static-docs.nocobase.com/20251030195350.png)

## Liên kết liên quan

- [Viết Plugin đầu tiên](./write-your-first-plugin.md) — Tạo một Plugin Block từ đầu, làm quen nhanh với quy trình phát triển
- [Cấu trúc thư mục dự án](./project-structure.md) — Tìm hiểu quy ước thư mục và thứ tự load Plugin của dự án NocoBase
- [Tổng quan phát triển server](./server/index.md) — Giới thiệu tổng thể và các khái niệm cốt lõi của Plugin server
- [Tổng quan phát triển client](./client/index.md) — Giới thiệu tổng thể và các khái niệm cốt lõi của Plugin client
- [Build và đóng gói](./build.md) — Quy trình build và đóng gói Plugin
- [Quản lý dependency](./dependency-management.md) — Cách khai báo và quản lý dependency của Plugin
