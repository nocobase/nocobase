---
title: "Nano ID"
description: "Nano ID 字段用于生成较短的随机唯一标识。"
keywords: "Nano ID,nanoid,唯一标识,NocoBase"
---

# Nano ID

## 介绍

在 NocoBase 中，**Nano ID（Nano ID）** 用于生成短随机唯一 ID。

Nano ID 适合短链接、公开编号、外部引用 ID 等需要较短字符串标识的场景。

如果要作为默认内部主键，Snowflake ID 通常更直接。如果要可读业务编号，选择[序列](../../../field-sequence/index.md)。

## 适用场景

Nano ID适合这些业务场景：

- 短链接标识
- 公开分享 ID
- 外部引用编号
- 较短的随机唯一字符串

## 创建配置

在数据表的「Configure fields」页面中，点击「Add field」，选择「Nano ID」可以创建Nano ID字段。

![20240512173225](https://static-docs.nocobase.com/20240512173225.png)

| 配置 | 说明 |
| --- | --- |
| Field interface | 字段的界面类型。Nano ID对应 `nanoId`，决定页面中如何录入和展示。 |
| Field display name | 字段在界面中显示的名称，比如「分享 ID」「公开 ID」「短标识」。建议使用业务人员能直接理解的名称。 |
| Field name | 字段标识名称，用于 API、关系字段、权限、工作流等内部引用。创建后通常不再修改，只支持字母、数字和下划线，并且必须以字母开头。 |
| Field type | 字段在数据层的类型。Nano ID 默认使用 `string`。 |
| Default value | 默认值。新增记录时，如果用户没有填写，可以自动带出默认值。 |
| Validation rules | 通常由系统自动生成，不需要手工校验。 |
| Description | 字段说明。适合写字段含义、填写要求、数据来源或维护人。 |

:::warning 注意

字段名创建后会被页面区块、权限、工作流和 API 引用。创建前先确认命名，避免后续修改带来配置调整成本。

:::

## 字段特性

Nano ID字段的默认行为如下：

| 特性 | 说明 |
| --- | --- |
| 默认 Field interface | `nanoId`。 |
| 默认 Field type | `string`。 |
| 可选 Field type | `string`。 |
| 页面组件 | 通常自动生成，不需要人工录入。 |
| 筛选 | 支持按 Nano ID 精确查询。 |
| 排序 | 通常不按 Nano ID 做业务排序。 |
| 校验 | 通常自动生成并保持唯一。 |

## 编辑配置

创建后，点击字段右侧的「Edit」可以编辑Nano ID字段配置。编辑字段主要用于调整字段在 NocoBase 中的展示和使用方式，比如修改显示名称、说明、默认值、校验规则或字段专属配置。

如果字段来自主数据库中已经同步的表，编辑时通常是在做字段映射——把数据库字段映射为 NocoBase 的 Field type 和 Field interface。

| 配置 | 允许编辑 | 说明 |
| --- | --- | --- |
| Field display name | 是 | 修改字段在界面中的显示名称，不改变字段标识名称。 |
| Field name | 否 | 字段标识名称创建后通常不能在编辑表单中修改。 |
| Field interface | 条件支持 | 主数据库字段或同步字段在字段映射时可以调整。调整后会影响页面输入、展示和校验方式。 |
| Field type | 条件支持 | 主数据库字段或同步字段在字段映射时可以调整。调整前需要确认已有数据能否按新类型使用。 |
| Default value | 是 | 调整新增记录时的默认值。 |
| Validation rules | 是 | 调整字段校验规则。 |
| Description | 是 | 补充字段含义、填写要求、数据来源或维护人。 |

:::warning 注意

切换 Field type 或 Field interface 不等于简单改一个显示名称。它会影响字段的存储方式、输入组件、校验规则、筛选条件和工作流变量使用方式。已有数据较多时，先确认数据格式是否匹配。

:::

## 删除字段

点击字段右侧的「Delete」可以删除Nano ID字段。主数据库中还可以勾选多个字段后批量删除。

删除主数据库中新建的Nano ID字段时，通常会同时删除数据库中的真实列及该列已有数据。删除从数据库同步或外部数据源映射出的字段时，影响范围取决于对应数据源和字段来源。

:::danger 警告

删除字段可能影响页面区块、表单、筛选、权限、工作流、API、导入导出和已有数据。删除前先确认字段是否仍被业务配置引用。

:::

## 页面配置使用

Nano ID 字段适合公开短标识和外部引用场景。
![20260710151321](https://static-docs.nocobase.com/20260710151321.png)

| 场景 | 用途 |
| --- | --- |
| 表单区块 | 通常不手工编辑，由系统生成。 |
| 详情区块 | 展示短标识。 |
| API | 作为记录公开标识。 |
| 外部链接 | 作为短链接或分享链接的一部分。 |

## 相关链接

- [字段](../index.md) — 了解字段的作用、分类和映射逻辑
- [普通表](../../../data-source-main/general-collection.md) — 在普通表中创建和管理字段
- [Snowflake ID](./snowflake-id.md) — 使用默认内部 ID
- [UUID](./uuid.md) — 使用 UUID
- [序列](../../../field-sequence/index.md) — 生成可读业务编号
