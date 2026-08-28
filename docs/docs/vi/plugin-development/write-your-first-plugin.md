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
packages/plugins/@my-project/plugin-hello/
├─ package.json
├─ README.md
├─ .npmignore
├─ client-v2.d.ts            # Khai báo type cho entry client v2
├─ client-v2.js              # Entry client v2
├─ client.d.ts               # Khai báo type cho entry client v1
├─ client.js                 # Entry client v1
├─ server.d.ts               # Khai báo type cho entry server
├─ server.js                 # Entry server
└─ src
   ├─ index.ts               # Mặc định export Plugin server
   ├─ client-v2              # Vị trí lưu mã client v2
   │  ├─ index.tsx           # Class Plugin client export mặc định
   │  ├─ plugin.tsx          # Entry Plugin (kế thừa Plugin từ @nocobase/client-v2)
   │  └─ client.d.ts
   ├─ client                 # Vị trí lưu mã client v1
   │  ├─ index.tsx
   │  ├─ plugin.tsx
   │  ├─ locale.ts
   │  ├─ models
   │  │  └─ index.ts
   │  └─ client.d.ts
   ├─ server                 # Vị trí lưu mã server
   │  ├─ index.ts            # Class Plugin server export mặc định
   │  ├─ plugin.ts           # Entry Plugin (kế thừa Plugin từ @nocobase/server)
   │  └─ collections         # Collection server (ban đầu là thư mục rỗng)
   └─ locale                 # Tài nguyên đa ngôn ngữ
      ├─ en-US.json
      └─ zh-CN.json
```

Scaffold chỉ sinh ra bộ khung tối thiểu, trong `src/client-v2/` chỉ có các file entry. Thư mục `models/` và file `locale.ts` dùng ở các bước sau là do bạn tự tạo.

Tiếp theo, hãy khởi động chế độ phát triển để những thay đổi code sau đó được hot-reload:

- Nếu dự án được tạo bằng NocoBase CLI (`nb init`), chạy lệnh sau tại thư mục gốc dự án (`<app-path>`):

  ```bash
  nb source dev
  ```

- Nếu bạn tự clone repo source code NocoBase, chạy lệnh sau tại thư mục gốc source code:

  ```bash
  yarn dev
  ```

Sau khi chạy lên, hãy truy cập trang "Plugin Manager" trên trình duyệt (địa chỉ mặc định: http://localhost:13000/admin/settings/plugin-manager) để kiểm tra Plugin đã xuất hiện trong danh sách chưa.

## Bước 2: Triển khai một Block client đơn giản

Tiếp theo, hãy thêm một model Block tùy chỉnh vào Plugin để hiển thị một đoạn text chào mừng.

1. **Thêm file tiện ích dịch** `src/client-v2/locale.ts`. `tExpr` dùng để khai báo biểu thức dịch kèm namespace, còn `useT` cung cấp hàm dịch để dùng bên trong component:

```ts
import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';
// @ts-ignore
import pkg from '../../package.json';

export function useT() {
  const engine = useFlowEngine();
  return (str: string) => engine.context.t(str, { ns: [pkg.name, 'client'] });
}

export function tExpr(key: string) {
  return _tExpr(key, { ns: [pkg.name, 'client'] });
}
```

2. **Thêm file model Block** `src/client-v2/models/HelloBlockModel.tsx`:

```tsx pure
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

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

3. **Đăng ký model Block**. Chỉ tạo file model thôi là chưa đủ, runtime front-end không tự quét thư mục `models/`, bạn cần đăng ký tường minh trong entry của Plugin. Sửa `src/client-v2/plugin.tsx`, trong `load()` dùng `registerModelLoaders` để khai báo cách load model:

```tsx pure
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClientV2 extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}

export default PluginHelloClientV2;
```

`registerModelLoaders` nhận vào các hàm lazy-load, model chỉ được load khi thực sự được dùng đến. Tên key (`HelloBlockModel`) phải trùng với tên class model, runtime sẽ dựa vào tên này để lấy class model từ các named export của module.

Sau khi lưu code, nếu bạn đang chạy chế độ phát triển, bạn sẽ thấy log hot-reload xuất hiện ở terminal.

## Bước 3: Kích hoạt và trải nghiệm Plugin

Bạn có thể bật Plugin qua dòng lệnh hoặc giao diện:

- **Dòng lệnh**

  ```bash
  yarn pm enable @my-project/plugin-hello
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

Thông thường, `yarn pm enable` ở trên là đủ cho phát triển và debug local. Hai biến này phù hợp hơn cho các kịch bản phát hành "mở hộp là dùng được" — ví dụ khi bạn đóng gói một ứng dụng NocoBase kèm theo bộ Plugin cố định và muốn Plugin sẵn sàng ngay sau khi khởi tạo.

:::tip Mẹo

- Plugin cần đã được tải về local và có thể tìm thấy trong `node_modules`, xem [Cấu trúc thư mục dự án](./project-structure.md)
- Sau khi cấu hình, cần chạy lại `nocobase install` hoặc `nocobase upgrade` thì mới có hiệu lực
- Xem đầy đủ các biến môi trường tại [Biến môi trường](../get-started/installation/env.md#append_preset_local_plugins)

:::

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

Sau khi build xong, file đóng gói mặc định nằm ở thư mục `storage/tar/`, với tên file là `<tên-package>-<phiên-bản>.tgz`, ví dụ `storage/tar/@my-project/plugin-hello-0.1.0.tgz`.

:::tip Mẹo

Trước khi phát hành Plugin, bạn nên viết test case để xác minh logic cốt lõi, NocoBase cung cấp bộ công cụ test server hoàn chỉnh. Xem chi tiết tại [Test (Kiểm thử)](./server/test.md).

:::

## Bước 5: Upload sang ứng dụng NocoBase khác

Upload và giải nén file đóng gói vào thư mục `./storage/plugins` của ứng dụng đích. Các bước chi tiết xem tại [Cài đặt và nâng cấp Plugin](../get-started/install-upgrade-plugins.mdx).

Nếu ứng dụng đích được tạo bằng NocoBase CLI (`nb init`), bạn cũng có thể dùng trực tiếp `nb plugin import` để import mà không cần giải nén thủ công:

```bash
nb plugin import /your/path/plugin-hello-0.1.0.tgz
```

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
- [Biến môi trường](../get-started/installation/env.md) — Cấu hình biến môi trường cho Plugin preset, Plugin tích hợp, v.v.
