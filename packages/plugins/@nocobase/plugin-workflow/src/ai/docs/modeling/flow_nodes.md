---
title: "flow_nodes"
description: "工作流节点表，描述节点类型、配置与链路关系。"
---

# flow_nodes

## 字段说明

| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | snowflakeId | 否（系统生成） | - | 主键 ID，由系统生成。 |
| key | uid | 是（建议） | - | 节点唯一键，跨版本复制时保持不变，用于任务结果映射（`jobs.nodeKey`）。建议由系统自动生成，在复制出来的工作流版本中**不要**修改。 |
| title | string | 否 | - | 节点标题（展示用）。 |
| workflow | belongsTo | 是 | - | 所属工作流（`workflows`），实际外键为 `workflowId`；通常创建节点时必须关联到某个工作流版本。 |
| upstream | belongsTo | 否 | - | 上游节点（`flow_nodes`），外键为 `upstreamId`。主链路的首节点为 `null`。 |
| branches | hasMany | 否 | - | 分支节点集合（`flow_nodes`），通过 `upstreamId` + `branchIndex` 派生，仅用于查询。 |
| branchIndex | integer | 否 | - | 分支序号。`null` 表示主链路；分支节点使用整数索引（如条件节点常见 `0/1`，多条件默认分支为 `0`），其他详见各节点类型文档。 |
| downstream | belongsTo | 否 | - | 下游节点（`flow_nodes`），外键为 `downstreamId`；用于主链路或分支尾部回接。 |
| type | string | 是 | - | 节点类型（对应指令 `instruction` 名称）。 |
| config | json | 否 | {} | 节点配置，结构取决于 `type`；本文不展开具体节点配置。 |

## 建模注意事项

- 链路连接：创建/删除节点时需要维护 `upstreamId`/`downstreamId` 与 `branchIndex` 的一致性；使用内置 actions 会自动处理插入位置。
- 已执行版本不可修改：当工作流版本已执行过（`versionStats.executed > 0`），节点不允许新增/删除或修改配置，应创建新版本后修改。

## 示例值

```ts
const values = {
  key: '2kjfd91',
  title: '计算',
  type: 'calculation',
  workflowId: 10001,
  upstreamId: 10000,
  branchIndex: null,
  config: {
    engine: 'formula.js',
    expression: '{{$context.data.a}}+1',
  },
};
```
