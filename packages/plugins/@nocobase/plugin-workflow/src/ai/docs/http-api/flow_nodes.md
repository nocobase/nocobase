---
title: "flow_nodes 资源 HTTP API"
description: "汇总 flow_nodes 与 workflows.nodes 的创建、更新与分支操作接口。"
---

# flow_nodes 资源 HTTP API

本页面从前端调用视角总结节点相关接口。节点创建走关联资源 `workflows.nodes`，节点更新/删除走 `flow_nodes` 资源。

## 调用方式（前端）

```ts
import { useAPIClient } from '@nocobase/client';

const api = useAPIClient();

// 在 workflow 下创建节点
await api.resource('workflows.nodes', workflowId).create({
  values: { type: 'calculation', upstreamId: null, branchIndex: null, title: '运算', config: {} },
});

// 更新节点配置
await api.resource('flow_nodes').update({
  filterByTk: nodeId,
  values: { config: { engine: 'math.js', expression: '1+1' } },
});
```

## 动作与参数

### workflows/{workflowId}/nodes:create

HTTP: POST `/api/workflows/{workflowId}/nodes:create`。

用途：在指定 workflow 下创建节点。

参数说明（Path + Body）：

| 参数 | 说明 |
| --- | --- |
| workflowId | 关联的 workflow ID（路径参数） |
| values.type | 节点类型（如 `calculation`、`condition`） |
| values.upstreamId | 上游节点 ID；`null` 表示紧接触发器后的首节点 |
| values.branchIndex | 分支序号；非分支链路使用 `null` |
| values.title | 节点标题 |
| values.config | 节点配置 |
| whitelist | 仅允许这些字段写入 `values`（可选） |
| blacklist | 排除这些字段写入 `values`（可选） |
| updateAssociationValues | 需要联动更新的关联字段数组（可选） |

示例（新增节点）：

```ts
await api.resource('workflows.nodes', workflowId).create({
  values: {
    type: 'calculation',
    title: '运算',
    upstreamId: null,
    branchIndex: null,
    config: {},
  },
});
```

### flow_nodes:get

HTTP: GET `/api/flow_nodes:get`。

用途：获取单个节点。

参数说明（Query）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | 节点 ID |
| appends | 追加关联（可选） |
| fields | 指定返回字段（可选） |

示例：

```ts
await api.resource('flow_nodes').get({ filterByTk: nodeId });
```

### flow_nodes:update

HTTP: POST `/api/flow_nodes:update`。

用途：更新节点属性/配置。

参数说明（Query + Body）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | 节点 ID |
| filter | 批量更新过滤条件（可选） |
| values.title | 修改节点标题 |
| values.config | 修改节点配置 |
| values.branchIndex | 调整分支序号 |
| values.upstream | 关联更新（用于插入节点时重连） |
| updateAssociationValues | 需要联动更新的关联字段数组（例如 `['upstream']`） |
| whitelist | 仅允许这些字段写入 `values`（可选） |
| blacklist | 排除这些字段写入 `values`（可选） |

示例（更新节点配置）：

```ts
await api.resource('flow_nodes').update({
  filterByTk: nodeId,
  values: { config: { engine: 'math.js', expression: '1' } },
});
```

示例（插入节点后重连下游分支）：

```ts
await api.resource('flow_nodes').update({
  filterByTk: downstreamId,
  values: {
    branchIndex: 1,
    upstream: { id: newNodeId, downstreamId: null },
  },
  updateAssociationValues: ['upstream'],
});
```

### flow_nodes:destroy

HTTP: POST `/api/flow_nodes:destroy`。

用途：删除节点；默认会删除其分支链路。

参数说明（Query）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | 节点 ID |
| keepBranch | 保留的分支序号（可选） |

示例（删除节点并保留某个分支）：

```ts
await api.resource('flow_nodes').destroy({
  filterByTk: nodeId,
  keepBranch: 1,
});
```

### flow_nodes:destroyBranch

HTTP: POST `/api/flow_nodes:destroyBranch`。

用途：删除某个分支（常用于多条件节点删除分支）。

参数说明（Query）：

| 参数 | 说明 |
| --- | --- |
| filterByTk | 分支父节点 ID |
| branchIndex | 要删除的分支序号 |
| shift | 是否将后续分支序号前移（`1` 表示前移） |

示例（删除分支并重排序号）：

```ts
await api.resource('flow_nodes').destroyBranch({
  filterByTk: nodeId,
  branchIndex: 2,
  shift: 1,
});
```

### flow_nodes:test

HTTP: POST `/api/flow_nodes:test`。

用途：测试节点配置（仅适用于实现了 `test` 的节点）。

参数说明（Body，values）：

| 参数 | 说明 |
| --- | --- |
| values.type | 节点类型 |
| values.config | 节点配置 |

示例：

```ts
await api.resource('flow_nodes').test({
  values: { type: 'calculation', config: { engine: 'math.js', expression: '1+1' } },
});
```

## 常见场景组合

```ts
// 1. 创建节点
const { data: node } = await api.resource('workflows.nodes', workflowId).create({
  values: { type: 'condition', upstreamId: prevId, branchIndex: null, title: '条件', config: {} },
});

// 2. 更新节点配置
await api.resource('flow_nodes').update({
  filterByTk: node.id,
  values: { config: { engine: 'basic', calculation: { group: { type: 'and', calculations: [] } } } },
});

// 3. 删除节点
await api.resource('flow_nodes').destroy({ filterByTk: node.id });
```
