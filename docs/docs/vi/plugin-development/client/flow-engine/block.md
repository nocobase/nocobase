---
title: "Mở rộng Block"
description: "Phát triển mở rộng Block trong NocoBase: BlockModel, DataBlockModel, CollectionBlockModel, TableBlockModel — các lớp cơ sở và cách đăng ký."
keywords: "Mở rộng Block,Block,BlockModel,DataBlockModel,CollectionBlockModel,TableBlockModel,renderComponent,NocoBase"
---

# Mở rộng Block

Trong NocoBase, **Block** là khu vực nội dung trên trang — ví dụ bảng, form, biểu đồ, chi tiết, v.v. Bằng cách kế thừa các lớp cơ sở thuộc dòng BlockModel, bạn có thể tạo Block tùy chỉnh và đăng ký vào menu "Thêm Block".

## Chọn lớp cơ sở

NocoBase cung cấp ba lớp cơ sở Block, chọn theo nhu cầu dữ liệu của bạn:

| Lớp cơ sở                   | Quan hệ kế thừa                              | Tình huống áp dụng                                   |
| ---------------------- | ------------------------------------- | ------------------------------------------ |
| `BlockModel`           | Block cơ bản nhất                          | Block hiển thị không cần nguồn dữ liệu                     |
| `DataBlockModel`       | Kế thừa `BlockModel`                     | Cần dữ liệu nhưng không gắn bảng dữ liệu NocoBase           |
| `CollectionBlockModel` | Kế thừa `DataBlockModel`                 | Gắn bảng dữ liệu NocoBase, tự động lấy dữ liệu         |
| `TableBlockModel`      | Kế thừa `CollectionBlockModel`           | Block bảng đầy đủ, có sẵn cột Field, thanh thao tác, phân trang, v.v. |

Chuỗi kế thừa là: `BlockModel` → `DataBlockModel` → `CollectionBlockModel` → `TableBlockModel`.

Thông thường, nếu bạn muốn một Block bảng dùng được luôn, dùng trực tiếp `TableBlockModel` — nó có sẵn cột Field, thanh thao tác, phân trang, sắp xếp và các năng lực đầy đủ khác, là lớp cơ sở được dùng nhiều nhất. Nếu bạn cần render hoàn toàn tùy chỉnh (ví dụ dùng danh sách card, timeline, v.v.), dùng `CollectionBlockModel` để tự viết `renderComponent`. Nếu chỉ hiển thị nội dung tĩnh hoặc UI tùy chỉnh, dùng `BlockModel` là đủ.

Vị trí của `DataBlockModel` khá đặc biệt — bản thân nó không thêm thuộc tính hay phương thức mới nào, thân class trống. Vai trò của nó là **định danh phân loại**: Block kế thừa `DataBlockModel` sẽ được nhóm vào menu nhóm "Block dữ liệu" trên UI. Nếu Block của bạn cần tự quản lý logic lấy dữ liệu (không đi theo gắn Collection chuẩn của NocoBase), có thể kế thừa `DataBlockModel`. Ví dụ `ChartBlockModel` của plugin biểu đồ là như vậy — nó dùng `ChartResource` tùy chỉnh để lấy dữ liệu, không cần gắn bảng dữ liệu chuẩn. Trong phần lớn tình huống bạn không cần dùng trực tiếp `DataBlockModel`, dùng `CollectionBlockModel` hoặc `TableBlockModel` là đủ.

## Ví dụ BlockModel

Một Block đơn giản nhất — hỗ trợ chỉnh sửa nội dung HTML:

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Ví dụ này bao trùm ba bước phát triển Block:

1. **`renderComponent()`** — Render UI Block, đọc thuộc tính thông qua `this.props`
2. **`define()`** — Đặt tên hiển thị của Block trong menu "Thêm Block"
3. **`registerFlow()`** — Thêm bảng cấu hình trực quan, người dùng có thể chỉnh sửa nội dung HTML trên giao diện

## Ví dụ CollectionBlockModel

Nếu Block cần gắn bảng dữ liệu NocoBase, dùng `CollectionBlockModel`. Nó sẽ tự động xử lý lấy dữ liệu:

```tsx
// models/ManyRecordBlockModel.tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '@nocobase/flow-engine';

export class ManyRecordBlockModel extends CollectionBlockModel {
  // Khai báo đây là Block của nhiều bản ghi
  static scene = BlockSceneEnum.many;

  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    return (
      <div>
        <h3>Block bảng dữ liệu</h3>
        {/* resource.getData() lấy dữ liệu của bảng dữ liệu */}
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records'),
});
```

So với `BlockModel`, `CollectionBlockModel` có thêm những thứ sau:

- **`static scene`** — Khai báo ngữ cảnh Block. Giá trị phổ biến: `BlockSceneEnum.many` (danh sách nhiều bản ghi), `BlockSceneEnum.one` (chi tiết/form một bản ghi). Enum đầy đủ còn bao gồm `new`, `select`, `filter`, `subForm`, `bulkEditForm`, v.v.
- **`createResource()`** — Tạo tài nguyên dữ liệu, `MultiRecordResource` được dùng để lấy nhiều bản ghi
- **`this.resource.getData()`** — Lấy dữ liệu của bảng dữ liệu

## Ví dụ TableBlockModel

`TableBlockModel` kế thừa từ `CollectionBlockModel`, là Block bảng đầy đủ tích hợp sẵn của NocoBase — có sẵn cột Field, thanh thao tác, phân trang, sắp xếp và các năng lực khác. Khi người dùng chọn "Table" trong "Thêm Block" chính là dùng nó.

Thông thường, nếu `TableBlockModel` tích hợp sẵn đã đáp ứng nhu cầu, người dùng thêm trực tiếp trên giao diện là được, nhà phát triển không cần làm gì. Chỉ khi bạn cần **tùy chỉnh trên cơ sở TableBlockModel**, mới cần kế thừa nó — ví dụ:

- Ghi đè `customModelClasses` để thay thế model nhóm thao tác hoặc cột Field tích hợp sẵn
- Thông qua `filterCollection` để giới hạn chỉ dùng được cho bảng dữ liệu cụ thể
- Đăng ký Flow bổ sung để thêm mục cấu hình tùy chỉnh

```tsx
// Ví dụ: Block bảng giới hạn chỉ dùng được cho bảng dữ liệu todoItems
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

Ví dụ tùy chỉnh `TableBlockModel` đầy đủ xem tại [Tạo plugin quản lý dữ liệu kết hợp frontend-backend](../examples/fullstack-plugin).

## Đăng ký Block

Đăng ký trong `load()` của Plugin:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        loader: () => import('./models/SimpleBlockModel'),
      },
      ManyRecordBlockModel: {
        loader: () => import('./models/ManyRecordBlockModel'),
      },
    });
  }
}
```

Sau khi đăng ký xong, click "Thêm Block" trên giao diện NocoBase sẽ thấy Block tùy chỉnh của bạn.

## Mã nguồn đầy đủ

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — Ví dụ BlockModel
- [@nocobase-example/plugin-collection-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-collection-block) — Ví dụ CollectionBlockModel

## Liên kết liên quan

- [Thực hành Plugin: Tạo Block hiển thị tùy chỉnh](../examples/custom-block) — Xây dựng một Block BlockModel có thể cấu hình từ đầu
- [Thực hành Plugin: Tạo plugin quản lý dữ liệu kết hợp frontend-backend](../examples/fullstack-plugin) — Ví dụ đầy đủ TableBlockModel + Field tùy chỉnh + Action tùy chỉnh
- [Tổng quan FlowEngine](../flow-engine/index.md) — Cách dùng cơ bản FlowModel và registerFlow
- [Mở rộng Field](./field) — Component Field tùy chỉnh
- [Mở rộng Action](./action) — Nút Action tùy chỉnh
- [Bảng tra cứu Resource API](../../../api/flow-engine/resource.md) — Chữ ký phương thức đầy đủ của MultiRecordResource / SingleRecordResource
- [FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Tham số đầy đủ và loại sự kiện của registerFlow
- [Tài liệu FlowEngine đầy đủ](../../../flow-engine/index.md) — Tham chiếu đầy đủ
