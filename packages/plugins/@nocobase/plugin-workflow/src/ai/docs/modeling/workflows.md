---
title: "workflows"
description: "工作流主表，保存触发器、版本、执行模式与引擎选项等核心信息。"
---

# workflows

## 字段说明

| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| id | snowflakeId | 否（系统生成） | - | 主键 ID，由系统生成。 |
| key | uid | 否（系统生成） | - | 版本分组键，同一工作流的所有版本共用同一 key；不传时在保存前自动生成。 |
| title | string | 是 | - | 工作流名称。 |
| enabled | boolean | 否 | false | 是否启用当前版本。启用后会触发注册监听。 |
| description | text | 否 | - | 描述信息。 |
| type | string | 是 | - | 触发器类型（如 `collection`、`schedule` 等）。 |
| triggerTitle | string | 否 | - | 触发器标题（展示用，可选）。 |
| config | jsonb | 是 | {} | 触发器配置，结构取决于 `type`；此文档不展开具体触发器配置。 |
| nodes | hasMany | 否 | - | 关联的节点集合（`flow_nodes`），关联查询用，通常不在 values 中直接写入。 |
| executions | hasMany | 否 | - | 关联的执行记录（`executions`），关联查询用。 |
| executed | integer | 否 | 0 | 旧版“当前版本执行次数”计数，主要用于兼容历史数据，新的统计以 `versionStats.executed` 为准。 |
| allExecuted | integer | 否 | 0 | 旧版“同一 key 下总执行次数”计数，主要用于兼容历史数据，新的统计以 `stats.executed` 为准。 |
| current | boolean | 否 | - | 是否为该 key 的当前版本；同一 key 仅允许一个 current=true。启用后会自动置为 true。 |
| sync | boolean | 否 | false | 同步/异步模式。同步模式会立即执行并返回；异步模式进入队列。部分触发器仅支持一种模式，且同步模式不能使用会等待的节点（如人工处理、审批等）。 |
| revisions | hasMany | 否 | - | 同 key 的其他版本（自关联），用于版本管理。 |
| options | jsonb | 否 | {} | 引擎选项，常用子项见下方说明。 |
| stats | hasOne | 否 | - | 关联统计（`workflowStats`），按 key 聚合执行次数。 |
| versionStats | hasOne | 否 | - | 关联统计（`workflowVersionStats`），按版本统计执行次数。 |
| categories | belongsToMany | 否 | - | 分类（`workflowCategories`）多对多关系，values 可传分类 ID 数组。 |

### options 常用子项

| 子项 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| deleteExecutionOnStatus | number[] | 否 | - | 执行达到指定“结束状态”时自动删除执行记录。状态值见 `executions.status` 枚举。 |
| stackLimit | number | 否 | 1 | 防止递归触发的“最大循环触发次数”。若当前触发栈中的执行数达到该值，将跳过新的触发。 |

## 建模注意事项

- 版本管理：同一工作流的各版本共用 `key`，`current` 标识当前生效版本；创建新版本可调用 `WorkflowRepository.revision`。
- 已执行版本不可修改：一旦 `versionStats.executed > 0`，触发器与节点配置会被限制修改，需要创建新版本。
- 同步/异步：最终执行模式由触发器能力与 `sync` 共同决定，某些触发器强制异步或同步。

## 示例值

```ts
const values = {
  title: '用户资料变更提醒',
  type: 'collection',
  triggerTitle: '用户表更新',
  config: {
    collection: 'users',
    mode: 1,
    changed: ['email', 'phone'],
    condition: { $and: [] },
  },
  enabled: true,
  sync: false,
  current: true,
  description: '当用户邮箱/手机号变更时通知',
  options: {
    deleteExecutionOnStatus: [1, -1, -2],
    stackLimit: 1,
  },
  categories: [1, 3],
};
```
