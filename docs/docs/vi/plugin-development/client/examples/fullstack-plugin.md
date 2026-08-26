---
title: "Tạo Plugin quản lý dữ liệu phối hợp client-server"
description: "Thực hành Plugin NocoBase: Server định nghĩa collection + Client dùng TableBlockModel để hiển thị dữ liệu + Field và Action tùy chỉnh, một plugin phối hợp client-server hoàn chỉnh."
keywords: "phối hợp client-server,TableBlockModel,defineCollection,ActionModel,ClickableFieldModel,ctx.viewer,NocoBase"
---

# Tạo Plugin quản lý dữ liệu phối hợp client-server

Các ví dụ trước hoặc thuần client (block, field, action), hoặc client + API đơn giản (trang cài đặt). Ví dụ này hướng dẫn một kịch bản hoàn chỉnh hơn — phía server định nghĩa collection, phía client kế thừa `TableBlockModel` để có đầy đủ khả năng table, kết hợp Field component tùy chỉnh và nút Action tùy chỉnh, tạo thành một plugin quản lý dữ liệu có CRUD.

Ví dụ này kết hợp các kiến thức về Block, Field, Action đã học ở các phần trước, thể hiện luồng phát triển đầy đủ của một Plugin.

:::tip Đọc trước

Nên tìm hiểu các nội dung sau trước khi phát triển để mượt mà hơn:

- [Viết Plugin đầu tiên](../../write-your-first-plugin) — Tạo plugin và cấu trúc thư mục
- [Plugin](../plugin) — Entry point và lifecycle `load()` của plugin
- [FlowEngine → Mở rộng Block](../flow-engine/block) — BlockModel, CollectionBlockModel, TableBlockModel
- [FlowEngine → Mở rộng Field](../flow-engine/field) — ClickableFieldModel, bindModelToInterface
- [FlowEngine → Mở rộng Action](../flow-engine/action) — ActionModel, ActionSceneEnum
- [i18n](../component/i18n) — Cách viết file dịch và cách dùng `tExpr()`
- [Tổng quan phát triển phía server](../../server) — Cơ bản về plugin phía server

:::

## Kết quả cuối cùng

Chúng ta sẽ tạo một plugin quản lý dữ liệu "Việc cần làm", bao gồm các khả năng:

- Phía server định nghĩa một collection `todoItems`, plugin sẽ tự động ghi dữ liệu mẫu khi cài đặt
- Phía client kế thừa `TableBlockModel`, có ngay block table dùng được luôn (cột field, phân trang, action bar, v.v.)
- Field component tùy chỉnh — render field priority bằng Tag màu
- Nút Action tùy chỉnh — nút "Tạo việc mới", click sẽ mở dialog điền form để tạo record

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_16.32.52.mp4" type="video/mp4">
</video>

Toàn bộ source code xem tại [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource). Nếu bạn muốn chạy thử trực tiếp ở local:

```bash
yarn pm enable @nocobase-example/plugin-custom-table-block-resource
```

Sau đây ta sẽ xây dựng plugin này từ đầu, từng bước một.

## Bước 1: Tạo khung plugin

Tại thư mục gốc của repo, chạy:

```bash
yarn pm create @my-project/plugin-custom-table-block-resource
```

Chi tiết xem tại [Viết Plugin đầu tiên](../../write-your-first-plugin).

## Bước 2: Định nghĩa collection (phía server)

Tạo file mới `src/server/collections/todoItems.ts`. NocoBase sẽ tự động load các collection definition trong thư mục này:

```ts
// src/server/collections/todoItems.ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'todoItems',
  title: 'Todo Items',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    {
      name: 'completed',
      type: 'boolean',
      title: 'Completed',
      defaultValue: false,
    },
    {
      name: 'priority',
      type: 'string',
      title: 'Priority',
      defaultValue: 'medium',
    },
  ],
});
```

Khác với ví dụ trang cài đặt, ở đây không cần đăng ký resource thủ công — NocoBase sẽ tự động sinh các API CRUD chuẩn (`list`, `get`, `create`, `update`, `destroy`) cho mỗi collection.

## Bước 3: Cấu hình quyền và dữ liệu mẫu (phía server)

Chỉnh sửa `src/server/plugin.ts`, cấu hình quyền ACL trong `load()` và chèn dữ liệu mẫu trong `install()`:

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginDataBlockServer extends Plugin {
  async load() {
    // Người dùng đã đăng nhập có thể CRUD trên todoItems
    this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
  }

  async install() {
    // Khi plugin được cài lần đầu, chèn vài dữ liệu mẫu
    const repo = this.db.getRepository('todoItems');
    const count = await repo.count();
    if (count === 0) {
      await repo.createMany({
        records: [
          { title: 'Learn NocoBase plugin development', completed: true, priority: 'high' },
          { title: 'Build a custom block', completed: false, priority: 'high' },
          { title: 'Write documentation', completed: false, priority: 'medium' },
          { title: 'Add unit tests', completed: false, priority: 'low' },
        ],
      });
    }
  }
}

export default PluginDataBlockServer;
```

Một số điểm chính:

- **`acl.allow()`** — `['list', 'get', 'create', 'update', 'destroy']` mở quyền CRUD đầy đủ, `'loggedIn'` nghĩa là người dùng đã đăng nhập có thể truy cập
- **`install()`** — Chỉ chạy khi plugin được cài lần đầu, phù hợp để ghi dữ liệu khởi tạo
- **`this.db.getRepository()`** — Lấy đối tượng thao tác dữ liệu qua tên collection
- Không cần `resourceManager.define()` — NocoBase sẽ tự động sinh API CRUD cho collection

## Bước 4: Tạo Block Model (phía client)

Tạo file mới `src/client-v2/models/TodoBlockModel.tsx`. Kế thừa `TableBlockModel` cho phép có ngay đầy đủ khả năng của block table — cột field, action bar, phân trang, sắp xếp, v.v., không cần tự viết `renderComponent`.

![20260408164204](https://static-docs.nocobase.com/20260408164204.png)

:::tip Mẹo

Trong phát triển plugin thực tế, nếu bạn không cần tùy chỉnh `TableBlockModel`, bạn thực sự không cần kế thừa và đăng ký block này, chỉ cần để người dùng chọn "Table" khi thêm block là được. Bài viết này viết một `TodoBlockModel` kế thừa `TableBlockModel` chỉ để minh họa luồng định nghĩa và đăng ký Block model. `TableBlockModel` sẽ xử lý tất cả phần còn lại (cột field, action bar, phân trang, v.v.).

:::

```tsx
// src/client-v2/models/TodoBlockModel.tsx
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  // Giới hạn chỉ áp dụng cho collection todoItems
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

Qua `filterCollection`, ta giới hạn block này chỉ áp dụng cho collection `todoItems` — khi người dùng thêm "Todo block", trong danh sách chọn collection sẽ chỉ hiện `todoItems`, không hiện các collection không liên quan khác.

![20260408170026](https://static-docs.nocobase.com/20260408170026.png)

## Bước 5: Tạo Field component tùy chỉnh (phía client)

Tạo file mới `src/client-v2/models/PriorityFieldModel.tsx`. Render field priority bằng Tag màu, trực quan hơn nhiều so với plain text:

![20260408163645](https://static-docs.nocobase.com/20260408163645.png)

```tsx
// src/client-v2/models/PriorityFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { Tag } from 'antd';
import { tExpr } from '../locale';

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

export class PriorityFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    if (!value) return <span>-</span>;
    return <Tag color={priorityColors[value] || 'default'}>{value}</Tag>;
  }
}

PriorityFieldModel.define({
  label: tExpr('Priority tag'),
});

// Gắn vào field interface kiểu input (single-line text)
DisplayItemModel.bindModelToInterface('PriorityFieldModel', ['input']);
```

Sau khi đăng ký, trong cấu hình cột priority của table, dropdown "Field component" sẽ có thể chuyển sang "Priority tag".

## Bước 6: Tạo nút Action tùy chỉnh (phía client)

Tạo file mới `src/client-v2/models/NewTodoActionModel.tsx`. Sau khi click nút "Tạo việc mới", dùng `ctx.viewer.dialog()` để mở dialog, điền form xong sẽ tạo record:

![20260408163810](https://static-docs.nocobase.com/20260408163810.png)

```tsx
// src/client-v2/models/NewTodoActionModel.tsx
import React from 'react';
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource, observable, observer } from '@nocobase/flow-engine';
import { Button, Form, Input, Select, Space, Switch } from 'antd';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

// Dùng observable để quản lý trạng thái loading, thay thế useState
const formState = observable({
  loading: false,
});

// Component form trong dialog, bọc bằng observer để phản ứng với thay đổi của observable
const NewTodoForm = observer(function NewTodoForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    formState.loading = true;
    try {
      await onSubmit(values);
    } finally {
      formState.loading = false;
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ priority: 'medium', completed: false }}>
      <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter title' }]}>
        <Input placeholder="Enter todo title" />
      </Form.Item>
      <Form.Item label="Priority" name="priority">
        <Select
          options={[
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' },
          ]}
        />
      </Form.Item>
      <Form.Item label="Completed" name="completed" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={formState.loading}>
            OK
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
});

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    type: 'primary',
    children: tExpr('New todo'),
  };
}

NewTodoActionModel.define({
  label: tExpr('New todo'),
});

NewTodoActionModel.registerFlow({
  key: 'newTodoFlow',
  title: tExpr('New todo'),
  on: 'click', // Lắng nghe sự kiện click của nút
  steps: {
    openForm: {
      async handler(ctx) {
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        // Dùng ctx.viewer.dialog để mở dialog
        ctx.viewer.dialog({
          content: (view) => (
            <NewTodoForm
              onSubmit={async (values) => {
                await resource.create(values);
                ctx.message.success(ctx.t('Created successfully'));
                view.close();
              }}
              onCancel={() => view.close()}
            />
          ),
        });
      },
    },
  },
});
```

Một số điểm chính:

- **`ActionSceneEnum.collection`** — Nút xuất hiện trong action bar phía trên block
- **`on: 'click'`** — Lắng nghe sự kiện `click` của nút qua `registerFlow`
- **`ctx.viewer.dialog()`** — Khả năng dialog tích hợp sẵn của NocoBase, `content` nhận một function, tham số `view` có thể gọi `view.close()` để đóng dialog
- **`resource.create(values)`** — Gọi API create của collection để tạo record, sau khi tạo xong table sẽ tự động refresh
- **`observable` + `observer`** — Dùng quản lý trạng thái phản ứng của flow-engine để thay thế `useState`, component sẽ tự động phản ứng với thay đổi của `formState.loading`

## Bước 7: Thêm file đa ngôn ngữ

Chỉnh sửa file dịch trong `src/locale/` của plugin:

```json
// src/locale/zh-CN.json
{
  "Todo block": "待办事项区块",
  "Priority tag": "优先级标签",
  "New todo": "新建待办",
  "Todo form": "待办表单",
  "Title": "标题",
  "Priority": "优先级",
  "Completed": "已完成",
  "Created successfully": "创建成功"
}
```

```json
// src/locale/en-US.json
{
  "Todo block": "Todo block",
  "Priority tag": "Priority tag",
  "New todo": "New todo",
  "Todo form": "Todo form",
  "Title": "Title",
  "Priority": "Priority",
  "Completed": "Completed",
  "Created successfully": "Created successfully"
}
```

:::warning Lưu ý

Khi thêm file ngôn ngữ lần đầu, bạn cần khởi động lại ứng dụng để có hiệu lực.

:::

Về cách viết file dịch và các cách dùng khác của `tExpr()`, xem chi tiết tại [i18n](../component/i18n).

## Bước 8: Đăng ký trong Plugin (phía client)

Chỉnh sửa `src/client-v2/plugin.tsx`. Cần làm hai việc: đăng ký các Model, và đăng ký `todoItems` vào data source phía client.

:::warning Lưu ý

Đăng ký collection thủ công qua `addCollection` trong code plugin là cách làm **hiếm gặp**, ở đây chỉ để minh họa luồng phối hợp client-server đầy đủ. Trong dự án thực tế, collection thường được người dùng tạo và cấu hình trên giao diện NocoBase, hoặc quản lý qua API / MCP, không cần đăng ký rõ ràng trong code phía client của plugin.

:::

Collection được định nghĩa qua `defineCollection` là collection nội bộ của server, mặc định không xuất hiện trong danh sách chọn collection của block. Sau khi đăng ký thủ công qua `addCollection`, người dùng sẽ chọn được `todoItems` khi thêm block.

![20260408164023](https://static-docs.nocobase.com/20260408164023.png)

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

const todoItemsCollection = {
  name: 'todoItems',
  title: 'Todo Items',
  // filterTargetKey bắt buộc phải có, nếu không collection sẽ không xuất hiện trong danh sách chọn collection của block
  filterTargetKey: 'id',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'id',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Title', 'x-component': 'Input' },
    },
    {
      type: 'boolean',
      name: 'completed',
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: 'Completed', 'x-component': 'Checkbox' },
    },
    {
      type: 'string',
      name: 'priority',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Priority', 'x-component': 'Input' },
    },
  ],
};

export class PluginCustomTableBlockResourceClientV2 extends Plugin {
  async load() {
    // Đăng ký Block, Field, Action model
    this.flowEngine.registerModelLoaders({
      TodoBlockModel: {
        loader: () => import('./models/TodoBlockModel'),
      },
      PriorityFieldModel: {
        loader: () => import('./models/PriorityFieldModel'),
      },
      NewTodoActionModel: {
        loader: () => import('./models/NewTodoActionModel'),
      },
    });

    // Register todoItems to the client-side data source.
    // Must listen to 'dataSource:loaded' event because ensureLoaded() runs after load(),
    // and it calls setCollections() which clears all collections before re-setting from server.
    // Re-register in the event callback to ensure addCollection survives reload.
    const addTodoCollection = () => {
      const mainDS = this.flowEngine.dataSourceManager.getDataSource('main');
      if (mainDS && !mainDS.getCollection('todoItems')) {
        mainDS.addCollection(todoItemsCollection);
      }
    };

    this.app.eventBus.addEventListener('dataSource:loaded', (event: Event) => {
      if ((event as CustomEvent).detail?.dataSourceKey === 'main') {
        addTodoCollection();
      }
    });
  }
}

export default PluginCustomTableBlockResourceClientV2;
```

Một số điểm chính:

- **`registerModelLoaders`** — Load và đăng ký theo nhu cầu cho ba model: Block, Field, Action
- **`this.app.eventBus`** — Event bus cấp ứng dụng, dùng để lắng nghe các sự kiện lifecycle
- **Sự kiện `dataSource:loaded`** — Trigger sau khi data source load xong. Bắt buộc phải gọi `addCollection` trong callback của sự kiện này, vì `ensureLoaded()` sẽ chạy sau `load()`, và nó sẽ clear toàn bộ rồi set lại các collection — nếu gọi `addCollection` trực tiếp trong `load()` sẽ bị ghi đè
- **`addCollection()`** — Đăng ký collection vào data source phía client. Field cần kèm các thuộc tính `interface` và `uiSchema`, để NocoBase biết cách render
- **`filterTargetKey: 'id'`** — Bắt buộc phải có, chỉ định field dùng để định danh duy nhất cho record (thường là primary key). Nếu không đặt, collection sẽ không xuất hiện trong danh sách chọn collection của block
- `defineCollection` phía server chịu trách nhiệm tạo bảng vật lý và mapping ORM, `addCollection` phía client chịu trách nhiệm cho UI biết về sự tồn tại của collection — cả hai phối hợp mới hoàn thành việc liên kết client-server

## Bước 9: Bật plugin

```bash
yarn pm enable @my-project/plugin-custom-table-block-resource
```

Sau khi bật:

1. Tạo trang mới, click "Thêm block", chọn "Todo block", bind với collection `todoItems`
2. Table sẽ tự động load dữ liệu, hiển thị cột field, phân trang, v.v.
3. Trong "Cấu hình action", thêm nút "New todo", click sẽ mở dialog điền form để tạo record
4. Trong "Field component" của cột priority, chuyển sang "Priority tag", priority sẽ được hiển thị bằng Tag màu

<!-- Cần một ảnh chụp đầy đủ chức năng sau khi bật -->

## Source code đầy đủ

- [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource) — Ví dụ đầy đủ về plugin quản lý dữ liệu phối hợp client-server

## Tóm tắt

Các khả năng được sử dụng trong ví dụ này:

| Khả năng | Cách dùng | Tài liệu |
| -------- | --------- | -------- |
| Định nghĩa collection | `defineCollection()` | [Server → Collections](../../server/collections) |
| Quyền | `acl.allow()` | [Server → ACL](../../server/acl) |
| Dữ liệu khởi tạo | `install()` + `repo.createMany()` | [Server → Plugin](../../server/plugin) |
| Block table | `TableBlockModel` | [FlowEngine → Mở rộng Block](../flow-engine/block) |
| Đăng ký collection phía client | `addCollection()` + `eventBus` + `filterTargetKey` | [Plugin](../plugin) |
| Field tùy chỉnh | `ClickableFieldModel` + `bindModelToInterface` | [FlowEngine → Mở rộng Field](../flow-engine/field) |
| Action tùy chỉnh | `ActionModel` + `registerFlow({ on: 'click' })` | [FlowEngine → Mở rộng Action](../flow-engine/action) |
| Dialog | `ctx.viewer.dialog()` | [Context → Khả năng thường dùng](../ctx/common-capabilities) |
| Trạng thái phản ứng | `observable` + `observer` | [Phát triển Component](../component/index.md) |
| Đăng ký Model | `this.flowEngine.registerModelLoaders()` | [Plugin](../plugin) |
| Dịch trễ | `tExpr()` | [i18n](../component/i18n) |

## Liên kết liên quan

- [Viết Plugin đầu tiên](../../write-your-first-plugin) — Tạo khung plugin từ đầu
- [Tổng quan FlowEngine](../flow-engine/index.md) — Cách dùng cơ bản của FlowModel và registerFlow
- [FlowEngine → Mở rộng Block](../flow-engine/block) — BlockModel, TableBlockModel
- [FlowEngine → Mở rộng Field](../flow-engine/field) — ClickableFieldModel, bindModelToInterface
- [FlowEngine → Mở rộng Action](../flow-engine/action) — ActionModel, ActionSceneEnum
- [Tạo một Block hiển thị tùy chỉnh](./custom-block) — Ví dụ cơ bản về BlockModel
- [Tạo một Field component tùy chỉnh](./custom-field) — Ví dụ cơ bản về FieldModel
- [Tạo một nút Action tùy chỉnh](./custom-action) — Ví dụ cơ bản về ActionModel
- [Tổng quan phát triển phía server](../../server) — Cơ bản về plugin phía server
- [Server → Collections](../../server/collections) — defineCollection và addCollection
- [Tham khảo nhanh Resource API](../../../api/flow-engine/resource.md) — Chữ ký method đầy đủ của MultiRecordResource / SingleRecordResource
- [Plugin](../plugin) — Entry point và lifecycle load() của plugin
- [i18n](../component/i18n) — Cách viết file dịch và cách dùng tExpr
- [Server → ACL](../../server/acl) — Cấu hình quyền
- [Server → Plugin](../../server/plugin) — Lifecycle plugin phía server
- [Context → Khả năng thường dùng](../ctx/common-capabilities) — ctx.viewer, ctx.message, v.v.
- [Phát triển Component](../component/index.md) — Cách dùng các component như Antd Form
- [Tài liệu đầy đủ FlowEngine](../../../flow-engine/index.md) — Tham chiếu đầy đủ về FlowModel, Flow, Context
