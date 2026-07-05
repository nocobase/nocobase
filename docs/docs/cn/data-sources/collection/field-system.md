---
title: "系统字段"
description: "了解 NocoBase 系统字段的用途，包括 ID、创建时间、创建人、更新时间、更新人和 Table OID。"
keywords: "系统字段,系统信息字段,ID,创建时间,创建人,更新时间,更新人,Table OID,NocoBase"
---

# 系统字段

## 适用场景

系统字段由 NocoBase 或数据库维护，通常不作为普通业务字段手动创建。普通业务表通常建议保留 ID、创建时间、创建人、更新时间、更新人这些预设字段，它们对权限、审计、工作流和数据排查都有帮助。

| 你要记录 | 建议字段 | 适合场景 |
| --- | --- | --- |
| 记录唯一标识 | ID | 关系字段、API、权限、工作流、记录定位。 |
| 记录创建时间 | 创建时间 | 排序、筛选、审计、报表。 |
| 记录创建人 | 创建人 | 责任追踪、权限控制、协作记录。 |
| 记录更新时间 | 更新时间 | 审计、同步判断、最近修改排序。 |
| 记录更新人 | 更新人 | 协作追踪、审计、责任定位。 |
| PostgreSQL 表识别 | Table OID | 继承表、底层表识别等特殊场景。 |

## 字段来源

参考下面的来源路径，了解字段在 NocoBase 中的创建和管理方式：

- **[主数据库配置字段](../main/database.md#配置字段)**
- **[主数据库同步字段](../main/database.md#从数据库同步)**
- **[主数据库创建 SQL 数据表映射字段](../main/collection-sql.md)**
- **[主数据库连接数据库视图映射字段](../main/collection-view.md)**
- **[外部数据库同步字段](../external/database.md#从数据库同步)**
- **[REST API 数据源映射字段](../external/rest-api.md#字段映射)**

## 从 NocoBase 创建

系统字段通常在创建数据表时通过「Preset fields」一起创建，而不是在字段列表里作为普通字段逐个新增。后续也可以在「Configure fields」中调整显示名称、标题字段、描述和页面显示方式。

![add_field](https://static-docs.nocobase.com/add_field.png)
![add_field_configure](https://static-docs.nocobase.com/add_field_configure.png)

### 字段配置

| 配置 | 说明 |
| --- | --- |
| Field interface | 系统字段的界面类型。常见包括「ID」「创建时间」「创建人」「更新时间」「更新人」「Table OID」。 |
| Field display name | 字段在界面中显示的名称。通常保留「ID」「创建时间」「创建人」这类清晰名称即可。 |
| Field name | 字段标识名称，用于 API、权限、工作流等内部引用。系统字段创建后不建议修改。 |
| Field type | 字段在 NocoBase 数据层的类型。ID 通常是数字标识，创建时间和更新时间是日期时间，创建人和更新人通常是用户关系字段。 |
| Preset fields | 创建数据表时是否自动添加系统字段。普通业务表通常建议保留。 |
| Title field | 是否作为记录标题字段。系统字段通常不作为标题字段，除非业务上确实需要用 ID 展示记录。 |
| Description | 字段说明。适合写清楚字段是否由系统自动维护，以及业务人员是否需要关注。 |

### 字段类型映射

| Field interface | 默认 Field type | 默认数据库字段类型 | 默认长度 |
| --- | --- | --- | --- |
| ID | `integer` 或 `bigInt` | `serial` / `bigint` |  |
| 创建时间 | `createdAt` | `timestamptz` |  |
| 创建人 | `createdBy` | 用户关系字段 |  |
| 更新时间 | `updatedAt` | `timestamptz` |  |
| 更新人 | `updatedBy` | 用户关系字段 |  |
| Table OID | `tableoid` | PostgreSQL 系统字段 |  |

这里的默认数据库字段类型以 PostgreSQL 为例。不同数据库最终生成的字段类型显示可能略有差异。

### 校验规则

系统字段通常由 NocoBase 或数据库自动维护，不建议按普通字段手动配置复杂校验。更常见的配置是控制是否显示、是否可编辑、是否用于排序筛选和权限判断。

| 规则 | 适合字段 | 说明 | 页面反馈 |
| --- | --- | --- | --- |
| Auto generated | ID、创建时间、更新时间。 | 字段值由系统或数据库自动生成。用户通常不需要手动填写。 | 新建记录时自动生成或自动写入。 |
| Auto maintained | 创建人、更新人。 | 字段值由当前登录用户和操作行为维护。 | 创建或更新记录后自动写入用户信息。 |
| Readonly | ID、创建时间、创建人、更新时间、更新人。 | 系统字段通常只读展示，避免业务人员误改审计信息。 | 页面中通常展示为只读内容。 |

### 页面使用效果

待截图

## 从数据源映射

外部数据库中的系统字段可能只是普通数据库列，比如 `created_at`、`updated_at`、`created_by`。NocoBase 同步字段后，需要根据字段类型和业务含义判断是否映射为系统字段界面，还是按普通日期、文本、数字或关系字段处理。

同步后，需要进入数据表的「Configure fields」检查系统字段是否识别正确。重点确认主键、Record unique key、创建更新时间字段、创建更新人字段，以及这些字段是否应该在页面中展示。

编辑字段配置不会修改外部数据库里的真实字段名、字段类型、默认值、触发器或索引。如果这些字段由外部系统或数据库触发器维护，NocoBase 只负责读取和展示。

### 字段配置

参考上文的「从 NocoBase 创建」章节，了解字段配置的各项参数。

### 字段类型映射

从数据源同步字段时，映射顺序通常是先读取数据库字段类型和约束，再映射为 NocoBase 的 Field type，最后根据字段名称和维护方式选择 Field interface。

| 数据库字段类型或结构 | 映射后的 Field type | 常用 Field interface | 说明 |
| --- | --- | --- | --- |
| 主键字段 | `integer` / `bigInt` / `uuid` / `string` | ID 或对应标识字段。 | 适合作为 Record unique key，用于记录定位和关系字段配置。 |
| `created_at` / `create_time` | `datetime` | 创建时间、日期时间。 | 如果由外部数据库或原业务系统维护，可以映射为创建时间或普通日期时间字段。 |
| `updated_at` / `update_time` | `datetime` | 更新时间、日期时间。 | 如果由外部数据库或原业务系统维护，可以映射为更新时间或普通日期时间字段。 |
| `created_by` / `creator_id` | `integer` / `string` | 创建人、关系字段、单行文本。 | 如果能关联到用户表，可以配置关系字段；否则可以作为普通文本或数字字段展示。 |
| `updated_by` / `updater_id` | `integer` / `string` | 更新人、关系字段、单行文本。 | 如果能关联到用户表，可以配置关系字段；否则可以作为普通文本或数字字段展示。 |
| PostgreSQL `tableoid` | `tableoid` | Table OID。 | 适合 PostgreSQL 继承表等特殊场景。 |

:::warning 注意

外部数据库中的 `created_at`、`updated_at`、`created_by` 这类字段不一定由 NocoBase 维护。接入前要确认这些字段由谁写入、何时更新，避免把外部系统维护的审计字段误认为 NocoBase 自动维护字段。

:::

### 页面使用效果

待截图
