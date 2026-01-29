---
title: "executions 资源 HTTP API"
description: "汇总 executions 资源的列表、详情、取消与删除接口。"
---

# executions 资源 HTTP API

本页面从前端调用视角总结 executions（执行记录）相关接口。

## 调用方式（前端常见）

```ts
import { useAPIClient } from '@nocobase/client';

const api = useAPIClient();

// 获取某个执行详情（含节点与作业）
await api.resource('executions').get({
  filterByTk: executionId,
  appends: ['jobs', 'workflow', 'workflow.nodes', 'workflow.versionStats', 'workflow.stats'],
  except: ['jobs.result', 'workflow.options'],
});
```

## 动作与参数

### executions:list

HTTP: GET `/api/executions:list`。

用途：列出执行记录（常用于执行历史）。

参数说明（Query）：

| 参数 | 说明 |
| --- | --- |
| filter | 过滤条件（常用：`{ workflowId }`） |
| appends | 追加关联（例如 `['jobs']`） |
| fields | 指定返回字段 |
| except | 排除字段（可选） |
| sort | 排序（例如 `['-id']`） |
| page | 页码 |
| pageSize | 每页条数 |

示例（获取某工作流的执行历史）：

```ts
await api.resource('executions').list({
  filter: { workflowId },
  appends: ['jobs'],
  fields: ['id', 'createdAt', 'status', 'workflowId'],
  page: 1,
  pageSize: 20,
});
```

### executions:get

HTTP: GET `/api/executions:get`。

用途：获取单个执行详情。

参数说明（Query）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | 执行 ID |
| filter | 过滤条件（可用路由参数 `{ id }`） |
| appends | 追加关联（如 `jobs`、`workflow`、`workflow.nodes`） |
| except | 排除字段（用于减小返回体积） |

示例（详情页加载）：

```ts
await api.resource('executions').get({
  filterByTk: executionId,
  appends: ['jobs', 'workflow', 'workflow.nodes', 'workflow.versionStats', 'workflow.stats'],
  except: ['jobs.result', 'workflow.options'],
});
```

### executions:cancel

HTTP: POST `/api/executions:cancel`。

用途：取消尚未结束的执行（置为 ABORTED，并中止 PENDING jobs）。

参数说明（Query）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | 执行 ID |

示例：

```ts
await api.resource('executions').cancel({
  filterByTk: executionId,
});
```

### executions:destroy

HTTP: POST `/api/executions:destroy`。

用途：删除执行记录（运行中不可删除）。

参数说明（Query）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | 执行 ID |
| filter | 可选过滤条件 |

示例：

```ts
await api.resource('executions').destroy({
  filterByTk: executionId,
});
```

## 常见场景组合

```ts
// 1. 执行历史
const history = await api.resource('executions').list({
  filter: { workflowId },
  appends: ['jobs'],
  sort: ['-id'],
});

// 2. 查看详情
await api.resource('executions').get({
  filterByTk: history.data?.[0]?.id,
  appends: ['jobs', 'workflow', 'workflow.nodes'],
});
```
