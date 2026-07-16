---
title: "日期和时间字段"
description: "了解 NocoBase 日期和时间字段的适用场景，包括日期时间、日期、时间和 Unix Timestamp。"
keywords: "日期字段,时间字段,日期时间,Unix Timestamp,NocoBase"
---

# 日期和时间字段

## 适用场景

日期和时间字段适合保存时间点、日期、时间、外部系统时间戳等。创建前先确认业务是否跨时区，以及字段保存的是完整时间、只有日期、只有时间，还是外部系统时间戳。

| 你要保存 | 建议字段 | 适合场景 |
| --- | --- | --- |
| 跨时区时间点 | 日期时间（带时区） | 跨地区会议时间、全球团队任务截止时间、跨时区工单 SLA。 |
| 本地业务时间点 | 日期时间（不带时区） | 没有跨时区业务的本地预约开始时间、门店活动时间、项目排期。 |
| 只有日期 | 日期 | 生日、入职日期、发票日期、项目开始日期。 |
| 只有时间 | 时间 | 每日打卡时间、营业开始时间、提醒时间。 |
| 时间戳 | Unix Timestamp | 接入外部系统、日志数据、已有数据库中使用时间戳的字段。 |

## 字段来源

参考下面的来源路径，了解字段在 NocoBase 中的创建和管理方式：

- **[主数据库配置字段](../main/database.md#配置字段)**
- **[主数据库同步字段](../main/database.md#从数据库同步)**
- **[主数据库创建 SQL 数据表映射字段](../main/collection-sql.md)**
- **[主数据库连接数据库视图映射字段](../main/collection-view.md)**
- **[外部数据库同步字段](../external/database.md#从数据库同步)**
- **[REST API 数据源映射字段](../external/rest-api.md#字段映射)**

## 从 NocoBase 创建

通过**[主数据库配置字段](../main/database.md#新增字段)**在页面新增日期和时间字段。创建时重点确认 Field interface、Field type、默认值、时区处理、是否必填和展示格式。

![add_field](https://static-docs.nocobase.com/add_field.png)
![add_field_configure](https://static-docs.nocobase.com/add_field_configure.png)

### 字段配置

| 配置 | 说明 |
| --- | --- |
| Field interface | 日期和时间字段的界面类型。可以选择「日期时间」「日期时间（不带时区）」「日期」「时间」「Unix Timestamp」等。 |
| Field display name | 字段在界面中显示的名称。建议使用业务人员能直接理解的名称，比如「预约时间」「入职日期」「营业开始时间」。 |
| Field name | 字段标识名称，用于 API、权限、工作流等内部引用。创建后通常不再修改，只支持字母、数字和下划线，并且必须以字母开头。 |
| Field type | 字段在 NocoBase 数据层的类型。日期时间通常使用 `datetime`，日期使用 `date`，时间使用 `time`，Unix Timestamp 使用数字时间戳。 |
| Default value | 默认值。适合创建记录时自动带出当前时间、当前日期或固定时间。 |
| Required | 必填。适合开始时间、截止时间、发票日期等业务流程必须录入的字段。 |
| Validation rules | 日期和时间字段的校验规则。常用于限制必填、时间范围、开始时间和结束时间的前后关系。 |
| Description | 字段说明。适合写清楚时区口径、日期格式和时间含义，比如「按门店当地时间填写」。 |

### 字段类型映射

| Field interface | 默认 Field type | 默认数据库字段类型 | 默认长度 |
| --- | --- | --- | --- |
| 日期时间（带时区） | `datetime` | `timestamptz` |  |
| 日期时间（不带时区） | `datetimeNoTz` | `timestamp` |  |
| 日期 | `date` | `date` |  |
| 时间 | `time` | `time` |  |
| Unix Timestamp | `unixTimestamp` | `bigint` |  |

这里的默认数据库字段类型以 PostgreSQL 为例。不同数据库最终生成的字段类型显示可能略有差异。

### 校验规则

日期和时间字段常用校验规则包括必填、最早时间、最晚时间和时间范围。涉及跨时区协作时，优先明确使用带时区还是不带时区的日期时间。

| 校验规则 | 适合字段 | 说明 | 页面反馈 |
| --- | --- | --- | --- |
| Required | 日期时间、日期、时间、Unix Timestamp。 | 提交记录时必须填写。适合开始时间、截止日期、发票日期等核心字段。 | 字段为空时，提交表单会提示必填错误。 |
| Min date / time | 日期时间、日期、时间。 | 限制最早可选时间。适合预约时间不能早于当前时间、合同开始日期不能早于某个日期等场景。 | 选择早于规则的时间时，会提示范围错误。 |
| Max date / time | 日期时间、日期、时间。 | 限制最晚可选时间。适合活动结束时间不能晚于项目周期等场景。 | 选择晚于规则的时间时，会提示范围错误。 |
| Range rule | 日期时间、日期。 | 用于开始时间和结束时间之间的关系校验。 | 开始时间晚于结束时间时，会提示时间范围不正确。 |

### 页面使用效果

待截图

## 从数据源映射

外部数据库中的日期和时间字段通常已经定义了真实字段类型和时区语义。NocoBase 同步字段后，需要把数据库字段类型映射为 Field type，再根据业务含义选择 Field interface。

同步后，需要进入数据表的「Configure fields」检查日期和时间字段是否识别正确。重点确认 Field interface、时区口径、显示格式、默认值和说明。

编辑字段配置不会修改外部数据库里的真实字段名、字段类型、默认值或索引。如果需要调整这些结构，请先在数据库侧修改，再重新同步到 NocoBase。

### 字段配置

参考上文的「从 NocoBase 创建」章节，了解字段配置的各项参数。

### 字段类型映射

从数据源同步字段时，映射顺序通常是先读取数据库字段类型，再映射为 NocoBase 的 Field type，最后根据字段名称和业务含义选择 Field interface。

| 数据库字段类型 | 映射后的 Field type | 常用 Field interface | 说明 |
| --- | --- | --- | --- |
| `timestamp with time zone` / `timestamptz` | `datetime` | 日期时间（带时区）。 | 适合跨时区协作、系统日志、统一时间线等场景。 |
| `timestamp` / `datetime` | `datetime` 或 `datetimeNoTz` | 日期时间、日期时间（不带时区）。 | 需要结合数据库语义判断是否包含时区。MySQL 的 `datetime` 通常按本地业务时间理解。 |
| `date` | `date` | 日期。 | 适合生日、入职日期、发票日期等没有具体时间点的字段。 |
| `time` | `time` | 时间。 | 适合营业时间、打卡时间、提醒时间等每天重复的时间值。 |
| `bigint` / `integer` | `bigInt` 或 `integer` | Unix Timestamp。 | 适合已有系统使用秒级或毫秒级时间戳的字段。需要确认时间戳单位。 |

:::warning 注意

字段映射只改变 NocoBase 如何理解和展示字段，不会改变外部数据库中的真实字段结构。时间字段最容易出错的是时区和时间戳单位，接入前建议用几条真实数据核对页面展示是否符合预期。

:::

### 页面使用效果

待截图
