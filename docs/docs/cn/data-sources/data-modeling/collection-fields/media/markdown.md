---
title: "Markdown"
description: "Markdown 字段用于保存带 Markdown 语法的文本内容。"
keywords: "Markdown,markdown,内容字段,NocoBase"
---

# Markdown

## 介绍

在 NocoBase 中，**Markdown（Markdown）** 用于保存 Markdown 格式内容。

Markdown 字段适合说明文档、处理方案、知识库正文、变更记录等内容。它保存的是文本，页面展示时按 Markdown 渲染。

如果需要所见即所得编辑体验，可以选择[富文本](./rich-text.md)或 [Markdown Vditor](../../../field-markdown-vditor/index.md)。

## 适用场景

Markdown适合这些业务场景：

- 知识库正文、说明文档
- 处理方案、排障记录
- 发布说明、变更记录
- 需要轻量格式的长文本内容

## 创建配置

在数据表的「Configure fields」页面中，点击「Add field」，选择「Markdown」可以创建Markdown字段。

![20240512181311](https://static-docs.nocobase.com/20240512181311.png)

| 配置 | 说明 |
| --- | --- |
| Field interface | 字段的界面类型。Markdown对应 `markdown`，决定页面中如何录入和展示。 |
| Field display name | 字段在界面中显示的名称，比如「说明文档」「处理方案」「正文」。建议使用业务人员能直接理解的名称。 |
| Field name | 字段标识名称，用于 API、关系字段、权限、工作流等内部引用。创建后通常不再修改，只支持字母、数字和下划线，并且必须以字母开头。 |
| Field type | 字段在数据层的类型。Markdown 字段通常使用 `text` 保存内容。 |
| Default value | 默认值。新增记录时，如果用户没有填写，可以自动带出默认值。 |
| Validation rules | 校验规则。可以限制长度或必填。 |
| Description | 字段说明。适合写字段含义、填写要求、数据来源或维护人。 |

:::warning 注意

字段名创建后会被页面区块、权限、工作流和 API 引用。创建前先确认命名，避免后续修改带来配置调整成本。

:::

## 字段特性

Markdown字段的默认行为如下：

| 特性 | 说明 |
| --- | --- |
| 默认 Field interface | `markdown`。 |
| 默认 Field type | `text`。 |
| 可选 Field type | `text`、`string`，以实际字段配置为准。 |
| 页面组件 | 编辑模式使用 Markdown 编辑组件。 |
| 筛选 | 支持文本类筛选，比如包含、为空、不为空。 |
| 排序 | 通常不用于排序。 |
| 校验 | 支持长度、必填等文本校验。 |

## 编辑配置

创建后，点击字段右侧的「Edit」可以编辑Markdown字段配置。编辑字段主要用于调整字段在 NocoBase 中的展示和使用方式，比如修改显示名称、说明、默认值、校验规则或字段专属配置。

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

点击字段右侧的「Delete」可以删除Markdown字段。主数据库中还可以勾选多个字段后批量删除。

删除主数据库中新建的Markdown字段时，通常会同时删除数据库中的真实列及该列已有数据。删除从数据库同步或外部数据源映射出的字段时，影响范围取决于对应数据源和字段来源。

:::danger 警告

删除字段可能影响页面区块、表单、筛选、权限、工作流、API、导入导出和已有数据。删除前先确认字段是否仍被业务配置引用。

:::

## 页面配置使用

Markdown 字段适合在内容编辑和详情展示中使用。
![20260709230801](https://static-docs.nocobase.com/20260709230801.png)

| 场景 | 用途 |
| --- | --- |
| 表单区块 | 编辑 Markdown 内容。 |
| 详情区块 | 按 Markdown 渲染展示。 |
| 表格区块 | 展示摘要内容。 |
| 工作流 | 把正文作为通知或文档生成内容。 |

## 相关链接

- [字段](../index.md) — 了解字段的作用、分类和映射逻辑
- [普通表](../../../data-source-main/general-collection.md) — 在普通表中创建和管理字段
- [Markdown Vditor](../../../field-markdown-vditor/index.md) — 使用 Vditor 编辑 Markdown
- [富文本](./rich-text.md) — 使用富文本编辑内容
- [多行文本](../basic/textarea.md) — 保存纯文本长内容
