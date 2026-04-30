---
title: "Tạo một Block hiển thị tùy chỉnh"
description: "Thực hành Plugin NocoBase: dùng BlockModel + registerFlow + uiSchema để tạo một block hiển thị HTML có thể cấu hình."
keywords: "Block tùy chỉnh,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# Tạo một Block hiển thị tùy chỉnh

Trong NocoBase, Block là vùng nội dung trên trang. Ví dụ này hướng dẫn cách dùng `BlockModel` để tạo một block tùy chỉnh đơn giản nhất — hỗ trợ chỉnh sửa nội dung HTML trên giao diện, người dùng có thể sửa nội dung hiển thị của block thông qua bảng cấu hình.

Đây là ví dụ đầu tiên có liên quan đến FlowEngine, sẽ sử dụng `BlockModel`, `renderComponent`, `registerFlow` và `uiSchema`.

:::tip Đọc trước

Nên tìm hiểu các nội dung sau trước khi phát triển để mượt mà hơn:

- [Viết Plugin đầu tiên](../../write-your-first-plugin) — Tạo plugin và cấu trúc thư mục
- [Plugin](../plugin) — Entry point của plugin và lifecycle `load()`
- [Tổng quan FlowEngine](../flow-engine/index.md) — Cách dùng cơ bản của FlowModel, renderComponent, registerFlow
- [i18n](../component/i18n) — Cách viết file dịch và cách dùng `tExpr()` để dịch trễ

:::

## Kết quả cuối cùng

Chúng ta sẽ tạo một block "Simple block":

- Xuất hiện trong menu "Thêm Block"
- Render nội dung HTML do người dùng cấu hình
- Cho phép người dùng chỉnh sửa HTML qua bảng cấu hình (registerFlow + uiSchema)

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

Toàn bộ source code xem tại [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block). Nếu bạn muốn chạy thử trực tiếp ở local:

```bash
yarn pm enable @nocobase-example/plugin-simple-block
```

Sau đây ta sẽ xây dựng plugin này từ đầu, từng bước một.

## Bước 1: Tạo khung plugin

Tại thư mục gốc của repo, chạy:

```bash
yarn pm create @my-project/plugin-simple-block
```

Lệnh này sẽ sinh cấu trúc file cơ bản tại `packages/plugins/@my-project/plugin-simple-block`. Chi tiết xem tại [Viết Plugin đầu tiên](../../write-your-first-plugin).

## Bước 2: Tạo Block Model

Tạo file mới `src/client-v2/models/SimpleBlockModel.tsx`. Đây là phần lõi của toàn bộ plugin — định nghĩa cách block render và cách cấu hình.

```tsx
// src/client-v2/models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

// Đặt tên hiển thị của block trong menu "Thêm Block"
SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

// Đăng ký bảng cấu hình để người dùng có thể chỉnh sửa nội dung HTML
SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // Thực thi trước khi render
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema định nghĩa UI form của bảng cấu hình
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // Giá trị mặc định của bảng cấu hình
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // Ghi giá trị từ bảng cấu hình vào props của model
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Một số điểm chính:

- **`renderComponent()`** — Render UI của block, đọc nội dung HTML qua `this.props.html`
- **`define()`** — Đặt tên hiển thị của block trong menu "Thêm Block". `tExpr()` được dùng để dịch trễ, vì `define()` được thực thi khi module được load — lúc đó i18n chưa được khởi tạo
- **`registerFlow()`** — Thêm bảng cấu hình. `uiSchema` dùng JSON Schema để định nghĩa form (cú pháp xem [UI Schema](../../../../flow-engine/ui-schema)), `handler` ghi giá trị người dùng nhập vào `ctx.model.props`, sau đó `renderComponent()` có thể đọc được

## Bước 3: Thêm file đa ngôn ngữ

Chỉnh sửa file dịch trong `src/locale/` của plugin, thêm bản dịch cho tất cả các key được dùng bởi `tExpr()`:

```json
// src/locale/zh-CN.json
{
  "Simple block": "简单区块",
  "Simple Block Flow": "简单区块配置",
  "Edit HTML Content": "编辑 HTML 内容",
  "HTML Content": "HTML 内容"
}
```

```json
// src/locale/en-US.json
{
  "Simple block": "Simple block",
  "Simple Block Flow": "Simple Block Flow",
  "Edit HTML Content": "Edit HTML Content",
  "HTML Content": "HTML Content"
}
```

:::warning Lưu ý

Khi thêm file ngôn ngữ lần đầu, bạn cần khởi động lại ứng dụng để có hiệu lực.

:::

Về cách viết file dịch và các cách dùng khác của `tExpr()`, xem chi tiết tại [i18n](../component/i18n).

## Bước 4: Đăng ký trong Plugin

Chỉnh sửa `src/client-v2/plugin.tsx`, dùng `registerModelLoaders` để load model theo nhu cầu:

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleBlockClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        // Load theo nhu cầu, chỉ load module khi lần đầu được dùng đến
        loader: () => import('./models/SimpleBlockModel'),
      },
    });
  }
}

export default PluginSimpleBlockClient;
```

`registerModelLoaders` dùng dynamic import, code của model chỉ được load khi thực sự dùng đến — đây là cách đăng ký được khuyến nghị.

## Bước 5: Bật plugin

```bash
yarn pm enable @my-project/plugin-simple-block
```

Sau khi bật, tạo một trang mới, click "Thêm Block" và bạn sẽ thấy "Simple block". Sau khi thêm, click vào nút cấu hình của block để chỉnh sửa nội dung HTML.

## Source code đầy đủ

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — Ví dụ đầy đủ về Block hiển thị tùy chỉnh

## Tóm tắt

Các khả năng được sử dụng trong ví dụ này:

| Khả năng | Cách dùng | Tài liệu |
| -------- | --------- | -------- |
| Render Block | `BlockModel` + `renderComponent()` | [FlowEngine → Mở rộng Block](../flow-engine/block) |
| Đăng ký menu | `define({ label })` | [Tổng quan FlowEngine](../flow-engine/index.md) |
| Bảng cấu hình | `registerFlow()` + `uiSchema` | [Tổng quan FlowEngine](../flow-engine/index.md) |
| Đăng ký Model | `registerModelLoaders` (load theo nhu cầu) | [Plugin](../plugin) |
| Dịch trễ | `tExpr()` | [i18n](../component/i18n) |

## Liên kết liên quan

- [Viết Plugin đầu tiên](../../write-your-first-plugin) — Tạo khung plugin từ đầu
- [Tổng quan FlowEngine](../flow-engine/index.md) — Cách dùng cơ bản của FlowModel và registerFlow
- [FlowEngine → Mở rộng Block](../flow-engine/block) — BlockModel, DataBlockModel, CollectionBlockModel
- [UI Schema](../../../../flow-engine/ui-schema) — Tham chiếu cú pháp uiSchema
- [Component vs FlowModel](../component-vs-flow-model) — Khi nào nên dùng FlowModel
- [Plugin](../plugin) — Entry point và lifecycle load() của plugin
- [i18n](../component/i18n) — Cách viết file dịch và cách dùng tExpr
- [Tài liệu đầy đủ FlowEngine](../../../flow-engine/index.md) — Tham chiếu đầy đủ về FlowModel, Flow, Context
