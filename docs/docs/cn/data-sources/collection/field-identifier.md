---
title: "标识和编码字段"
description: "了解 NocoBase 标识和编码字段的适用场景，包括 ID、Snowflake ID、UUID、Nano ID 和自动编码。"
keywords: "标识字段,编码字段,ID,Snowflake ID,UUID,Nano ID,自动编码,NocoBase"
---

# 标识和编码字段

## 适用场景

标识和编码字段适合保存内部主键、外部同步 ID、公开访问标识和业务编号。创建前先确认这个字段是给系统定位记录用，还是给业务人员识别单据用。

| 你要保存 | 建议字段 | 适合场景 |
| --- | --- | --- |
| 默认主键 | ID、Snowflake ID (53-bit) | NocoBase 默认主键、系统内部唯一标识。 |
| 全局唯一字符串 | UUID、Nano ID | 对外同步、跨系统引用、公开链接标识。 |
| 业务编号 | 自动编码（Sequence） | 订单编号、合同编号、工单编号、资产编号。 |

## 字段来源

参考下面的来源路径，了解字段在 NocoBase 中的创建和管理方式：

- **[主数据库配置字段](../main/database.md#配置字段)**
- **[主数据库同步字段](../main/database.md#从数据库同步)**
- **[主数据库创建 SQL 数据表映射字段](../main/collection-sql.md)**
- **[主数据库连接数据库视图映射字段](../main/collection-view.md)**
- **[外部数据库同步字段](../external/database.md#从数据库同步)**
- **[REST API 数据源映射字段](../external/rest-api.md#字段映射)**

## 从 NocoBase 创建

通过**[主数据库配置字段](../main/database.md#新增字段)**在页面新增标识和编码字段。ID 这类系统主键通常通过数据表预设字段创建；自动编码这类业务编号可以按业务规则单独创建。

![add_field](https://static-docs.nocobase.com/add_field.png)
![add_field_configure](https://static-docs.nocobase.com/add_field_configure.png)

### 字段配置

| 配置 | 说明 |
| --- | --- |
| Field interface | 标识和编码字段的界面类型。可以选择「ID」「Snowflake ID」「UUID」「Nano ID」「自动编码」等。 |
| Field display name | 字段在界面中显示的名称。建议区分系统标识和业务编号，比如「ID」「外部系统 ID」「合同编号」。 |
| Field name | 字段标识名称，用于 API、权限、工作流等内部引用。创建后通常不再修改，只支持字母、数字和下划线，并且必须以字母开头。 |
| Field type | 字段在 NocoBase 数据层的类型。数字主键通常使用整数或 Snowflake ID，UUID、Nano ID、自动编码通常使用字符串。 |
| Primary key | 是否作为数据表主键。普通业务表通常使用预设 ID 字段作为主键，不建议把业务编号直接作为主键。 |
| Unique | 唯一约束。外部系统 ID、UUID、Nano ID、自动编码通常需要唯一。 |
| Pattern / Sequence rule | 自动编码规则。可以配置固定前缀、日期片段、流水号位数等。 |
| Description | 字段说明。适合写清楚编号生成规则、是否对外展示、是否用于数据同步。 |

### 字段类型映射

| Field interface | 默认 Field type | 默认数据库字段类型 | 默认长度 |
| --- | --- | --- | --- |
| ID | `integer` | `serial` / `integer` |  |
| Snowflake ID (53-bit) | `bigInt` | `bigint` |  |
| UUID | `uuid` | `uuid` |  |
| Nano ID | `nanoid` 或 `string` | `varchar` | 255 |
| 自动编码（Sequence） | `sequence` 或 `string` | `varchar` | 255 |

这里的默认数据库字段类型以 PostgreSQL 为例。不同数据库最终生成的字段类型显示可能略有差异。

### 校验规则

标识和编码字段常用校验规则包括唯一、必填和格式限制。业务编号一旦被外部系统、权限、工作流或人工流程引用，就不要随意改规则。

| 校验规则 | 适合字段 | 说明 | 页面反馈 |
| --- | --- | --- | --- |
| Required | 外部系统 ID、业务编号。 | 提交记录时必须填写或生成。系统自动生成的主键通常不需要用户填写。 | 字段为空时，提交表单会提示必填错误。 |
| Unique | ID、Snowflake ID、UUID、Nano ID、自动编码。 | 保证每条记录有唯一标识。适合所有标识类字段。 | 输入重复值并提交时，会提示唯一性校验失败。 |
| Pattern | 自动编码、外部系统 ID。 | 限制编号格式。适合合同编号、工单编号、资产编号等有固定规则的字段。 | 格式不正确时，会提示格式校验失败。 |

### 页面使用效果

待截图

## 从数据源映射

外部数据库中的标识字段通常已经承担主键、唯一键或业务编号职责。NocoBase 同步字段后，需要先确认字段在原数据库中的角色，再决定映射为系统标识、普通文本、数字字段还是业务编号展示字段。

同步后，需要进入数据表的「Configure fields」检查标识字段是否识别正确。重点确认 Primary key、Record unique key、唯一约束、Field interface 和页面是否需要展示。

编辑字段配置不会修改外部数据库里的真实字段名、字段类型、主键、唯一键或索引。如果需要调整这些结构，请先在数据库侧修改，再重新同步到 NocoBase。

### 字段配置

参考上文的「从 NocoBase 创建」章节，了解字段配置的各项参数。

### 字段类型映射

从数据源同步字段时，映射顺序通常是先读取数据库字段类型、主键和唯一键，再映射为 NocoBase 的 Field type，最后根据字段用途选择 Field interface。

| 数据库字段类型或结构 | 映射后的 Field type | 常用 Field interface | 说明 |
| --- | --- | --- | --- |
| 自增整数主键 | `integer` 或 `bigInt` | ID。 | 适合已有数据库的内部主键。通常作为 Record unique key 使用。 |
| `bigint` 主键或唯一键 | `bigInt` | Snowflake ID、整数。 | 适合已有系统使用大整数 ID 的场景。需要确认前端和 API 是否按字符串处理大整数。 |
| `uuid` | `uuid` | UUID。 | 适合跨系统唯一标识。 |
| `varchar` / `char` 唯一字段 | `string` | Nano ID、自动编码、单行文本。 | 适合外部系统 ID、业务编号、公开标识等字段。 |
| 业务编号字段 | `string` | 自动编码、单行文本。 | 如果编号由外部系统继续生成，NocoBase 通常只负责展示和筛选，不负责重新生成。 |

:::warning 注意

外部数据库的主键和唯一键会影响记录定位、编辑、删除和关系字段配置。尤其是 SQL 表、数据库视图和外部数据库表，需要确认 Record unique key 指向稳定且唯一的字段。

:::

### 页面使用效果

待截图
