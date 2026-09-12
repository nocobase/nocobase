---
pkg: "@nocobase/plugin-collection-tree"
title: "树表"
description: "树表用于保存组织架构、商品分类、地区层级、部门目录等上下级数据，采用邻接表结构保存父子关系。"
keywords: "树表,树形集合,邻接表,层次数据,Tree Collection,NocoBase"
---

# 树表

## 介绍

树表适合保存有上下级关系的数据，比如组织架构、商品分类、地区层级、部门目录、知识库目录。树表使用邻接表结构保存父子关系，每条记录都可以指向自己的父节点。

树表只能通过主数据库页面创建，外部数据库、REST API 数据源和外部 NocoBase 数据源不支持创建树表。

## 适用场景

树表适合这些业务场景：

- 公司组织架构、部门层级
- 商品分类、知识库目录、文档目录
- 省市区、销售区域、服务网点层级
- BOM 分类、设备分类、资产分类

## 创建配置

在主数据库中点击「Create collection」，选择「Tree collection」可以创建树表。

![20240324143228](https://static-docs.nocobase.com/20240324143228.png)

树表的创建配置与普通表基本一致。

| 配置 | 说明 |
| --- | --- |
| Collection display name | 数据表在界面中显示的名称，比如「组织架构」「商品分类」「地区层级」。 |
| Collection name | 数据表的标识名称，用于 API、关系字段、权限、工作流等内部引用。 |
| Inherits | 选择要继承的父表。只有主数据库是 PostgreSQL 时可见。 |
| Categories | 数据表分类。分类只影响数据表管理界面的组织方式，不改变数据表结构。 |
| Description | 数据表说明。可以写这个树表保存什么层级数据、由谁维护、用于哪些页面筛选。 |
| Preset fields | 预设字段。创建树表时建议保留系统字段和树表内置字段。 |

### 内置字段

树表创建后通常包含这些内置字段。`parentId`、`parent` 和 `children` 用来保存树形层级关系。

| 字段 | 字段名 | 说明 |
| --- | --- | --- |
| ID | `id` | 默认主键字段，用于唯一标识一条记录。 |
| 创建时间 | `createdAt` | 自动记录这条记录的创建时间。 |
| 创建人 | `createdBy` | 自动记录创建这条记录的用户。 |
| 更新时间 | `updatedAt` | 自动记录这条记录最后一次更新的时间。 |
| 更新人 | `updatedBy` | 自动记录最后一次更新这条记录的用户。 |
| Parent ID | `parentId` | 保存父节点 ID。根节点通常为空。 |
| Parent | `parent` | 多对一关系字段，指向当前表中的父节点。 |
| Children | `children` | 一对多关系字段，表示当前节点的子节点。 |
| 空间 | `space` | 启用[多空间插件](../../multi-app/multi-space/index.md)后可用，用于按空间隔离数据。没有启用多空间时不会出现。 |

![20240324143555](https://static-docs.nocobase.com/20240324143555.png)

:::warning 注意

树表数据要避免形成循环关系，比如 A 的父节点是 B，B 的父节点又是 A。循环关系会让树形展示和筛选结果异常。

:::

### 主键字段

树表和普通表一样需要主键字段。树形关系字段会通过父节点 ID 关联到同一张表中的主键记录。

如果树表没有主键，需要在编辑数据表时设置「Record unique key」，否则页面区块可能无法正确查看或编辑记录，树形展示也可能无法稳定定位节点。

## 页面配置使用

树表可以使用[普通表](../data-source-main/general-collection.md)的多数数据区块做增删改查。另外，它还可以配合树形能力使用：

| 区块 | 用途 |
| --- | --- |
| [表格区块](../../interface-builder/blocks/data-blocks/table.md#启用树表) | 展示树形记录，用于查看和维护上下级结构。 |
| [表单区块](../../interface-builder/blocks/data-blocks/form.md) | 新增或编辑单条树节点记录。 |
| [详情区块](../../interface-builder/blocks/data-blocks/details.md) | 查看单条树节点详情。 |
| [树筛选区块](../../interface-builder/blocks/filter-blocks/tree.md) | 用树结构筛选其他数据区块，常用于分类、组织、地区等层级筛选。 |

## 编辑配置

在数据表列表中，点击树表右侧的「Edit」，可以修改数据表显示名称、分类、说明、简单分页模式和「Record unique key」等配置。

树表的父子关系字段通常不建议随意删除或改为其他用途。如果要调整层级结构，优先在记录数据中修改父节点关系。

## 删除数据表

在数据表列表中，点击树表右侧的「Delete」，可以删除树表。

删除树表会删除这张表的 Collection 元数据、真实数据表和树形关系数据。删除前先确认页面区块、树筛选区块、关系字段、权限、工作流和 API 是否仍然依赖它。

:::danger 警告

树表经常被用作其他区块的筛选条件。删除树表后，相关树筛选区块和依赖该分类层级的页面配置都可能失效。

:::

## 相关链接

- [普通表](../data-source-main/general-collection.md) — 查看通用配置和区块使用方式
- [表格区块](../../interface-builder/blocks/data-blocks/table.md) — 在表格中启用树表展示
- [树筛选区块](../../interface-builder/blocks/filter-blocks/tree.md) — 使用树结构筛选数据
- [多空间](../../multi-app/multi-space/index.md) — 了解空间字段和空间隔离能力
