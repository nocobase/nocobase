---
title: "Tổng quan FlowEngine"
description: "Hướng dẫn phát triển Plugin FlowEngine của NocoBase: cách dùng cơ bản FlowModel, renderComponent, registerFlow, cấu hình uiSchema, chọn lớp cơ sở."
keywords: "FlowEngine,FlowModel,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# FlowEngine

Trong NocoBase, **FlowEngine (engine luồng)** là engine cốt lõi điều khiển cấu hình trực quan. Block, Field, nút Action trên giao diện NocoBase đều được quản lý thông qua FlowEngine — bao gồm việc render, bảng cấu hình và lưu trữ cấu hình của chúng.

![20260403215904](https://static-docs.nocobase.com/20260403215904.png)

Đối với nhà phát triển Plugin, FlowEngine cung cấp hai khái niệm cốt lõi:

- **FlowModel** — Component model có thể cấu hình, chịu trách nhiệm render UI và quản lý props
- **Flow** — Quy trình cấu hình, định nghĩa bảng cấu hình của component và logic xử lý dữ liệu

Nếu component của bạn cần xuất hiện trong menu "Thêm Block / Field / Action", hoặc cần hỗ trợ người dùng cấu hình trực quan trên giao diện, thì cần dùng FlowModel để bọc. Nếu không cần các năng lực này, dùng component React thông thường là đủ — xem [Component vs FlowModel](../component-vs-flow-model).

## FlowModel là gì

Khác với component React thông thường, FlowModel ngoài việc render UI, còn quản lý nguồn của props, định nghĩa bảng cấu hình và lưu trữ cấu hình. Nói đơn giản: props của component thông thường là cố định, props của FlowModel được sinh động thông qua Flow.

Muốn tìm hiểu sâu kiến trúc tổng thể của FlowEngine, có thể xem [Tài liệu FlowEngine đầy đủ](../../../flow-engine/index.md). Dưới đây sẽ giới thiệu cách dùng từ góc độ nhà phát triển Plugin.

## Ví dụ tối giản

Một FlowModel từ tạo mới đến đăng ký, chia ba bước:

### 1. Kế thừa lớp cơ sở, triển khai renderComponent

```tsx
// models/HelloBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Hello FlowEngine!</h3>
        <p>Đây là một Block tùy chỉnh.</p>
      </div>
    );
  }
}

// define() đặt tên hiển thị trong menu
HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

`renderComponent()` chính là phương thức render của model này, tương tự `render()` của component React. `tExpr()` được dùng để dịch trễ — vì `define()` được thực thi khi module load, lúc đó i18n chưa khởi tạo. Xem chi tiết tại [Năng lực phổ biến của Context → tExpr](../ctx/common-capabilities#texpr).

### 2. Đăng ký trong Plugin

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        // Tải theo nhu cầu, chỉ tải module khi dùng đến lần đầu
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

### 3. Sử dụng trên giao diện

Sau khi đăng ký xong, sau khi khởi động Plugin (việc bật Plugin có thể tham khảo [Tổng quan phát triển Plugin](../../index.md)), tạo trang mới trên giao diện NocoBase, click "Thêm Block" sẽ thấy "Hello block" của bạn.

![20260403221815](https://static-docs.nocobase.com/20260403221815.png)

## Dùng registerFlow để thêm mục cấu hình

Chỉ render thôi là chưa đủ — giá trị cốt lõi của FlowModel nằm ở **khả năng cấu hình**. Thông qua `registerFlow()` có thể thêm bảng cấu hình cho model, cho phép người dùng chỉnh sửa thuộc tính trên giao diện.

Ví dụ một Block hỗ trợ chỉnh sửa nội dung HTML:

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    // Giá trị của this.props đến từ thiết lập của Flow handler
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // Thực thi trước khi render
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema định nghĩa UI của bảng cấu hình
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // Giá trị mặc định
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // Trong handler, thiết lập giá trị từ bảng cấu hình vào props của model
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Vài điểm quan trọng trong đây:

- **`on: 'beforeRender'`** — Biểu thị Flow này được thực thi trước khi render, giá trị từ bảng cấu hình sẽ được ghi vào `this.props` trước khi render
- **`uiSchema`** — Dùng định dạng JSON Schema để định nghĩa UI bảng cấu hình, tham khảo cú pháp tại [UI Schema](../../../flow-engine/ui-schema)
- **`handler(ctx, params)`** — `params` là giá trị người dùng nhập trong bảng cấu hình, thiết lập vào model thông qua `ctx.model.props`
- **`defaultParams`** — Giá trị mặc định của bảng cấu hình

## Cách viết uiSchema phổ biến

`uiSchema` dựa trên JSON Schema, v2 tương thích với cú pháp uiSchema, tuy nhiên ngữ cảnh sử dụng có hạn — chủ yếu được dùng trong bảng cấu hình của Flow để mô tả UI form. Phần lớn việc render component runtime khuyến nghị dùng trực tiếp component Antd, không cần đi qua uiSchema.

Dưới đây liệt kê vài component được dùng phổ biến nhất (tham khảo đầy đủ tại [UI Schema](../../../flow-engine/ui-schema)):

```ts
uiSchema: {
  // Nhập văn bản
  title: {
    type: 'string',
    title: 'Tiêu đề',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  // Văn bản nhiều dòng
  content: {
    type: 'string',
    title: 'Nội dung',
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
  },
  // Chọn thả xuống
  type: {
    type: 'string',
    title: 'Loại',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: 'Chính', value: 'primary' },
      { label: 'Mặc định', value: 'default' },
      { label: 'Đường nét đứt', value: 'dashed' },
    ],
  },
  // Switch
  bordered: {
    type: 'boolean',
    title: 'Hiển thị viền',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  },
}
```

Mỗi field đều được bọc bằng `'x-decorator': 'FormItem'`, như vậy sẽ tự động kèm theo tiêu đề và bố cục.

## Mô tả tham số define()

`FlowModel.define()` dùng để thiết lập metadata của model, kiểm soát cách hiển thị của nó trong menu. Trong phát triển Plugin, `label` là phổ biến nhất, tuy nhiên nó còn hỗ trợ nhiều tham số hơn:

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `label` | `string \| ReactNode` | Tên hiển thị trong menu "Thêm Block / Field / Action", hỗ trợ `tExpr()` dịch trễ |
| `icon` | `ReactNode` | Biểu tượng trong menu |
| `sort` | `number` | Trọng số sắp xếp, số càng nhỏ càng ở trước. Mặc định `0` |
| `hide` | `boolean \| (ctx) => boolean` | Có ẩn trong menu hay không, hỗ trợ phán đoán động |
| `group` | `string` | Định danh nhóm, dùng để phân loại vào nhóm menu cụ thể |
| `children` | `SubModelItem[] \| (ctx) => SubModelItem[]` | Mục submenu, hỗ trợ hàm bất đồng bộ để xây dựng động |
| `toggleable` | `boolean \| (model) => boolean` | Có hỗ trợ hành vi chuyển đổi (duy nhất dưới cùng một parent) |
| `searchable` | `boolean` | Submenu có bật tìm kiếm hay không |

Phần lớn Plugin chỉ cần đặt `label`:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
});
```

Nếu cần kiểm soát sắp xếp hoặc ẩn, có thể thêm `sort` và `hide`:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
  sort: 10,       // Sắp xếp ở phía sau
  hide: (ctx) => !ctx.someCondition,  // Ẩn theo điều kiện
});
```

## Chọn lớp cơ sở FlowModel

NocoBase cung cấp nhiều lớp cơ sở FlowModel, chọn theo loại bạn muốn mở rộng:

| Lớp cơ sở                   | Mục đích                               | Tài liệu chi tiết             |
| ---------------------- | ---------------------------------- | -------------------- |
| `BlockModel`           | Block thông thường                           | [Mở rộng Block](./block)  |
| `DataBlockModel`       | Block cần tự lấy dữ liệu             | [Mở rộng Block](./block)  |
| `CollectionBlockModel` | Gắn bảng dữ liệu, tự động lấy dữ liệu           | [Mở rộng Block](./block)  |
| `TableBlockModel`      | Block bảng đầy đủ, có sẵn cột Field, thanh thao tác, v.v. | [Mở rộng Block](./block)  |
| `FieldModel`           | Component Field                           | [Mở rộng Field](./field)  |
| `ActionModel`          | Nút Action                           | [Mở rộng Action](./action) |

Thông thường, làm Block bảng dùng `TableBlockModel` (phổ biến nhất, dùng được luôn), cần render hoàn toàn tùy chỉnh dùng `CollectionBlockModel` hoặc `BlockModel`, làm Field dùng `FieldModel`, làm nút Action dùng `ActionModel`.

## Liên kết liên quan

- [Mở rộng Block](./block) — Phát triển Block bằng các lớp cơ sở BlockModel
- [Mở rộng Field](./field) — Phát triển Field tùy chỉnh bằng FieldModel
- [Mở rộng Action](./action) — Phát triển nút Action bằng ActionModel
- [Component vs FlowModel](../component-vs-flow-model) — Không chắc dùng cách nào?
- [FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Mô tả tham số đầy đủ và danh sách loại sự kiện của registerFlow
- [Tài liệu FlowEngine đầy đủ](../../../flow-engine/index.md) — Tham chiếu đầy đủ FlowModel, Flow, Context
- [Khởi đầu nhanh FlowEngine](../../../flow-engine/quickstart) — Xây dựng một component nút có thể điều phối từ đầu
- [Tổng quan phát triển Plugin](../../index.md) — Giới thiệu tổng thể về phát triển Plugin
- [UI Schema](../../../flow-engine/ui-schema) — Tham chiếu cú pháp uiSchema
