---
title: "Tạo một Field component tùy chỉnh"
description: "Thực hành Plugin NocoBase: dùng ClickableFieldModel để tạo một component hiển thị Field tùy chỉnh, gắn vào field interface."
keywords: "Field tùy chỉnh,FieldModel,ClickableFieldModel,bindModelToInterface,mở rộng field,NocoBase"
---

# Tạo một Field component tùy chỉnh

Trong NocoBase, Field component được dùng để hiển thị và chỉnh sửa dữ liệu trong table và form. Ví dụ này hướng dẫn cách dùng `ClickableFieldModel` để tạo một component hiển thị Field tùy chỉnh — bọc giá trị field bằng dấu ngoặc vuông `[]`, và gắn vào field interface kiểu `input`.

:::tip Đọc trước

Nên tìm hiểu các nội dung sau trước khi phát triển để mượt mà hơn:

- [Viết Plugin đầu tiên](../../write-your-first-plugin) — Tạo plugin và cấu trúc thư mục
- [Plugin](../plugin) — Entry point và lifecycle `load()` của plugin
- [Tổng quan FlowEngine](../flow-engine/index.md) — Cách dùng cơ bản của FlowModel
- [FlowEngine → Mở rộng Field](../flow-engine/field) — Giới thiệu các base class FieldModel, ClickableFieldModel
- [i18n](../component/i18n) — Cách viết file dịch và cách dùng `tExpr()` để dịch trễ

:::

## Kết quả cuối cùng

Chúng ta sẽ tạo một component hiển thị Field tùy chỉnh:

- Kế thừa `ClickableFieldModel`, tự định nghĩa logic render
- Bọc giá trị field bằng `[]` khi hiển thị
- Gắn vào field kiểu `input` (single-line text) qua `bindModelToInterface`

Sau khi bật plugin, tìm một cột field single-line text trong block table, click vào nút cấu hình của cột, và trong dropdown "Field component" bạn sẽ thấy lựa chọn `DisplaySimpleFieldModel`. Sau khi chuyển sang, giá trị của cột sẽ được hiển thị theo định dạng `[value]`.

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_20.08.48.mp4" type="video/mp4">
</video>

Toàn bộ source code xem tại [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple). Nếu bạn muốn chạy thử trực tiếp ở local:

```bash
yarn pm enable @nocobase-example/plugin-field-simple
```

Sau đây ta sẽ xây dựng plugin này từ đầu, từng bước một.

## Bước 1: Tạo khung plugin

Tại thư mục gốc của repo, chạy:

```bash
yarn pm create @my-project/plugin-field-simple
```

Chi tiết xem tại [Viết Plugin đầu tiên](../../write-your-first-plugin).

## Bước 2: Tạo Field Model

Tạo file mới `src/client-v2/models/DisplaySimpleFieldModel.tsx`. Đây là phần lõi của plugin — định nghĩa cách field render và gắn vào loại field interface nào.

```tsx
// src/client-v2/models/DisplaySimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    // this.context.record có thể lấy bản ghi đầy đủ của hàng hiện tại
    console.log('Bản ghi hiện tại:', this.context.record);
    console.log('Index của bản ghi hiện tại:', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// Đặt tên hiển thị trong dropdown "Field component"
DisplaySimpleFieldModel.define({
  label: tExpr('Simple field'),
});

// Gắn vào field interface kiểu 'input' (single-line text)
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Một số điểm chính:

- **`renderComponent(value)`** — Nhận giá trị field hiện tại làm tham số, trả về JSX để render
- **`this.context.record`** — Lấy bản ghi dữ liệu đầy đủ của hàng hiện tại
- **`this.context.recordIndex`** — Lấy index của hàng hiện tại
- **`ClickableFieldModel`** — Kế thừa từ `FieldModel`, có khả năng tương tác click
- **`define({ label })`** — Đặt tên hiển thị trong dropdown "Field component", nếu không thêm thì sẽ hiển thị trực tiếp tên class
- **`DisplayItemModel.bindModelToInterface()`** — Gắn Field model vào loại field interface chỉ định (ví dụ `input` đại diện cho field single-line text), nhờ đó field tương ứng có thể chọn component hiển thị này

## Bước 3: Thêm file đa ngôn ngữ

Chỉnh sửa file dịch trong `src/locale/` của plugin, thêm bản dịch cho các key được dùng bởi `tExpr()`:

```json
// src/locale/zh-CN.json
{
  "Simple field": "简单字段"
}
```

```json
// src/locale/en-US.json
{
  "Simple field": "Simple field"
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

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/DisplaySimpleFieldModel'),
      },
    });
  }
}

export default PluginFieldSimpleClient;
```

## Bước 5: Bật plugin

```bash
yarn pm enable @my-project/plugin-field-simple
```

Sau khi bật, tìm một cột field single-line text trong block table, click vào nút cấu hình của cột, trong dropdown "Field component" bạn có thể chuyển sang component hiển thị tùy chỉnh này.

## Source code đầy đủ

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — Ví dụ đầy đủ về Field component tùy chỉnh

## Tóm tắt

Các khả năng được sử dụng trong ví dụ này:

| Khả năng | Cách dùng | Tài liệu |
| -------- | --------- | -------- |
| Render Field | `ClickableFieldModel` + `renderComponent(value)` | [FlowEngine → Mở rộng Field](../flow-engine/field) |
| Gắn field interface | `DisplayItemModel.bindModelToInterface()` | [FlowEngine → Mở rộng Field](../flow-engine/field) |
| Đăng ký Model | `this.flowEngine.registerModelLoaders()` | [Plugin](../plugin) |

## Liên kết liên quan

- [Viết Plugin đầu tiên](../../write-your-first-plugin) — Tạo khung plugin từ đầu
- [Tổng quan FlowEngine](../flow-engine/index.md) — Cách dùng cơ bản của FlowModel
- [FlowEngine → Mở rộng Field](../flow-engine/field) — FieldModel, ClickableFieldModel, bindModelToInterface
- [FlowEngine → Mở rộng Block](../flow-engine/block) — Block tùy chỉnh
- [Component vs FlowModel](../component-vs-flow-model) — Khi nào nên dùng FlowModel
- [Plugin](../plugin) — Entry point và lifecycle load() của plugin
- [i18n](../component/i18n) — Cách viết file dịch và cách dùng tExpr
- [Tài liệu đầy đủ FlowEngine](../../../flow-engine/index.md) — Tham chiếu đầy đủ về FlowModel, Flow, Context
