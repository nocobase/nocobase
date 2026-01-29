---
title: "workflows 资源 HTTP API"
description: "汇总 workflows 资源的增删改查、版本与手动执行接口。"
---

# workflows 资源 HTTP API

本文档面向前端调用视角，总结 workflows 资源的操作与参数。NocoBase 客户端通常使用 `api.resource('workflows')` 调用。

## 调用方式（前端）

```ts
import { useAPIClient } from '@nocobase/client';

const api = useAPIClient();

// 列表
const res = await api.resource('workflows').list({
  filter: { current: true },
  sort: ['-createdAt'],
  except: ['config'],
});

// 更新
await api.resource('workflows').update({
  filterByTk: workflowId,
  values: { enabled: true },
});
```

## 操作与参数

### workflows:list

HTTP: GET `/api/workflows:list`。
用途：获取工作流列表。

参数说明（Query）：

| 参数 | 说明 |
| --- | --- |
| filter | 过滤条件（例如 `{ current: true }`） |
| sort | 排序（例如 `['-createdAt']`） |
| fields | 只返回指定字段（数组或逗号分隔字符串） |
| appends | 追加关联（例如 `['stats', 'versionStats']`） |
| except | 排除字段（例如 `['config']`） |
| page | 页码 |
| pageSize | 每页条数 |

示例（列表页加载）：

```ts
await api.resource('workflows').list({
  filter: { current: true },
  sort: ['-createdAt'],
  except: ['config'],
});
```

其中基于 current 字段过滤，是用于仅加载当前使用版本的工作流，相当于列表的结果中每个工作流只会出现一次当前版本的数据。

### workflows:get

HTTP: GET `/api/workflows:get`。
用途：获取单个工作流（可带节点/统计）。

参数说明（Query）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | 主键 ID |
| appends | 追加关联（例如 `['nodes', 'stats', 'versionStats']`） |
| except | 排除字段 |

示例（加载工作流详情）：

```ts
await api.resource('workflows').get({
  filterByTk: workflowId,
  appends: ['nodes', 'stats.executed', 'versionStats.executed'],
});
```

### workflows:create

HTTP: POST `/api/workflows:create`。
用途：创建工作流。

参数说明（Body，values）：

| 参数 | 说明 |
| --- | --- |
| title | 工作流名称 |
| type | 触发器类型（如 `collection`、`schedule`） |
| description | 描述 |
| enabled | 是否启用 |
| sync | 同步/异步模式（创建后不可修改） |
| categories | 分类 ID 数组 |
| options | 引擎选项（如 `deleteExecutionOnStatus`、`stackLimit`） |

示例（新增工作流）：

```ts
await api.resource('workflows').create({
  values: {
    title: '新建工作流',
    type: 'collection',
    sync: false,
    enabled: false,
    options: { deleteExecutionOnStatus: [], stackLimit: 1 },
  },
});
```

### workflows:update

HTTP: POST `/api/workflows:update`。
用途：更新工作流信息（受白名单限制）。

参数说明（Query + Body）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | 主键 ID |
| values | 允许字段：`title`、`description`、`enabled`、`triggerTitle`、`config`、`options`、`categories` |

注意：

- 已执行过的版本不允许更新 `config`。
- `sync` 不在白名单内，不能通过 update 修改。

示例（启用/停用）：

```ts
await api.resource('workflows').update({
  filterByTk: workflowId,
  values: { enabled: true },
});
```

示例（更新触发器配置）：

```ts
await api.resource('workflows').update({
  filterByTk: workflowId,
  values: {
    config: {
      collection: 'users',
      mode: 1,
      changed: [],
      condition: { $and: [] },
    },
  },
});
```

### workflows:destroy

HTTP: POST `/api/workflows:destroy`。
用途：删除工作流。

参数说明（Query）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | 主键 ID（删除指定版本） |
| filter.key | 同一 `key` 的所有版本一起删除 |

示例（删除当前版本）：

```ts
await api.resource('workflows').destroy({
  filterByTk: workflowId,
});
```

### workflows:revision

HTTP: POST `/api/workflows:revision`。
用途：复制工作流（生成新版本或新 workflow）。

参数说明（Query + Body）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | 要复制的 workflow ID |
| filter.key | 如果提供，仅生成新版本（同 key） |
| values | 覆盖字段（如 `title`、`enabled`、`current`） |

示例（复制为新版本）：

```ts
await api.resource('workflows').revision({
  filterByTk: workflowId,
  filter: { key: workflowKey },
});
```

### workflows:execute

HTTP: POST `/api/workflows:execute`。
用途：手动执行工作流（用于“手动触发”按钮）。

参数说明（Query + Body）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | workflow ID |
| values | 触发器需要的输入数据（由 trigger 定义） |
| autoRevision | `1` 时，首次执行后自动创建新版本 |

返回：`{ execution: { id, status }, newVersionId? }`。

示例（手动执行）：

```ts
const { data } = await api.resource('workflows').execute({
  filterByTk: workflowId,
  values: { data: { id: 1 } },
  autoRevision: 1,
});
```

## 常见场景组合

```ts
// 1. 创建工作流
const { data: workflow } = await api.resource('workflows').create({
  values: { title: '示例', type: 'collection', sync: false },
});

// 2. 配置触发器
await api.resource('workflows').update({
  filterByTk: workflow.id,
  values: { config: { collection: 'users', mode: 1, changed: [], condition: { $and: [] } } },
});

// 3. 启用工作流
await api.resource('workflows').update({
  filterByTk: workflow.id,
  values: { enabled: true },
});
```
