---
title: "Cấu trúc thư mục dự án Plugin"
description: "Cấu trúc dự án Plugin NocoBase: Yarn Workspace, packages/plugins, storage, thư mục client/server, cấu hình lerna.json."
keywords: "cấu trúc dự án,Yarn Workspace,packages/plugins,thư mục plugin,create-nocobase-app,NocoBase"
---

# Cấu trúc thư mục dự án

Dù bạn clone source code qua Git hay khởi tạo dự án bằng `create-nocobase-app`, dự án NocoBase được tạo ra về bản chất đều là một monorepo dựa trên **Yarn Workspace**.

## Tổng quan thư mục cấp cao

Dưới đây lấy `my-nocobase-app/` làm thư mục dự án. Có thể có khác biệt nhỏ giữa các môi trường:

```bash
my-nocobase-app/
├── packages/              # Mã nguồn dự án
│   ├── plugins/           # Mã nguồn Plugin đang phát triển (chưa biên dịch)
├── storage/               # Dữ liệu runtime và nội dung tạo động
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Plugin đã biên dịch (bao gồm Plugin upload qua giao diện)
│   └── tar/               # File đóng gói Plugin (.tar)
├── scripts/               # Script tiện ích và lệnh công cụ
├── .env*                  # Biến cấu hình theo từng môi trường
├── lerna.json             # Cấu hình Lerna workspace
├── package.json           # Cấu hình package gốc, khai báo workspace và script
├── tsconfig*.json         # Cấu hình TypeScript (front-end, back-end, mapping path)
├── vitest.config.mts      # Cấu hình unit test Vitest
└── playwright.config.ts   # Cấu hình E2E test Playwright
```

## Mô tả thư mục con packages/

Thư mục `packages/` chứa các module cốt lõi và package có thể mở rộng của NocoBase, nội dung cụ thể tùy thuộc vào nguồn dự án:

- **Dự án tạo bằng `create-nocobase-app`**: Mặc định chỉ có `packages/plugins/`, dùng để chứa mã nguồn Plugin tùy chỉnh. Mỗi thư mục con là một npm package độc lập.
- **Clone repo source code chính thức**: Sẽ thấy nhiều thư mục con hơn như `core/`, `plugins/`, `pro-plugins/`, `presets/`, v.v. tương ứng với core framework, Plugin tích hợp sẵn và preset chính thức.

Trong cả hai trường hợp, `packages/plugins` đều là vị trí chính để bạn phát triển và debug Plugin tùy chỉnh.

## Thư mục runtime storage/

`storage/` lưu dữ liệu được tạo lúc runtime và sản phẩm build. Mô tả các thư mục con thường gặp:

- `apps/`: Cấu hình và cache cho kịch bản multi-app.
- `logs/`: Log runtime và output debug.
- `uploads/`: File và tài nguyên media do người dùng upload.
- `plugins/`: Plugin đóng gói được upload qua giao diện hoặc import qua CLI.
- `tar/`: File nén Plugin được tạo sau khi chạy `yarn build <plugin> --tar`.

:::tip Mẹo

Thường thì bạn nên thêm thư mục `storage` vào `.gitignore`, xử lý riêng khi deploy hoặc backup.

:::

## Cấu hình môi trường và script dự án

- `.env`, `.env.test`, `.env.e2e`: Lần lượt tương ứng với chạy local, unit/integration test và end-to-end test.
- `scripts/`: Chứa script vận hành thường dùng như khởi tạo database, công cụ hỗ trợ phát hành, v.v.

## Đường dẫn load Plugin và độ ưu tiên

Plugin có thể tồn tại ở nhiều vị trí, NocoBase load theo độ ưu tiên sau khi khởi động:

1. Phiên bản source code trong `packages/plugins` (dùng cho phát triển và debug local).
2. Phiên bản đóng gói trong `storage/plugins` (upload qua giao diện hoặc import qua CLI).
3. Package dependency trong `node_modules` (cài qua npm/yarn hoặc tích hợp sẵn trong framework).

Nếu Plugin cùng tên cùng tồn tại trong thư mục source code và thư mục đóng gói, NocoBase sẽ ưu tiên load phiên bản source code, thuận tiện cho việc override và debug local.

## Template thư mục Plugin

Tạo Plugin bằng CLI:

```bash
yarn pm create @my-project/plugin-hello
```

Cấu trúc thư mục được tạo ra như sau:

```bash
packages/plugins/@my-project/plugin-hello/
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

Sau khi build hoàn tất, các file `dist/`, `client-v2.js`, `server.js` sẽ được load khi Plugin được kích hoạt. Trong giai đoạn phát triển bạn chỉ cần chỉnh sửa thư mục `src/`, trước khi phát hành chạy `yarn build <plugin>` hoặc `yarn build <plugin> --tar`.

:::

## Liên kết liên quan

- [Viết Plugin đầu tiên](./write-your-first-plugin.md) — Tạo Plugin từ đầu và trải nghiệm quy trình phát triển hoàn chỉnh
- [Tổng quan phát triển server](./server/index.md) — Giới thiệu tổng thể và các khái niệm cốt lõi của Plugin server
- [Tổng quan phát triển client](./client/index.md) — Giới thiệu tổng thể và các khái niệm cốt lõi của Plugin client
- [Build và đóng gói](./build.md) — Quy trình build, đóng gói và phân phối Plugin
- [Quản lý dependency](./dependency-management.md) — Cách khai báo và quản lý dependency của Plugin
