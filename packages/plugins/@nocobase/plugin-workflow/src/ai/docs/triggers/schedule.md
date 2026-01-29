---
title: "定时任务"
description: "按时间规则触发流程，支持固定时间与数据表时间字段两种模式。"
---

# 定时任务

## 触发器类型

`schedule`
请使用以上 `type` 值创建触发器，不要使用文档文件名作为 type。

## 适用场景
- 周期性任务：定时清理、定时发送通知、定时统计。
- 以某条记录的时间字段为基准触发（如订单超时、到期提醒）。

## 触发时机 / 事件
- 当当前时间满足配置的时间条件时触发。
- 触发精度为秒级；应用停机期间错过的时间点不会补触发。
- 该触发器为异步执行模式（`sync=false`）。

## 配置项列表
### 通用配置
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| mode | number | 0 | 是 | 触发模式：`0` 自定义时间，`1` 数据表时间字段。 |

### 模式：自定义时间（mode=0）
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| startsOn | string (datetime) | - | 是 | 开始时间（ISO 或可解析的时间字符串）。若开始时间已过去且未配置重复规则，则不会再次触发。 |
| repeat | string \| number \| null | null | 否 | 重复规则：字符串表示 cron 表达式；数字表示毫秒间隔。 |
| endsOn | string (datetime) | null | 否 | 结束时间（仅在配置重复规则时生效）。 |
| limit | number | null | 否 | 最大触发次数（统计同一工作流所有版本的累计执行次数）。 |

### 模式：数据表时间字段（mode=1）
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| collection | string | - | 是 | 数据表，格式为 `"<dataSource>:<collection>"`，数据源为主数据源时可省略 `dataSource`。 |
| startsOn | object | - | 是 | 开始时间字段配置。 |
| startsOn.field | string | - | 是 | 作为触发基准的时间字段名。 |
| startsOn.offset | number | 0 | 否 | 偏移量（可正可负），与 `unit` 配合使用。 |
| startsOn.unit | number | 86400000 | 否 | 偏移单位（毫秒）：`1000` 秒、`60000` 分钟、`3600000` 小时、`86400000` 天。 |
| repeat | string \| number \| null | null | 否 | 重复规则：cron 表达式或毫秒间隔。 |
| endsOn | string \| object | null | 否 | 结束条件：固定时间（string）或时间字段配置（object，结构同 `startsOn`）。 |
| limit | number | null | 否 | 最大触发次数。 |
| appends | string[] | [] | 否 | 预加载关联字段路径，用于触发上下文中的 `data`。 |

## 触发器变量
- `$context.date`：触发时刻（Date）。
- `$context.data`：仅在数据表时间字段模式（mode=1）下存在，为触发的记录数据；包含 `appends` 预加载的关联字段。

## 示例配置
### 自定义时间
```json
{
  "mode": 0,
  "startsOn": "2026-02-01T09:00:00.000Z",
  "repeat": "0 */30 * * * *",
  "endsOn": "2026-06-01T00:00:00.000Z",
  "limit": 100
}
```

### 数据表时间字段
```json
{
  "mode": 1,
  "collection": "main.orders",
  "startsOn": {
    "field": "createdAt",
    "offset": 30,
    "unit": 60000
  },
  "repeat": null,
  "endsOn": null,
  "appends": ["customer"]
}
```