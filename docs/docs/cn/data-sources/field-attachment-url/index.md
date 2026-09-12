---
title: "附件 URL"
description: "附件 URL 字段用于保存外部文件地址，适合不上传文件本体的场景。"
keywords: "附件 URL,attachment url,外部文件,URL,NocoBase"
---

# 附件 URL

## 介绍

在 NocoBase 中，**附件 URL（Attachment URL）** 用于保存外部文件访问地址。

附件 URL 字段适合文件已经存放在外部系统、对象存储或 CDN 中，只需要在 NocoBase 中保存访问地址的场景。

如果需要由 NocoBase 上传和管理文件，选择[附件](../file-manager/field-attachment.md)。如果只是普通网页地址，选择 [URL](../data-modeling/collection-fields/basic/url.md)。

## 适用场景

附件 URL适合这些业务场景：

- 外部对象存储文件地址
- CDN 图片地址
- 第三方系统文档地址
- 历史数据迁移后的文件链接

## 创建配置

在数据表的「Configure fields」页面中，点击「Add field」，选择「附件 URL」可以创建附件 URL字段。

![20241017092323](https://static-docs.nocobase.com/20241017092323.png)

![20241017092456](https://static-docs.nocobase.com/20241017092456.png)

![20241017092759](https://static-docs.nocobase.com/20241017092759.png)

| 配置 | 说明 |
| --- | --- |
| Field interface | 字段的界面类型。附件 URL对应 `attachmentUrl`，决定页面中如何录入和展示。 |
| Field display name | 字段在界面中显示的名称，比如「文件地址」「图片 URL」「外部附件」。建议使用业务人员能直接理解的名称。 |
| Field name | 字段标识名称，用于 API、关系字段、权限、工作流等内部引用。创建后通常不再修改，只支持字母、数字和下划线，并且必须以字母开头。 |
| Field type | 字段在数据层的类型。附件 URL 通常使用 `string` 或 `text` 保存地址。 |
| Default value | 默认值。新增记录时，如果用户没有填写，可以自动带出默认值。 |
| Validation rules | 校验规则。可以配置 URL 格式、长度或必填。 |
| Description | 字段说明。适合写字段含义、填写要求、数据来源或维护人。 |

:::warning 注意

字段名创建后会被页面区块、权限、工作流和 API 引用。创建前先确认命名，避免后续修改带来配置调整成本。

:::

## 字段特性

附件 URL字段的默认行为如下：

| 特性 | 说明 |
| --- | --- |
| 默认 Field interface | `attachmentUrl`。 |
| 默认 Field type | `string`。 |
| 可选 Field type | `string`、`text`，以实际字段配置为准。 |
| 页面组件 | 编辑模式使用 URL 或附件地址输入组件。 |
| 筛选 | 支持文本类筛选和为空判断。 |
| 排序 | 通常不用于排序。 |
| 校验 | 支持 URL 格式、长度、必填等校验。 |

## 编辑配置

创建后，点击字段右侧的「Edit」可以编辑附件 URL字段配置。编辑字段主要用于调整字段在 NocoBase 中的展示和使用方式，比如修改显示名称、说明、默认值、校验规则或字段专属配置。

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

点击字段右侧的「Delete」可以删除附件 URL字段。主数据库中还可以勾选多个字段后批量删除。

删除主数据库中新建的附件 URL字段时，通常会同时删除数据库中的真实列及该列已有数据。删除从数据库同步或外部数据源映射出的字段时，影响范围取决于对应数据源和字段来源。

:::danger 警告

删除字段可能影响页面区块、表单、筛选、权限、工作流、API、导入导出和已有数据。删除前先确认字段是否仍被业务配置引用。

:::

## 页面配置使用

附件 URL 字段适合展示和访问外部文件。
![20260709231803](https://static-docs.nocobase.com/20260709231803.png)

| 场景 | 用途 |
| --- | --- |
| 表单区块 | 录入外部文件地址。 |
| 详情区块 | 展示文件链接。 |
| 表格区块 | 展示链接或缩略入口。 |
| 工作流 | 把文件地址放入通知或外部请求。 |

## 相关链接

- [字段](../index.md) — 了解字段的作用、分类和映射逻辑
- [普通表](../data-source-main/general-collection.md) — 在普通表中创建和管理字段
- [附件](../file-manager/field-attachment.md) — 上传和关联 NocoBase 文件
- [URL](../data-modeling/collection-fields/basic/url.md) — 保存普通链接
