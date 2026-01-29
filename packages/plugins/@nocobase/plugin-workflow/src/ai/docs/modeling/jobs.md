---
title: "jobs"
description: "节点执行记录表，保存每个节点在一次执行中的结果与状态。"
---

# jobs

节点执行记录由工作流执行时自动生成，并且由执行器管理，无需手动创建，本文档仅用于字段说明。

## 字段说明

| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | bigInt | 否（系统生成） | - | 主键 ID。由工作流引擎使用 snowflake 生成；手动插入需显式提供。 |
| execution | belongsTo | 是 | - | 所属执行（`executions`），外键为 `executionId`。 |
| node | belongsTo | 是 | - | 对应节点（`flow_nodes`），外键为 `nodeId`。 |
| nodeKey | string | 是 | - | 对应节点的 `flow_nodes.key`，用于跨版本映射与结果引用。 |
| upstream | belongsTo | 否 | - | 上游 job（`jobs`），外键为 `upstreamId`，部分节点链路会用到。 |
| status | integer | 是 | - | 节点执行状态，见下方枚举。 |
| meta | json | 否 | - | 节点执行元数据（如等待/表单信息等）。 |
| result | json | 否 | - | 节点执行结果数据（供后续节点与输出使用）。 |

## 状态枚举（status）

- `0`：PENDING（等待中）
- `1`：RESOLVED（成功）
- `-1`：FAILED（条件失败/未通过）
- `-2`：ERROR（执行错误）
- `-3`：ABORTED（中止）
- `-4`：CANCELED（取消）
- `-5`：REJECTED（拒绝）
- `-6`：RETRY_NEEDED（需要重试）

## 示例值

```ts
const values = {
  id: '900000000000001',
  executionId: 20001,
  nodeId: 30001,
  nodeKey: 'node_user_update_notify',
  upstreamId: null,
  status: 1,
  meta: { durationMs: 120 },
  result: { delivered: true },
};
```
