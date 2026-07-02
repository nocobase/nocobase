---
title: "Viết Plugin NocoBase đầu tiên"
description: "Tạo Plugin Block từ đầu: nb scaffold plugin, bộ khung Plugin, thư mục client/server, đăng ký Block, quy trình phát triển và debug."
keywords: "viết plugin,Plugin đầu tiên,nb scaffold plugin,bộ khung plugin,Plugin Block,phát triển Plugin NocoBase"
---

# Viết Plugin đầu tiên

Tài liệu này sẽ hướng dẫn bạn tạo từ đầu một Plugin Block có thể dùng được trên trang, giúp bạn hiểu cấu trúc cơ bản và quy trình phát triển Plugin NocoBase.

## Điều kiện tiên quyết

Trước khi bắt đầu, hãy chắc chắn bạn đã cài đặt ứng dụng NocoBase qua NocoBase CLI (`nb init`). CLI hỗ trợ hai nguồn npm và Git, khuyến nghị dùng nguồn Git (khi phát triển với AI có thể tham khảo trực tiếp source code). Xem chi tiết tại [Cài đặt bằng CLI](../nocobase-cli/installation/cli.md) hoặc [Hướng dẫn kết nối AI Agent](../ai/quick-start.mdx).

Sau khi cài xong là bạn có thể bắt đầu.

## Bước 1: Tạo bộ khung Plugin qua CLI

Tại thư mục gốc dự án (`<app-path>`) hoặc thư mục `source/`, chạy lệnh sau để tạo nhanh một Plugin trống:

```bash
nb scaffold plugin @my-project/plugin-hello
```

Sau khi lệnh chạy thành công, các file cơ bản sẽ được tạo trong thư mục `<app-path>/plugins/@my-project/plugin-hello` (`nb` sẽ tự động đồng bộ Plugin vào `source/packages/plugins/` để phục vụ quy trình phát triển và build), cấu trúc mặc định như sau:

```bash
├─ /plugins/@my-project/plugin-hello
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
  nb plugin enable @my-project/plugin-hello
  ```

- **Giao diện quản lý**: Truy cập "Plugin Manager", tìm `@my-project/plugin-hello` và nhấn "Kích hoạt".

Sau khi kích hoạt, hãy tạo một trang "Modern page (v2)" mới, khi thêm Block bạn sẽ thấy "Hello block", chèn nó vào trang là sẽ thấy nội dung chào mừng bạn vừa viết.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

### Đặt Plugin thành mặc định hoặc tự động kích hoạt (tùy chọn)

Ở trên là cách bật từng Plugin thủ công. Nếu bạn đang duy trì ứng dụng NocoBase của riêng mình và muốn một số Plugin tự động sẵn sàng sau khi chạy `nocobase install` (cài đặt lần đầu) hoặc `nocobase upgrade` (nâng cấp), bạn có thể dùng hai biến môi trường để kiểm soát trạng thái mặc định của Plugin:

- **`APPEND_PRESET_LOCAL_PLUGINS` (Thêm Plugin preset mặc định)** — Thêm Plugin vào danh sách Plugin preset local, sau khi cài đặt Plugin sẽ xuất hiện trong "Trình quản lý Plugin", nhưng mặc định không kích hoạt, cần bạn bật thủ công
- **`APPEND_PRESET_BUILT_IN_PLUGINS` (Thêm Plugin tích hợp mặc định)** — Thêm Plugin vào danh sách Plugin tích hợp, Plugin sẽ được tự động kích hoạt khi cài đặt, và vì là Plugin tích hợp nên **không thể tắt hay xóa trong "Trình quản lý Plugin"**

Giá trị của cả hai biến là tên package của Plugin (trường `name` trong `package.json`), nhiều Plugin phân tách bằng dấu phẩy tiếng Anh. Cấu hình trong file `.env` như sau:

```bash
# Preset mặc định: xuất hiện trong danh sách Trình quản lý Plugin, nhưng không tự động kích hoạt
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world

# Tự động kích hoạt: tự động cài đặt và kích hoạt, và không thể tắt trên giao diện
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world
```

Thông thường, `nb plugin enable` ở trên là đủ cho phát triển và debug local. Hai biến này phù hợp hơn cho các kịch bản phát hành "mở hộp là dùng được" — ví dụ khi bạn đóng gói một ứng dụng NocoBase kèm theo bộ Plugin cố định và muốn Plugin sẵn sàng ngay sau khi khởi tạo.

:::tip Mẹo

- Plugin cần đã được tải về local và có thể tìm thấy trong `node_modules`, xem [Cấu trúc thư mục dự án](./project-structure.md)
- Sau khi cấu hình, cần chạy lại `nocobase install` hoặc `nocobase upgrade` thì mới có hiệu lực
- Xem đầy đủ các biến môi trường tại [Biến môi trường](../get-started/installation/env.md#append_preset_local_plugins)

:::

## Bước 4: Build và đóng gói

Khi bạn chuẩn bị phân phối Plugin sang môi trường khác, cần build trước rồi đóng gói:

```bash
nb source build @my-project/plugin-hello --tar
# Hoặc tách thành hai bước
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
```

:::tip Mẹo

Nếu Plugin được tạo trong repo source code, lần build đầu tiên sẽ kích hoạt type check toàn repo, có thể mất khá nhiều thời gian. Hãy đảm bảo dependency đã được cài đặt và repo ở trạng thái build được.

:::

Sau khi build xong, file đóng gói mặc định nằm ở thư mục `source/storage/tar/`, lệnh sẽ in ra đường dẫn đầy đủ của tarball.

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
- [Hướng dẫn kết nối AI Agent](../ai/quick-start.mdx) — Cài đặt NocoBase CLI và khởi tạo ứng dụng
- [Cài đặt bằng CLI](../nocobase-cli/installation/cli.md) — Quy trình cài đặt đầy đủ
- [Cài đặt và nâng cấp Plugin](../get-started/install-upgrade-plugins.mdx) — Upload Plugin đã đóng gói sang môi trường khác
- [Biến môi trường](../get-started/installation/env.md) — Cấu hình biến môi trường cho Plugin preset, Plugin tích hợp, v.v.
