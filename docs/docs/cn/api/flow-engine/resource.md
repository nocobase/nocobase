---
title: "Resource API"
description: "NocoBase FlowEngine Resource API 参考：MultiRecordResource 和 SingleRecordResource 的完整方法签名、参数格式、filter 语法。"
keywords: "Resource,MultiRecordResource,SingleRecordResource,FlowResource,CRUD,filter,NocoBase"
---

# Resource API

NocoBase FlowEngine 提供了两个 Resource 类来处理前端的数据操作——`MultiRecordResource` 用于列表/表格（多条记录），`SingleRecordResource` 用于表单/详情（单条记录）。它们封装了 REST API 调用，提供响应式的数据管理。

继承链路：`FlowResource` → `APIResource` → `BaseRecordResource` → `MultiRecordResource` / `SingleRecordResource`

## MultiRecordResource

用于列表、表格、看板等多条记录场景。从 `@nocobase/flow-engine` 导入。

### 数据操作

| 方法 | 参数 | 说明 |
|------|------|------|
| `getData()` | - | 返回 `TDataItem[]`，初始值为 `[]` |
| `hasData()` | - | 数据数组是否非空 |
| `create(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | 创建记录，默认创建后自动 refresh |
| `get(filterByTk)` | `filterByTk: string \| number` | 通过主键获取单条记录 |
| `update(filterByTk, data, options?)` | `filterByTk: string \| number`, `data: object` | 更新记录，完成后自动 refresh |
| `destroy(filterByTk, options?)` | `filterByTk: string \| number \| Array` | 删除记录，支持批量 |
| `destroySelectedRows()` | - | 删除所有选中行 |
| `refresh()` | - | 刷新数据（调用 `list` action），同一事件循环内多次调用会合并 |

### 分页

| 方法 | 说明 |
|------|------|
| `getPage()` | 获取当前页码 |
| `setPage(page)` | 设置页码 |
| `getPageSize()` | 获取每页条数（默认 20） |
| `setPageSize(pageSize)` | 设置每页条数 |
| `getCount()` | 获取总记录数 |
| `getTotalPage()` | 获取总页数 |
| `next()` | 下一页并刷新 |
| `previous()` | 上一页并刷新 |
| `goto(page)` | 跳转到指定页并刷新 |

### 选中行

| 方法 | 说明 |
|------|------|
| `setSelectedRows(rows)` | 设置选中行 |
| `getSelectedRows()` | 获取选中行 |

### 示例：在 CollectionBlockModel 中使用

继承 `CollectionBlockModel` 时，需要通过 `createResource()` 创建 resource，然后在 `renderComponent()` 中读取数据：

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class ManyRecordBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  // 声明使用 MultiRecordResource 管理数据
  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData();   // TDataItem[]
    const count = this.resource.getCount(); // 总记录数

    return (
      <div>
        <h3>共 {count} 条记录（第 {this.resource.getPage()} 页）</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records block'),
});
```

完整示例见 [FlowEngine → 区块扩展](../../plugin-development/client/flow-engine/block.md)。

### 示例：在操作按钮中调用 CRUD

在 `ActionModel` 的 `registerFlow` handler 中，通过 `ctx.blockModel?.resource` 拿到当前区块的 resource，调用 CRUD 方法：

```tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps = {
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
  on: 'click',
  steps: {
    openForm: {
      async handler(ctx) {
        // 拿到当前区块的 resource
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        ctx.viewer.dialog({
          title: ctx.t('New todo'),
          content: (view) => (
            <MyForm
              onSubmit={async (values) => {
                // 创建记录，创建后 resource 会自动 refresh
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

完整示例见 [做一个前后端联动的数据管理插件](../../plugin-development/client/examples/fullstack-plugin.md)。

### 示例：CRUD 操作速查

```ts
async handler(ctx) {
  const resource = ctx.blockModel?.resource as MultiRecordResource;

  // --- 创建 ---
  await resource.create({ title: 'New item', completed: false });
  // 不自动刷新
  await resource.create({ title: 'Draft' }, { refresh: false });

  // --- 读取 ---
  const items = resource.getData();     // TDataItem[]
  const count = resource.getCount();    // 总记录数
  const item = await resource.get(1);   // 通过主键获取单条

  // --- 更新 ---
  await resource.update(1, { title: 'Updated' });

  // --- 删除 ---
  await resource.destroy(1);            // 单条删除
  await resource.destroy([1, 2, 3]);    // 批量删除

  // --- 分页 ---
  resource.setPage(2);
  resource.setPageSize(50);
  await resource.refresh();
  // 或者用快捷方法
  await resource.goto(3);
  await resource.next();
  await resource.previous();

  // --- 刷新 ---
  await resource.refresh();
}
```

## SingleRecordResource

用于表单、详情页等单条记录场景。从 `@nocobase/flow-engine` 导入。

### 数据操作

| 方法 | 参数 | 说明 |
|------|------|------|
| `getData()` | - | 返回 `TData`（单个对象），初始值为 `null` |
| `save(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | 智能保存——`isNewRecord` 为 true 时调用 create，否则调用 update |
| `destroy(options?)` | - | 删除当前记录（使用已设置的 filterByTk） |
| `refresh()` | - | 刷新数据（调用 `get` action），`isNewRecord` 为 true 时跳过 |

### 关键属性

| 属性 | 说明 |
|------|------|
| `isNewRecord` | 标识是否为新记录。`setFilterByTk()` 会自动将其设为 `false` |

### 示例：表单详情场景

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { SingleRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DetailBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.one;

  createResource() {
    return this.context.makeResource(SingleRecordResource);
  }

  get resource() {
    return this.context.resource as SingleRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData(); // 单个对象或 null
    if (!data) return <div>加载中...</div>;

    return (
      <div>
        <h3>{data.title}</h3>
        <p>{data.content}</p>
      </div>
    );
  }
}

DetailBlockModel.define({
  label: tExpr('Detail block'),
});
```

### 示例：新建和编辑记录

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource as SingleRecordResource;

  // --- 新建记录 ---
  resource.isNewRecord = true;
  await resource.save({ name: 'John', age: 30 });
  // save 内部调用 create action，完成后自动 refresh

  // --- 编辑已有记录 ---
  resource.setFilterByTk(1);  // 自动设置 isNewRecord = false
  await resource.refresh();   // 先加载当前数据
  const data = resource.getData();
  await resource.save({ ...data, name: 'Jane' });
  // save 内部调用 update action

  // --- 删除当前记录 ---
  await resource.destroy();   // 使用已设置的 filterByTk
}
```

## 通用方法

以下方法在 `MultiRecordResource` 和 `SingleRecordResource` 上都可用：

### 过滤

| 方法 | 说明 |
|------|------|
| `setFilter(filter)` | 直接设置 filter 对象 |
| `addFilterGroup(key, filter)` | 添加命名过滤组（推荐，可组合可移除） |
| `removeFilterGroup(key)` | 移除命名过滤组 |
| `getFilter()` | 获取聚合后的 filter，多个 group 自动用 `$and` 组合 |

### 字段控制

| 方法 | 说明 |
|------|------|
| `setFields(fields)` | 设置返回字段 |
| `setAppends(appends)` | 设置关联字段的 appends |
| `addAppends(appends)` | 追加 appends（去重） |
| `setSort(sort)` | 设置排序，比如 `['-createdAt', 'name']` |
| `setFilterByTk(value)` | 设置按主键过滤 |

### 资源配置

| 方法 | 说明 |
|------|------|
| `setResourceName(name)` | 设置资源名称，比如 `'users'` 或关联资源 `'users.tags'` |
| `setSourceId(id)` | 设置关联资源的父记录 ID |
| `setDataSourceKey(key)` | 设置数据源（添加 `X-Data-Source` 请求头） |

### 元数据和状态

| 方法 | 说明 |
|------|------|
| `getMeta(key?)` | 获取元数据，不传 key 返回整个 meta 对象 |
| `loading` | 是否正在加载（getter） |
| `getError()` | 获取错误信息 |
| `clearError()` | 清除错误 |

### 事件

| 事件 | 触发时机 |
|------|----------|
| `'refresh'` | `refresh()` 成功获取数据后 |
| `'saved'` | `create` / `update` / `save` 操作成功后 |

```ts
resource.on('saved', (data) => {
  console.log('记录已保存:', data);
});
```

## Filter 语法

NocoBase 使用 JSON 风格的过滤语法，操作符以 `$` 开头：

```ts
// 等于
{ status: { $eq: 'active' } }

// 不等于
{ status: { $ne: 'deleted' } }

// 大于
{ age: { $gt: 18 } }

// 包含（模糊匹配）
{ name: { $includes: 'test' } }

// 组合条件
{
  $and: [
    { status: { $eq: 'active' } },
    { age: { $gt: 18 } },
  ]
}

// 或条件
{
  $or: [
    { status: { $eq: 'active' } },
    { role: { $eq: 'admin' } },
  ]
}
```

在 Resource 上推荐用 `addFilterGroup` 管理过滤条件：

```ts
// 添加多个过滤组
resource.addFilterGroup('status', { status: { $eq: 'active' } });
resource.addFilterGroup('age', { age: { $gt: 18 } });
// getFilter() 自动聚合为: { $and: [...] }

// 移除某个过滤组
resource.removeFilterGroup('status');

// 刷新应用过滤
await resource.refresh();
```

## MultiRecordResource 与 SingleRecordResource 对比

| 特性 | MultiRecordResource | SingleRecordResource |
|------|-------|-------|
| getData() 返回 | `TDataItem[]`（数组） | `TData`（单个对象） |
| 默认 refresh action | `list` | `get` |
| 分页 | 支持 | 不支持 |
| 选中行 | 支持 | 不支持 |
| 创建 | `create(data)` | `save(data)` + `isNewRecord=true` |
| 更新 | `update(filterByTk, data)` | `save(data)` + `setFilterByTk(id)` |
| 删除 | `destroy(filterByTk)` | `destroy()` |
| 典型场景 | 列表、表格、看板 | 表单、详情页 |

## 相关链接

- [做一个前后端联动的数据管理插件](../../plugin-development/client/examples/fullstack-plugin.md) — 完整示例：`resource.create()` 在自定义操作按钮中的实际用法
- [FlowEngine → 区块扩展](../../plugin-development/client/flow-engine/block.md) — CollectionBlockModel 中 `createResource()` 和 `resource.getData()` 的用法
- [ResourceManager 资源管理（服务端）](../../plugin-development/server/resource-manager.md) — 服务端 REST API 资源定义，客户端 Resource 调用的就是这些接口
- [FlowContext API](./flow-context.md) — `ctx.makeResource()`、`ctx.initResource()` 等方法的说明
