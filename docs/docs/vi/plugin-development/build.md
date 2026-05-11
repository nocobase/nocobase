---
title: "Build và đóng gói"
description: "Build và đóng gói Plugin NocoBase: yarn build, yarn nocobase tar, cấu hình tùy chỉnh build.config.ts, đóng gói client với Rsbuild, đóng gói server với tsup."
keywords: "build plugin,đóng gói plugin,yarn build,tar,build.config.ts,Rsbuild,tsup,@nocobase/build,NocoBase"
---

# Build và đóng gói

Sau khi phát triển Plugin xong, bạn cần qua hai bước build (biên dịch source code) và đóng gói (tạo `.tar.gz`) thì mới có thể phân phối sang ứng dụng NocoBase khác để sử dụng.

## Build Plugin

Build sẽ biên dịch source code TypeScript trong `src/` thành JavaScript — code client được đóng gói bằng Rsbuild, code server được đóng gói bằng tsup:

```bash
yarn build @my-project/plugin-hello
```

Sản phẩm build sẽ được output vào thư mục `dist/` ở thư mục gốc của Plugin.

:::tip Mẹo

Nếu Plugin được tạo trong repo source code, lần build đầu tiên sẽ kích hoạt type check toàn repo, có thể mất khá nhiều thời gian. Hãy đảm bảo dependency đã được cài đặt và repo ở trạng thái build được.

:::

## Đóng gói Plugin

Đóng gói sẽ nén sản phẩm build thành một file `.tar.gz`, thuận tiện cho việc upload sang môi trường khác:

```bash
yarn nocobase tar @my-project/plugin-hello
```

File đóng gói mặc định được output vào `storage/tar/@my-project/plugin-hello.tar.gz`.

Bạn cũng có thể dùng tham số `--tar` để gộp build và đóng gói thành một bước:

```bash
yarn build @my-project/plugin-hello --tar
```

## Upload sang ứng dụng NocoBase khác

Upload và giải nén file `.tar.gz` vào thư mục `./storage/plugins` của ứng dụng đích. Các bước chi tiết xem tại [Cài đặt và nâng cấp Plugin](../get-started/install-upgrade-plugins.mdx).

## Cấu hình build tùy chỉnh

Thường thì cấu hình build mặc định là đủ dùng. Nếu bạn cần tùy chỉnh — như sửa entry đóng gói, thêm alias, điều chỉnh tùy chọn nén, v.v. — bạn có thể tạo file `build.config.ts` trong thư mục gốc Plugin:

```ts
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // Sửa cấu hình đóng gói Rsbuild của client (src/client-v2)
    // Tham khảo: https://rsbuild.rs/guide/configuration/rsbuild
    return config;
  },
  modifyTsupConfig: (config) => {
    // Sửa cấu hình đóng gói tsup của server (src/server)
    // Tham khảo: https://tsup.egoist.dev/#using-custom-configuration
    return config;
  },
  beforeBuild: (log) => {
    // Callback trước khi bắt đầu build, ví dụ dọn file tạm, sinh code, v.v.
  },
  afterBuild: (log) => {
    // Callback sau khi build hoàn tất, ví dụ copy thêm tài nguyên, output thông tin thống kê, v.v.
  },
});
```

Một vài điểm chính:

- `modifyRsbuildConfig` — Dùng để điều chỉnh đóng gói client, ví dụ thêm Rsbuild plugin, sửa resolve alias, điều chỉnh chiến lược code splitting, v.v. Tham số cấu hình tham khảo [tài liệu Rsbuild](https://rsbuild.rs/guide/configuration/rsbuild)
- `modifyTsupConfig` — Dùng để điều chỉnh đóng gói server, ví dụ sửa target, externals, entry, v.v. Tham số cấu hình tham khảo [tài liệu tsup](https://tsup.egoist.dev/#using-custom-configuration)
- `beforeBuild` / `afterBuild` — Hook trước và sau build, nhận một hàm `log` để output log. Ví dụ trong `beforeBuild` sinh một số file code, trong `afterBuild` copy tài nguyên tĩnh sang thư mục sản phẩm

## Liên kết liên quan

- [Viết Plugin đầu tiên](./write-your-first-plugin.md) — Tạo Plugin từ đầu, bao gồm quy trình build và đóng gói hoàn chỉnh
- [Cấu trúc thư mục dự án](./project-structure.md) — Tìm hiểu chức năng của các thư mục `packages/plugins`, `storage/tar`, v.v.
- [Quản lý dependency](./dependency-management.md) — Khai báo dependency của Plugin và dependency toàn cục
- [Tổng quan phát triển Plugin](./index.md) — Giới thiệu tổng thể về phát triển Plugin
- [Cài đặt và nâng cấp Plugin](../get-started/install-upgrade-plugins.mdx) — Upload file đóng gói sang môi trường đích
