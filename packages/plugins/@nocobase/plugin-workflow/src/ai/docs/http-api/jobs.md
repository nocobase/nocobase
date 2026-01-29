---
title: "jobs 资源 HTTP API"
description: "汇总 jobs 资源的查询与恢复执行接口及常见用法。"
---

# jobs 资源 HTTP API

本页面从前端调用视角总结 jobs（节点作业）相关接口。主要用于查看节点执行记录或在人工节点场景中恢复执行。

## 调用方式（前端常见）

```ts
import { useAPIClient } from '@nocobase/client';

const api = useAPIClient();

// 获取 job 详情
await api.resource('jobs').get({ filterByTk: jobId });
```

## 动作与参数

### jobs:get

HTTP: GET `/api/jobs:get`。

用途：获取单个 job。

参数说明（Query）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | job ID |
| appends | 追加关联（可选） |
| fields | 指定返回字段（可选） |

示例：

```ts
await api.resource('jobs').get({
  filterByTk: jobId,
});
```

### jobs:list

HTTP: GET `/api/jobs:list`。

用途：按条件列出 jobs（通常通过 executions:list 的 `appends: ['jobs']` 获取）。

参数说明（Query）：

| 参数 | 说明 |
| --- | --- |
| filter | 过滤条件（例如 `{ executionId }`、`{ nodeId }`） |
| fields | 指定返回字段（可选） |
| appends | 追加关联（可选） |
| except | 排除字段（可选） |
| sort | 排序 |
| page | 页码 |
| pageSize | 每页条数 |

示例：

```ts
await api.resource('jobs').list({
  filter: { executionId },
  sort: ['-id'],
});
```

### jobs:resume

HTTP: POST `/api/jobs:resume`。

用途：更新 job 并继续执行（常用于人工节点提交后恢复流程）。

参数说明（Query + Body）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | job ID |
| values | 要更新的字段（通常包括 `status`、`result`、`meta`） |

示例（人工节点提交后继续）：

```ts
await api.resource('jobs').resume({
  filterByTk: jobId,
  values: {
    status: 1,
    result: { approved: true, comment: 'ok' },
  },
});
```

## 常见场景组合

```ts
// 1. 从 execution 中取到 job 列表
const execution = await api.resource('executions').get({
  filterByTk: executionId,
  appends: ['jobs'],
});

// 2. 对 pending job 执行 resume
const job = execution.data?.jobs?.find((item) => item.status === 0);
if (job) {
  await api.resource('jobs').resume({
    filterByTk: job.id,
    values: { status: 1, result: { approved: true } },
  });
}
```
