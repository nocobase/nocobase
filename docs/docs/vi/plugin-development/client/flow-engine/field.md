---
title: "Mở rộng Field"
description: "Phát triển mở rộng Field trong NocoBase: lớp cơ sở FieldModel, ClickableFieldModel, render Field, gắn vào field interface."
keywords: "Mở rộng Field,Field,FieldModel,ClickableFieldModel,renderComponent,bindModelToInterface,NocoBase"
---

# Mở rộng Field

Trong NocoBase, **component Field** được dùng để hiển thị và chỉnh sửa dữ liệu trong bảng và form. Bằng cách kế thừa các lớp cơ sở liên quan của FieldModel, bạn có thể tùy chỉnh cách render Field — ví dụ hiển thị một loại dữ liệu nào đó với định dạng đặc biệt, hoặc dùng component tùy chỉnh để chỉnh sửa.

## Ví dụ: Field hiển thị tùy chỉnh

Ví dụ sau tạo một Field hiển thị đơn giản — thêm dấu ngoặc vuông `[]` vào hai bên giá trị Field:

![20260407201138](https://static-docs.nocobase.com/20260407201138.png)

```tsx
// models/SimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    // this.context.record có thể lấy bản ghi đầy đủ của hàng hiện tại
    console.log('Bản ghi hiện tại:', this.context.record);
    console.log('Index bản ghi hiện tại:', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// Gắn vào field interface kiểu 'input'
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Một vài điểm quan trọng:

- **`renderComponent(value)`** — Nhận giá trị Field hiện tại làm tham số, trả về JSX để render
- **`this.context.record`** — Lấy bản ghi dữ liệu đầy đủ của hàng hiện tại
- **`this.context.recordIndex`** — Lấy index của hàng hiện tại
- **`ClickableFieldModel`** — Kế thừa từ `FieldModel`, có khả năng tương tác click
- **`DisplayItemModel.bindModelToInterface()`** — Gắn Field model vào loại field interface đã chỉ định (ví dụ `input` biểu thị Field nhập văn bản), như vậy trên Field thuộc loại tương ứng có thể chọn component hiển thị này

## Đăng ký Field

Trong `load()` của Plugin, dùng `registerModelLoaders` để đăng ký tải theo nhu cầu:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/SimpleFieldModel'),
      },
    });
  }
}
```

Sau khi đăng ký xong, tìm một cột Field thuộc loại tương ứng trong Block bảng (ví dụ ở trên gắn `input`, tương ứng Field văn bản một dòng), click nút cấu hình của cột, trong menu thả xuống "Field component" có thể chuyển sang component hiển thị tùy chỉnh này. Ví dụ thực tế đầy đủ xem tại [Tạo component Field tùy chỉnh](../examples/custom-field).

![20260407201221](https://static-docs.nocobase.com/20260407201221.png)

## Mã nguồn đầy đủ

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — Ví dụ component Field tùy chỉnh

## Liên kết liên quan

- [Thực hành Plugin: Tạo component Field tùy chỉnh](../examples/custom-field) — Xây dựng một component hiển thị Field tùy chỉnh từ đầu
- [Thực hành Plugin: Tạo plugin quản lý dữ liệu kết hợp frontend-backend](../examples/fullstack-plugin) — Ứng dụng thực tế của Field tùy chỉnh trong Plugin hoàn chỉnh
- [Tổng quan FlowEngine](../flow-engine/index.md) — Cách dùng cơ bản FlowModel
- [Mở rộng Block](./block) — Block tùy chỉnh
- [Mở rộng Action](./action) — Nút Action tùy chỉnh
- [FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Tham số đầy đủ và loại sự kiện của registerFlow
- [Tài liệu FlowEngine đầy đủ](../../../flow-engine/index.md) — Tham chiếu đầy đủ
