---
title: "文件表"
description: "文件表保存文件标题、文件名、大小、MIME 类型、路径、URL、预览地址、存储位置和扩展元信息，用于附件字段关联。"
keywords: "文件表,File Collection,attachments,元信息,附件,NocoBase"
---

# 文件表

<PluginInfo name="file-manager"></PluginInfo>

## 介绍

文件表适合保存文件元信息，比如文件名、扩展名、大小、MIME 类型、路径、URL、预览地址、存储位置和自定义 meta。文件本体由文件存储引擎保存，文件表保存的是文件元数据。

文件表只能通过主数据库页面创建，外部数据库、REST API 数据源和外部 NocoBase 数据源不支持创建文件表。

## 适用场景

文件表适合这些业务场景：

- 合同附件、发票文件、报销凭证
- 产品图片、员工证件、项目文档
- 业务记录的上传文件、预览文件和下载文件
- 需要单独管理文件元信息的附件库

## 使用流程

文件表通常不直接作为主业务表使用。常见流程是：

1. 创建文件表，用来保存文件标题、文件名、大小、类型、URL、存储位置等元信息。
2. 在业务表中创建关系字段，关联到文件表。比如在「合同」表中关联「合同附件」文件表。
3. 在业务表的表单区块中添加关系字段，让用户在新增或编辑业务记录时上传文件。
4. 上传完成后，NocoBase 会把文件元信息写入文件表，并通过关系字段把文件记录关联到当前业务记录。
5. 在业务表的详情区块、表格区块或列表区块中展示附件字段，让用户查看、预览或下载文件。

## 创建配置

在主数据库中点击「Create collection」，选择「File collection」可以创建文件表。

![20240324090414](https://static-docs.nocobase.com/20240324090414.png)

文件表的创建配置与普通表基本一致。文件表会预置一组文件元信息字段，用来保存上传文件的标题、路径、URL、存储位置和扩展信息。

| 配置 | 说明 |
| --- | --- |
| Collection display name | 数据表在界面中显示的名称，比如「合同附件」「发票文件」「产品图片」。 |
| Collection name | 数据表的标识名称，用于 API、关系字段、权限、工作流等内部引用。 |
| Categories | 数据表分类。分类只影响数据表管理界面的组织方式，不改变数据表结构。 |
| Description | 数据表说明。可以写这个文件表保存什么文件、由谁上传、和哪些业务表有关。 |
| Preset fields | 预设字段。创建文件表时建议保留系统字段和文件表内置字段。 |

### 内置字段

文件表创建后通常包含这些内置字段。文件本体保存在文件存储中，文件表保存的是这些元信息。

| 字段 | 字段名 | 说明 |
| --- | --- | --- |
| ID | `id` | 默认主键字段，用于唯一标识一条文件记录。 |
| Title | `title` | 文件标题，通常用于界面展示。 |
| File name | `filename` | 文件名。 |
| Extension name | `extname` | 文件扩展名。 |
| Size | `size` | 文件大小。 |
| MIME type | `mimetype` | 文件 MIME 类型。 |
| Path | `path` | 文件在存储中的路径。 |
| URL | `url` | 文件访问地址。 |
| Preview | `preview` | 文件预览地址。 |
| Storage | `storage` / `storageId` | 文件所属存储。`storage` 是关系字段，`storageId` 是对应外键。 |
| Meta | `meta` | 文件扩展元信息。 |
| 创建时间 | `createdAt` | 自动记录文件记录的创建时间。 |
| 创建人 | `createdBy` | 自动记录上传或创建文件记录的用户。 |
| 更新时间 | `updatedAt` | 自动记录文件记录最后一次更新的时间。 |
| 更新人 | `updatedBy` | 自动记录最后一次更新文件记录的用户。 |
| 空间 | `space` | 启用[多空间插件](../../multi-app/multi-space/index.md)后可用，用于按空间隔离数据。没有启用多空间时不会出现。 |

![20240324090527](https://static-docs.nocobase.com/20240324090527.png)

### 主键字段

文件表和普通表一样需要主键字段。附件字段和关系字段会通过主键记录关联文件元信息。

如果文件表没有主键，需要在编辑数据表时设置「Record unique key」，否则附件记录可能无法正确关联、预览或编辑。

## 建立关联关系
在业务表中创建关系字段，关联到文件表。

![20240324091529](https://static-docs.nocobase.com/20240324091529.png)

## 页面配置使用

文件表的数据通常通过附件组件上传自动生成。在表单区块、详情区块或关系区块中使用。

![20260710160424](https://static-docs.nocobase.com/20260710160424.png)

![20240324091321](https://static-docs.nocobase.com/20240324091321.png)

| 配置位置 | 用途 |
| --- | --- |
| [表单区块](../../interface-builder/blocks/data-blocks/form.md) | 在业务表记录中上传附件。 |
| [详情区块](../../interface-builder/blocks/data-blocks/details.md) | 展示、预览或下载附件。 |
| [表格区块](../../interface-builder/blocks/data-blocks/table.md) | 在列表中展示附件字段。 |
| [关系区块](../../interface-builder/blocks/data-blocks/table.md) | 直接管理关联到当前业务记录的文件记录。 |


## 编辑配置

在数据表列表中，点击文件表右侧的「Edit」，可以修改数据表显示名称、分类、说明、简单分页模式和「Record unique key」等配置。

文件元信息字段通常由上传过程自动写入，不建议把 `url`、`path`、`storageId` 等字段改成其他业务含义。如果需要扩展文件业务信息，可以新增字段，比如「文件类型」「所属阶段」「是否归档」。

## 删除数据表

在数据表列表中，点击文件表右侧的「Delete」，可以删除文件表。

删除文件表会删除文件元信息记录和相关 Collection 元数据。删除前先确认业务表中的附件字段、关系字段、页面区块、权限、工作流和 API 是否仍然依赖它。

:::danger 警告

文件表保存的是文件元信息。删除文件表记录可能导致业务记录里的附件引用失效；是否同步删除文件本体取决于文件存储和业务配置。操作前先确认文件是否仍被业务使用。

:::

## 相关链接

- [普通表](../data-source-main/general-collection.md) — 查看通用配置和区块使用方式
- [数据表字段](../data-modeling/collection-fields/index.md) — 查看附件字段和关系字段配置
- [文件管理器](../../plugins/@nocobase/plugin-file-manager/index.md) — 查看文件存储相关配置
- [多空间](../../multi-app/multi-space/index.md) — 了解空间字段和空间隔离能力
