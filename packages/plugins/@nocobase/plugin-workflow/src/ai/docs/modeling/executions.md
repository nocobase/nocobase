---
title: "executions"
description: "工作流执行记录表，保存一次触发执行的上下文与状态。"
---

# executions

执行计划记录由工作流触发时自动生成，并且由执行器管理，无需手动创建，本文档仅用于字段说明。

## 字段说明

| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | snowflakeId | 否（系统生成） | - | 主键 ID，由系统生成。 |
| workflow | belongsTo | 是 | - | 关联工作流版本（`workflows`），外键为 `workflowId`。 |
| key | string | 否 | - | 版本分组键，通常等于 `workflow.key`。 |
| eventKey | string | 否（系统生成） | - | 事件唯一键，用于触发去重（同一 workflow + eventKey 会被忽略），数据库层面唯一。 |
| jobs | hasMany | 否 | - | 关联的节点执行记录（`jobs`），关联查询用。 |
| context | json | 否 | - | 触发上下文（事件数据/输入参数），供节点运行时读取。 |
| status | integer | 否 | - | 执行状态，见下方枚举。队列中为 `null`，开始执行后为 `0`，结束为正/负值。 |
| dispatched | boolean | 否 | false | 是否已被调度开始执行；`false` 表示仍在队列/未被 worker 领取。 |
| stack | json | 否 | - | 触发栈（执行 ID 数组），用于递归触发检测，配合 `workflows.options.stackLimit`。 |
| output | json | 否 | - | 输出节点（Output）产出的汇总结果，供外部读取。 |
| createdAt | datetime | 否（系统生成） | - | 创建时间。 |
| manually | boolean | 否 | - | 是否为手动触发（如 `workflows:execute`）。 |

## 状态枚举（status）

- `null`：QUEUEING（已触发但仍在队列中，该状态值已启用，检测是否已开始执行使用 `dispatched` 字段）
- `0`：STARTED（执行中，可能等待异步回调）
- `1`：RESOLVED（成功完成）
- `-1`：FAILED（未满足节点配置/条件失败）
- `-2`：ERROR（运行错误）
- `-3`：ABORTED（流程中止）
- `-4`：CANCELED（等待中被手动取消）
- `-5`：REJECTED（被人工节点拒绝）
- `-6`：RETRY_NEEDED（失败但需要重试）

## 示例值

```ts
const values = {
  workflowId: 10001,
  key: 'wf_group_abc',
  eventKey: 'users:update:12345',
  context: { data: { id: 12345, email: 'a@b.com' } },
  status: null,
  dispatched: false,
  stack: [90001, 90002],
  manually: true,
  output: { result: 'ok' },
};
```
