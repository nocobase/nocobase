---
title: "工作流 HTTP API"
description: "介绍工作流相关的 HTTP API 及其调用方式。"
---

# 工作流 HTTP API

## 基础用法

NocoBase 默认 API 前缀为 `/api`，操作路由一般为 `/api/<resource>:<action>`，关联资源操作为 `/api/<resource>/<id>/<association>:<action>`。

在 NocoBase 前端组件中，通常使用 `useAPIClient()` 获取 SDK 的 API 调用实例，之后通过 `api.resource(resourceName).someAction(params)` 调用。

当页面环境不存在 `useAPIClient` 时，也可以直接使用 `fetch` 等原生方法调用 HTTP API，但需要自行补充认证（token）等参数（通常保存在 `localStorage` 中），例如：

```ts
const response = await fetch('/api/workflows:list?filter={"current":true}&sort=-createdAt&except[]=config', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`, // 需要自行补充认证信息
  },
});
```

## 常用 HTTP API（actions）

### workflows

- 通用资源操作：
  -`workflows:list`
  -`workflows:get`
  -`workflows:create`
  -`workflows:update`
  -`workflows:destroy`
- 自定义操作：
  - `workflows:revision`：复制工作流（可生成新版本或新 workflow）
  - `workflows:execute`：手动触发执行（`values` 必填）

具体参数说明请参考各接口的详细说明。

### nodes
- `workflows/{workflowId}/nodes:create`：在指定工作流下创建节点（常用参数：`type`、`config`、`upstreamId`、`branchIndex`）
- `flow_nodes:update`：更新节点属性/配置
- `flow_nodes:destroy`：删除节点（会连带删除其分支）
- `flow_nodes:destroyBranch`：删除某个分支
- `flow_nodes:test`：测试节点配置（仅支持实现了 `test` 的节点）

具体参数说明请参考各接口的详细说明。

### executions
- 通用操作：
  - `executions:list`
  - `executions:get`
- 自定义操作：
  - `executions:destroy`（不能删除运行中执行）
  - `executions:cancel`（中止执行）

### jobs
- 通用操作：
  - `jobs:get`
