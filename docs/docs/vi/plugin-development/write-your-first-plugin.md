---
title: "Viết Plugin NocoBase đầu tiên"
description: "Tạo Plugin Block từ đầu: yarn pm create, bộ khung Plugin, thư mục client/server, đăng ký Block, quy trình phát triển và debug."
keywords: "viết plugin,Plugin đầu tiên,yarn pm create,bộ khung plugin,Plugin Block,phát triển Plugin NocoBase"
---

# Viết Plugin đầu tiên

Tài liệu này sẽ hướng dẫn bạn tạo từ đầu một Plugin Block có thể dùng được trên trang, giúp bạn hiểu cấu trúc cơ bản và quy trình phát triển Plugin NocoBase.

## Điều kiện tiên quyết

Trước khi bắt đầu, hãy chắc chắn bạn đã cài đặt NocoBase. Nếu chưa cài đặt, bạn có thể tham khảo:

- [Cài đặt bằng create-nocobase-app](../get-started/installation/create-nocobase-app)
- [Cài đặt từ source code Git](../get-started/installation/git)

Sau khi cài xong là bạn có thể bắt đầu.

## Bước 1: Tạo bộ khung Plugin qua CLI

Tại thư mục gốc repo, chạy lệnh sau để tạo nhanh một Plugin trống:

```bash
yarn pm create @my-project/plugin-hello
```

Sau khi lệnh chạy thành công, các file cơ bản sẽ được tạo trong thư mục `packages/plugins/@my-project/plugin-hello`, cấu trúc mặc định như sau:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client-v2.d.ts
  ├─ client-v2.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Mặc định export Plugin server
     ├─ client-v2                 # Vị trí lưu mã client
     │  ├─ index.tsx             # Class Plugin client export mặc định
     │  ├─ plugin.tsx            # Entry Plugin (kế thừa Plugin từ @nocobase/client-v2)
     │  ├─ models                # Tùy chọn: model front-end (như flow node)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Vị trí lưu mã server
     │  ├─ index.ts              # Class Plugin server export mặc định
     │  ├─ plugin.ts             # Entry Plugin (kế thừa Plugin từ @nocobase/server)
     │  ├─ collections           # Tùy chọn: collection server
     │  ├─ migrations            # Tùy chọn: migration dữ liệu
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Tùy chọn: đa ngôn ngữ
        ├─ en-US.json
        └─ zh-CN.json
```

Sau khi tạo xong, bạn có thể truy cập trang "Plugin Manager" trên trình duyệt (địa chỉ mặc định: http://localhost:13000/admin/settings/plugin-manager) để kiểm tra Plugin đã xuất hiện trong danh sách chưa.

## Bước 2: Triển khai một Block client đơn giản

Tiếp theo, hãy thêm một model Block tùy chỉnh vào Plugin để hiển thị một đoạn text chào mừng.

1. **Thêm file model Block** `client-v2/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client-v2';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **Đăng ký model Block**. Sửa `client-v2/models/index.ts`, export model mới để runtime front-end load được:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Sau khi lưu code, nếu bạn đang chạy script phát triển, bạn sẽ thấy log hot-reload xuất hiện ở terminal.

## Bước 3: Kích hoạt và trải nghiệm Plugin

Bạn có thể bật Plugin qua dòng lệnh hoặc giao diện:

- **Dòng lệnh**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Giao diện quản lý**: Truy cập "Plugin Manager", tìm `@my-project/plugin-hello` và nhấn "Kích hoạt".

Sau khi kích hoạt, hãy tạo một trang "Modern page (v2)" mới, khi thêm Block bạn sẽ thấy "Hello block", chèn nó vào trang là sẽ thấy nội dung chào mừng bạn vừa viết.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## Bước 4: Build và đóng gói

Khi bạn chuẩn bị phân phối Plugin sang môi trường khác, cần build trước rồi đóng gói:

```bash
yarn build @my-project/plugin-hello --tar
# Hoặc tách thành hai bước
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

:::tip Mẹo

Nếu Plugin được tạo trong repo source code, lần build đầu tiên sẽ kích hoạt type check toàn repo, có thể mất khá nhiều thời gian. Hãy đảm bảo dependency đã được cài đặt và repo ở trạng thái build được.

:::

Sau khi build xong, file đóng gói mặc định nằm ở `storage/tar/@my-project/plugin-hello.tar.gz`.

:::tip Mẹo

Trước khi phát hành Plugin, bạn nên viết test case để xác minh logic cốt lõi, NocoBase cung cấp bộ công cụ test server hoàn chỉnh. Xem chi tiết tại [Test (Kiểm thử)](./server/test.md).

:::

## Bước 5: Upload sang ứng dụng NocoBase khác

Upload và giải nén file đóng gói vào thư mục `./storage/plugins` của ứng dụng đích. Các bước chi tiết xem tại [Cài đặt và nâng cấp Plugin](../get-started/install-upgrade-plugins.mdx).

## Liên kết liên quan

- [Tổng quan phát triển Plugin](./index.md) — Tìm hiểu kiến trúc microkernel NocoBase và vòng đời Plugin
- [Cấu trúc thư mục dự án](./project-structure.md) — Quy ước thư mục dự án, đường dẫn load Plugin và độ ưu tiên
- [Tổng quan phát triển server](./server/index.md) — Giới thiệu tổng thể và các khái niệm cốt lõi của Plugin server
- [Tổng quan phát triển client](./client/index.md) — Giới thiệu tổng thể và các khái niệm cốt lõi của Plugin client
- [Build và đóng gói](./build.md) — Quy trình build, đóng gói và phân phối Plugin
- [Test (Kiểm thử)](./server/test.md) — Viết test case cho Plugin server
- [Cài đặt bằng create-nocobase-app](../get-started/installation/create-nocobase-app) — Một trong các cách cài đặt NocoBase
- [Cài đặt từ source code Git](../get-started/installation/git) — Cài đặt NocoBase từ source code
- [Cài đặt và nâng cấp Plugin](../get-started/install-upgrade-plugins.mdx) — Upload Plugin đã đóng gói sang môi trường khác
