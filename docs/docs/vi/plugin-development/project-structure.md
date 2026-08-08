---
title: "Cấu trúc thư mục dự án Plugin"
description: "Cấu trúc dự án Plugin NocoBase: nb init, plugins, thư mục Plugin, source, thư mục runtime storage."
keywords: "cấu trúc dự án,nb init,plugins,thư mục plugin,NocoBase"
---

# Cấu trúc thư mục dự án

Ứng dụng được khởi tạo qua NocoBase CLI (`nb init`) sẽ tạo ra một thư mục ứng dụng tiêu chuẩn. CLI hỗ trợ hai nguồn npm (`create-nocobase-app`) và Git, cấu trúc cấp cao của ứng dụng là nhất quán.

## Tổng quan thư mục cấp cao

```bash
<app-path>/
├── .nb/                   # Metadata mà CLI lưu cho env hiện tại
├── source/                # Source code ứng dụng (NocoBase core + Plugin tích hợp)
├── storage/               # Thư mục dữ liệu runtime
│   ├── plugins/           # Plugin đã biên dịch (upload hoặc import)
│   └── tar/               # File đóng gói Plugin (.tgz)
├── plugins/               # Source code Plugin của bạn (nb scaffold plugin tạo ở đây)
├── .env                   # File biến môi trường ứng dụng
```

## Thư mục phát triển Plugin plugins/

`plugins/` là vị trí chính để bạn phát triển Plugin tùy chỉnh. Plugin được tạo qua `nb scaffold plugin` sẽ nằm ở đây.

`nb` sẽ tự động đồng bộ Plugin trong `plugins/` dưới dạng symbolic link vào `source/packages/plugins/`, để phục vụ quy trình phát triển và build. Bạn không cần thao tác thủ công trên nội dung thư mục `source/`.

## Thư mục source code source/

Thư mục `source/` chứa toàn bộ source code ứng dụng NocoBase, nội dung cụ thể tùy thuộc vào nguồn dự án:

- **Nguồn npm** (`create-nocobase-app`): Mặc định chỉ có `packages/plugins/` và các thư mục cơ bản.
- **Nguồn Git** (khuyến nghị): Chứa toàn bộ source code core framework (`packages/core/`), Plugin tích hợp sẵn, v.v., khi phát triển với AI có thể tham khảo trực tiếp.

## Thư mục runtime storage/

`storage/` lưu dữ liệu được tạo lúc runtime và sản phẩm build:

- `plugins/`: Plugin đóng gói được upload qua giao diện hoặc import qua CLI.
- `tar/`: File nén Plugin được tạo sau khi chạy `nb source build <plugin> --tar`.

## Đường dẫn load Plugin và độ ưu tiên

Plugin có thể tồn tại ở nhiều vị trí, NocoBase load theo độ ưu tiên sau khi khởi động:

1. Phiên bản source code trong `source/packages/plugins` (dùng cho phát triển và debug local, được `nb` tự động đồng bộ từ `plugins/`).
2. Phiên bản đóng gói trong `storage/plugins` (upload qua giao diện hoặc import qua CLI).
3. Package dependency trong `node_modules` (cài qua npm/yarn hoặc tích hợp sẵn trong framework).

Nếu Plugin cùng tên cùng tồn tại trong thư mục source code và thư mục đóng gói, NocoBase sẽ ưu tiên load phiên bản source code, thuận tiện cho việc override và debug local.

## Template thư mục Plugin

Tạo Plugin bằng CLI:

```bash
nb scaffold plugin @my-project/plugin-hello
```

Cấu trúc thư mục được tạo ra như sau:

```bash
plugins/@my-project/plugin-hello/
├── dist/                    # Output build (tạo theo nhu cầu)
├── src/                     # Thư mục mã nguồn
│   ├── client-v2/           # Mã front-end (Block, page, model, v.v.)
│   │   ├── plugin.ts        # Class chính của Plugin client
│   │   └── index.ts         # Entry client
│   ├── locale/              # Tài nguyên đa ngôn ngữ (chia sẻ giữa front-end và back-end)
│   ├── swagger/             # Tài liệu OpenAPI/Swagger
│   └── server/              # Mã server
│       ├── collections/     # Định nghĩa Collection / bảng dữ liệu
│       ├── commands/        # Lệnh tùy chỉnh
│       ├── migrations/      # Script migration database
│       ├── plugin.ts        # Class chính của Plugin server
│       └── index.ts         # Entry server
├── index.ts                 # Bridge export front-end và back-end
├── client-v2.d.ts           # Khai báo type front-end
├── client-v2.js             # Sản phẩm build front-end
├── server.d.ts              # Khai báo type server
├── server.js                # Sản phẩm build server
├── .npmignore               # Cấu hình bỏ qua khi publish
└── package.json
```

:::tip Mẹo

Sau khi build hoàn tất, các file `dist/`, `client-v2.js`, `server.js` sẽ được load khi Plugin được kích hoạt. Trong giai đoạn phát triển bạn chỉ cần chỉnh sửa thư mục `src/`, trước khi phát hành chạy `nb source build <plugin>` hoặc `nb source build <plugin> --tar`.

:::

## Liên kết liên quan

- [Viết Plugin đầu tiên](./write-your-first-plugin.md) — Tạo Plugin từ đầu và trải nghiệm quy trình phát triển hoàn chỉnh
- [Tổng quan phát triển server](./server/index.md) — Giới thiệu tổng thể và các khái niệm cốt lõi của Plugin server
- [Tổng quan phát triển client](./client/index.md) — Giới thiệu tổng thể và các khái niệm cốt lõi của Plugin client
- [Build và đóng gói](./build.md) — Quy trình build, đóng gói và phân phối Plugin
- [Quản lý dependency](./dependency-management.md) — Cách khai báo và quản lý dependency của Plugin
