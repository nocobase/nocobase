---
title: "Mở rộng Action"
description: "Phát triển mở rộng Action trong NocoBase: lớp cơ sở ActionModel, ngữ cảnh ActionSceneEnum, nút Action tùy chỉnh."
keywords: "Mở rộng Action,Action,ActionModel,ActionSceneEnum,Nút Action,NocoBase"
---

# Mở rộng Action

Trong NocoBase, **Action** là nút bấm trong Block, dùng để kích hoạt logic nghiệp vụ — ví dụ "Tạo mới", "Chỉnh sửa", "Xóa", v.v. Bằng cách kế thừa lớp cơ sở `ActionModel`, bạn có thể thêm nút Action tùy chỉnh.

## Ngữ cảnh Action

Mỗi Action cần khai báo ngữ cảnh nó xuất hiện, chỉ định thông qua thuộc tính `static scene`:

| Ngữ cảnh       | Giá trị                           | Mô tả                                       |
| ---------- | ---------------------------- | ------------------------------------------ |
| collection | `ActionSceneEnum.collection` | Tác động lên bảng dữ liệu, ví dụ nút "Tạo mới"               |
| record     | `ActionSceneEnum.record`     | Tác động lên một bản ghi, ví dụ nút "Chỉnh sửa", "Xóa"     |
| both       | `ActionSceneEnum.both`       | Cả hai ngữ cảnh đều dùng được                             |
| all        | `ActionSceneEnum.all`        | Tất cả các ngữ cảnh đều dùng được (bao gồm các context đặc biệt như dialog, v.v.) |

## Ví dụ

### Action cấp bảng dữ liệu

Tác động lên toàn bộ bảng dữ liệu, xuất hiện trong thanh thao tác phía trên Block:

```tsx
// models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});
```

### Action cấp bản ghi

Tác động lên một bản ghi, xuất hiện trong cột thao tác của mỗi hàng trong bảng:

```tsx
// models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});
```

### Áp dụng cả hai ngữ cảnh

Nếu Action không phân biệt ngữ cảnh, dùng `ActionSceneEnum.both`:

```tsx
// models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});
```

Cấu trúc của ba cách viết là giống nhau — sự khác nhau chỉ nằm ở giá trị của `static scene` và văn bản nút trong `defaultProps`.

## Đăng ký Action

Trong `load()` của Plugin, dùng `registerModelLoaders` để đăng ký tải theo nhu cầu:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleActionClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleCollectionActionModel: {
        loader: () => import('./models/SimpleCollectionActionModel'),
      },
      SimpleRecordActionModel: {
        loader: () => import('./models/SimpleRecordActionModel'),
      },
      SimpleBothActionModel: {
        loader: () => import('./models/SimpleBothActionModel'),
      },
    });
  }
}
```

Sau khi đăng ký xong, trong "Cấu hình thao tác" của Block có thể thêm các nút Action tùy chỉnh của bạn.

## Mã nguồn đầy đủ

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — Ví dụ đầy đủ ba ngữ cảnh Action

## Liên kết liên quan

- [Thực hành Plugin: Tạo nút Action tùy chỉnh](../examples/custom-action) — Xây dựng nút Action ba ngữ cảnh từ đầu
- [Thực hành Plugin: Tạo plugin quản lý dữ liệu kết hợp frontend-backend](../examples/fullstack-plugin) — Ứng dụng thực tế của Action tùy chỉnh + ctx.viewer.dialog trong Plugin hoàn chỉnh
- [Tổng quan FlowEngine](../flow-engine/index.md) — Cách dùng cơ bản FlowModel
- [Mở rộng Block](./block) — Block tùy chỉnh
- [Mở rộng Field](./field) — Component Field tùy chỉnh
- [FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — Tham số đầy đủ và loại sự kiện của registerFlow
- [Tài liệu FlowEngine đầy đủ](../../../flow-engine/index.md) — Tham chiếu đầy đủ
