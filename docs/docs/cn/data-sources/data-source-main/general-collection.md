---
pkg: "@nocobase/plugin-data-source-main"
title: "普通表"
description: "普通表适合保存客户、订单、合同、工单、项目、任务等常规业务数据，支持常用系统字段、主键配置和页面区块搭建。"
keywords: "普通表,General Collection,系统字段,数据表,NocoBase"
---

# 普通表

## 介绍

普通表是最常用的数据表类型，适合保存客户、订单、合同、工单、报销单、项目、任务等常规业务数据。大部分业务对象没有特殊结构要求时，默认使用普通表就够了。

普通表可以来自这些数据源：

- 在主数据库中创建的新表
- 从主数据库同步的已有真实表
- 从外部数据库接入的已有真实表
- REST API 映射出的资源
- 外部 NocoBase 应用中的数据表

这些数据在 NocoBase 中都会按普通表方式使用。区别在于：主数据库中的普通表可以由 NocoBase 创建和维护真实表结构；外部数据源中的普通表通常只读取已有结构，真实表结构仍由外部系统维护。

## 适用场景

普通表适合这些业务场景：

- 客户、联系人、商机、合同等 CRM 数据
- 订单、发货单、退货单、发票等交易数据
- 工单、任务、项目、需求等协作数据
- 报销单、采购单、付款申请等流程数据
- 设备、资产、产品、门店等基础资料



## 创建配置

在主数据库中点击「Create collection」，选择「General collection」可以创建普通表。

![20240324085739](https://static-docs.nocobase.com/20240324085739.png)

| 配置 | 说明 |
| --- | --- |
| Collection display name | 数据表在界面中显示的名称，比如「客户」「订单」「合同附件」。建议使用业务人员能直接理解的名称。 |
| Collection name | 数据表的标识名称，用于 API、关系字段、权限、工作流等内部引用。它会自动生成，也可以手动修改；只支持字母、数字和下划线，并且必须以字母开头。 |
| Categories | 数据表分类。分类只影响数据表管理界面的组织方式，不改变数据表结构。数据表较多时，建议按业务模块分类，比如「客户管理」「项目管理」「财务」。 |
| Description | 数据表说明。可以写数据表保存什么数据、由谁维护、和哪些业务流程有关，方便后续维护。 |
| Use simple pagination mode | 简单分页模式。启用后，表格区块分页时会跳过总记录数统计，适合数据量很大的表，可以减少查询压力。 |
| Preset fields | 预设字段。创建表时可以选择是否自动添加 ID、创建时间、创建人、更新时间、更新人等常用字段。普通业务表建议保留这些字段。 |

### 内置字段

普通表创建时可以通过 `Preset fields` 自动添加常用系统字段。

| 字段 | 字段名 | 说明 |
| --- | --- | --- |
| ID | `id` | 默认主键字段，用于唯一标识一条记录。默认主键类型是 `Snowflake ID (53-bit)`。 |
| 创建时间 | `createdAt` | 自动记录这条记录的创建时间。常用于排序、筛选、审计和工作流条件。 |
| 创建人 | `createdBy` | 自动记录创建这条记录的用户。常用于“只看我创建的数据”、权限控制和责任追踪。 |
| 更新时间 | `updatedAt` | 自动记录这条记录最后一次更新的时间。常用于判断数据是否被修改过。 |
| 更新人 | `updatedBy` | 自动记录最后一次更新这条记录的用户。常用于审计和协作场景。 |
| [空间](../../multi-app/multi-space/index.md) | `space` | 启用[多空间插件](../../multi-app/multi-space/index.md)后可用，用于按空间隔离数据。没有启用多空间时不会出现在普通表预设字段中。 |

### 主键字段

**Primary key** 标识主键字段。它用于在数据库层唯一标识一条记录。创建表时建议保留 ID 预设字段，默认主键类型是 `Snowflake ID (53-bit)`。

![20251209210153](https://static-docs.nocobase.com/20251209210153.png)

鼠标悬停在 ID 字段的 Interface 上，可以选择其他主键类型。

![20251209210517](https://static-docs.nocobase.com/20251209210517.png)

可选的主键类型有：

- [文本](../data-modeling/collection-fields/basic/input.md)
- [整数](../data-modeling/collection-fields/basic/integer.md)
- [Snowflake ID (53-bit)](../data-modeling/collection-fields/advanced/snowflake-id.md)
- [UUID](../data-modeling/collection-fields/advanced/uuid.md)
- [Nano ID](../data-modeling/collection-fields/advanced/nano-id.md)

:::warning 注意

无主键数据表需要在编辑数据表时设置「Record unique key」，否则无法在页面中创建区块，也无法正确查看或编辑记录。

:::


## 页面配置使用

普通表可以用于大多数数据区块和筛选区块。

| 区块 | 用途 |
| --- | --- |
| [表格区块](../../interface-builder/blocks/data-blocks/table.md) | 查看、筛选、排序、批量处理记录。 |
| [表单区块](../../interface-builder/blocks/data-blocks/form.md) | 新增或编辑单条记录。 |
| [详情区块](../../interface-builder/blocks/data-blocks/details.md) | 查看单条记录详情。 |
| [列表区块](../../interface-builder/blocks/data-blocks/list.md) | 以列表方式展示记录。 |
| [网格卡片区块](../../interface-builder/blocks/data-blocks/grid-card.md) | 以卡片网格展示图片、文件、商品、资产等记录。 |
| [看板区块](../../interface-builder/blocks/data-blocks/kanban.md) | 按状态、阶段、负责人等字段分组展示记录。 |
| [日历区块](../../interface-builder/blocks/data-blocks/calendar.md) | 按日期或时间范围展示记录。 |
| [图表区块](../../interface-builder/blocks/data-blocks/chart.md) | 基于记录生成统计图表。 |
| [地图区块](../../interface-builder/blocks/data-blocks/map.md) | 按地理位置展示记录。 |
| [甘特图区块](../../plugins/@nocobase/plugin-gantt/index.md) | 按开始、结束时间展示项目计划、任务排期。 |
| [表单筛选区块](../../interface-builder/blocks/filter-blocks/form.md) | 使用表单条件筛选页面中的数据区块。 |
| [树筛选区块](../../interface-builder/blocks/filter-blocks/tree.md) | 使用树结构筛选页面中的数据区块，常用于分类、组织、地区等层级筛选。 |

## 编辑配置

在数据表列表中，点击普通表右侧的「Edit」，可以修改数据表的基础配置。编辑数据表主要用于调整数据表元信息和部分运行配置，不用于批量修改字段结构。

如果要新增字段、修改字段类型、调整字段界面类型或删除字段，需要进入「Configure fields」处理。

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

| 配置 | 允许编辑 | 说明 |
| --- | --- | --- |
| Collection display name | 是 | 数据表在界面中显示的名称，比如「客户」「订单」「合同附件」。修改后只影响界面展示，不修改数据表标识名称。 |
| Collection name | 否 | 数据表的标识名称，用于 API、关系字段、权限、工作流等内部引用。创建后不能在编辑表单中修改。 |
| Inherits | 条件支持 | 选择要继承的父表。只有主数据库是 PostgreSQL 且界面显示该配置时可用。已有数据表调整继承关系前，需要确认字段结构、页面区块、权限和工作流是否依赖原来的结构。 |
| Categories | 是 | 数据表分类。分类只影响数据表管理界面的组织方式，不改变数据表结构。 |
| Description | 是 | 数据表说明。适合补充数据表用途、维护人、数据来源和相关业务流程。 |
| Use simple pagination mode | 是 | 简单分页模式。启用后，表格区块分页时会跳过总记录数统计，适合数据量很大的表。 |
| Record unique key | 是 | 记录唯一标识。用于在区块中定位一条记录，通常选择主键或唯一字段。无主键数据表必须配置，否则无法正确创建区块、查看或编辑记录。 |

:::warning 注意

编辑数据表不会自动调整已有字段。`Preset fields` 只在创建表时生效；如果创建后还需要补充创建时间、创建人、更新时间、更新人等字段，需要在「Configure fields」中单独新增。

:::

## 删除数据表

在数据表列表中，点击普通表右侧的「Delete」，可以删除数据表。主数据库中的普通表还支持批量选择后统一删除。

![delete_collection](https://static-docs.nocobase.com/delete_collection.png)

删除时会出现二次确认。确认后，NocoBase 会删除这张普通表的 Collection 元数据，并删除主数据库中的真实数据表及其中的数据。

![delete_collection_second_confirmation](https://static-docs.nocobase.com/delete_collection_second_confirmation.png)

删除确认框里有一个可选项：自动删除依赖该数据表的对象。启用后，NocoBase 会尝试一并删除依赖这张表的数据库对象，比如基于这张表创建的数据库视图，以及继续依赖这些对象的其他对象。

:::danger 警告

删除普通表是高风险操作。删除后，表结构、表数据、字段元数据，以及依赖这张表的页面区块、关系字段、权限、工作流和 API 调用都可能失效。勾选自动删除依赖对象前，先确认这些对象也可以被删除。

:::
