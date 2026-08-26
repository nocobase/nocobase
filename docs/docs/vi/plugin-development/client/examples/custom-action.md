---
title: "Tạo một nút Action tùy chỉnh"
description: "Thực hành Plugin NocoBase: dùng ActionModel + ActionSceneEnum để tạo nút Action tùy chỉnh, hỗ trợ Action ở mức collection và mức record."
keywords: "Action tùy chỉnh,ActionModel,ActionSceneEnum,nút action,NocoBase"
---

# Tạo một nút Action tùy chỉnh

Trong NocoBase, Action là các nút trong block dùng để kích hoạt logic nghiệp vụ — ví dụ như "Tạo mới", "Chỉnh sửa", "Xóa". Ví dụ này hướng dẫn cách dùng `ActionModel` để tạo nút Action tùy chỉnh, và dùng `ActionSceneEnum` để kiểm soát kịch bản nút xuất hiện.

:::tip Đọc trước

Nên tìm hiểu các nội dung sau trước khi phát triển để mượt mà hơn:

- [Viết Plugin đầu tiên](../../write-your-first-plugin) — Tạo plugin và cấu trúc thư mục
- [Plugin](../plugin) — Entry point và lifecycle `load()` của plugin
- [FlowEngine → Mở rộng Action](../flow-engine/action) — Giới thiệu cơ bản về ActionModel, ActionSceneEnum
- [i18n](../component/i18n) — Cách viết file dịch và cách dùng `tExpr()` để dịch trễ

:::

## Kết quả cuối cùng

Chúng ta sẽ tạo ba nút Action tùy chỉnh, tương ứng với ba kịch bản Action:

- **Action ở mức collection** (`collection`) — Xuất hiện trong action bar phía trên block, ví dụ cạnh nút "Tạo mới"
- **Action ở mức record** (`record`) — Xuất hiện trong cột action của mỗi hàng trong table, ví dụ cạnh nút "Chỉnh sửa", "Xóa"
- **Cả hai đều áp dụng** (`both`) — Xuất hiện ở cả hai kịch bản

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

Toàn bộ source code xem tại [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action). Nếu bạn muốn chạy thử trực tiếp ở local:

```bash
yarn pm enable @nocobase-example/plugin-simple-action
```

Sau đây ta sẽ xây dựng plugin này từ đầu, từng bước một.

## Bước 1: Tạo khung plugin

Tại thư mục gốc của repo, chạy:

```bash
yarn pm create @my-project/plugin-simple-action
```

Chi tiết xem tại [Viết Plugin đầu tiên](../../write-your-first-plugin).

## Bước 2: Tạo Action Model

Mỗi Action cần khai báo kịch bản xuất hiện qua thuộc tính `static scene`:

| Kịch bản | Giá trị | Mô tả |
| -------- | ------- | ----- |
| collection | `ActionSceneEnum.collection` | Áp dụng cho collection, ví dụ nút "Tạo mới" |
| record | `ActionSceneEnum.record` | Áp dụng cho từng record, ví dụ nút "Chỉnh sửa", "Xóa" |
| both | `ActionSceneEnum.both` | Cả hai kịch bản đều dùng được |

### Action ở mức collection

Tạo file mới `src/client-v2/models/SimpleCollectionActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});

// Lắng nghe sự kiện click qua registerFlow, dùng ctx.message để phản hồi cho người dùng
SimpleCollectionActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple collection action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Collection action clicked'));
      },
    },
  },
});
```

### Action ở mức record

Tạo file mới `src/client-v2/models/SimpleRecordActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});

// Action ở mức record có thể lấy dữ liệu và index của hàng hiện tại qua ctx.model.context
SimpleRecordActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple record action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        const id = record?.id;
        ctx.message.info(ctx.t('Record action clicked, record ID: {{id}}, row index: {{index}}', { id, index }));
      },
    },
  },
});
```

### Cả hai kịch bản đều áp dụng

Tạo file mới `src/client-v2/models/SimpleBothActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});

SimpleBothActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple both action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.info(ctx.t('Both action clicked'));
      },
    },
  },
});
```

Cấu trúc của ba cách viết là giống nhau — khác biệt chỉ ở giá trị `static scene` và text của nút. Mỗi nút đều lắng nghe sự kiện click qua `registerFlow({ on: 'click' })`, dùng `ctx.message` để hiển thị thông báo, để người dùng có thể thấy nút thực sự có hiệu lực.

## Bước 3: Thêm file đa ngôn ngữ

Chỉnh sửa file dịch trong `src/locale/` của plugin:

```json
// src/locale/zh-CN.json
{
  "Simple collection action": "简单数据表操作",
  "Simple record action": "简单记录操作",
  "Simple both action": "简单通用操作",
  "Collection action clicked": "数据表操作被点击了",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "记录操作被点击了，记录 ID：{{id}}，行索引：{{index}}",
  "Both action clicked": "通用操作被点击了"
}
```

```json
// src/locale/en-US.json
{
  "Simple collection action": "Simple collection action",
  "Simple record action": "Simple record action",
  "Simple both action": "Simple both action",
  "Collection action clicked": "Collection action clicked",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "Record action clicked, record ID: {{id}}, row index: {{index}}",
  "Both action clicked": "Both action clicked"
}
```

:::warning Lưu ý

Khi thêm file ngôn ngữ lần đầu, bạn cần khởi động lại ứng dụng để có hiệu lực.

:::

Về cách viết file dịch và các cách dùng khác của `tExpr()`, xem chi tiết tại [i18n](../component/i18n).

## Bước 4: Đăng ký trong Plugin

Chỉnh sửa `src/client-v2/plugin.tsx`, dùng `registerModelLoaders` để load theo nhu cầu:

```ts
// src/client-v2/plugin.tsx
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

export default PluginSimpleActionClient;
```

## Bước 5: Bật plugin

```bash
yarn pm enable @my-project/plugin-simple-action
```

Sau khi bật, trong "Cấu hình action" của block table bạn có thể thêm các nút Action tùy chỉnh này.

## Source code đầy đủ

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — Ví dụ đầy đủ về ba kịch bản Action

## Tóm tắt

Các khả năng được sử dụng trong ví dụ này:

| Khả năng | Cách dùng | Tài liệu |
| -------- | --------- | -------- |
| Nút Action | `ActionModel` + `static scene` | [FlowEngine → Mở rộng Action](../flow-engine/action) |
| Kịch bản Action | `ActionSceneEnum.collection / record / both / all` | [FlowEngine → Mở rộng Action](../flow-engine/action) |
| Đăng ký menu | `define({ label })` | [Tổng quan FlowEngine](../flow-engine/index.md) |
| Đăng ký Model | `this.flowEngine.registerModelLoaders()` | [Plugin](../plugin) |
| Dịch trễ | `tExpr()` | [i18n](../component/i18n) |

## Liên kết liên quan

- [Viết Plugin đầu tiên](../../write-your-first-plugin) — Tạo khung plugin từ đầu
- [Tổng quan FlowEngine](../flow-engine/index.md) — Cách dùng cơ bản của FlowModel
- [FlowEngine → Mở rộng Action](../flow-engine/action) — ActionModel, ActionSceneEnum
- [FlowEngine → Mở rộng Block](../flow-engine/block) — Block tùy chỉnh
- [FlowEngine → Mở rộng Field](../flow-engine/field) — Field component tùy chỉnh
- [Component vs FlowModel](../component-vs-flow-model) — Khi nào nên dùng FlowModel
- [Plugin](../plugin) — Entry point và lifecycle load() của plugin
- [i18n](../component/i18n) — Cách viết file dịch và cách dùng tExpr
- [Tài liệu đầy đủ FlowEngine](../../../flow-engine/index.md) — Tham chiếu đầy đủ về FlowModel, Flow, Context
