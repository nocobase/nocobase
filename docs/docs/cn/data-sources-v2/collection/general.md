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

## 可用区块

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
| [甘特图区块](../../interface-builder/blocks/data-blocks/gantt.md) | 按开始、结束时间展示项目计划、任务排期。 |
| [表单筛选区块](../../interface-builder/blocks/filter-blocks/form.md) | 使用表单条件筛选页面中的数据区块。 |
| [树筛选区块](../../interface-builder/blocks/filter-blocks/tree.md) | 使用树结构筛选页面中的数据区块，常用于分类、组织、地区等层级筛选。 |

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

## 内置字段

普通表创建时可以通过 `Preset fields` 自动添加常用系统字段。

| 字段 | 字段名 | 说明 |
| --- | --- | --- |
| ID | `id` | 默认主键字段，用于唯一标识一条记录。默认主键类型是 `Snowflake ID (53-bit)`。 |
| 创建时间 | `createdAt` | 自动记录这条记录的创建时间。常用于排序、筛选、审计和工作流条件。 |
| 创建人 | `createdBy` | 自动记录创建这条记录的用户。常用于“只看我创建的数据”、权限控制和责任追踪。 |
| 更新时间 | `updatedAt` | 自动记录这条记录最后一次更新的时间。常用于判断数据是否被修改过。 |
| 更新人 | `updatedBy` | 自动记录最后一次更新这条记录的用户。常用于审计和协作场景。 |
| [空间](../../multi-app/multi-space/index.md) | `space` | 启用[多空间插件](../../multi-app/multi-space/index.md)后可用，用于按空间隔离数据。没有启用多空间时不会出现在普通表预设字段中。 |

## 主键字段

**Primary key** 标识主键字段。它用于在数据库层唯一标识一条记录。创建表时建议保留 ID 预设字段，默认主键类型是 `Snowflake ID (53-bit)`。

![20251209210153](https://static-docs.nocobase.com/20251209210153.png)

鼠标悬停在 ID 字段的 Interface 上，可以选择其他主键类型。

![20251209210517](https://static-docs.nocobase.com/20251209210517.png)

可选的主键类型有：

- [文本](../field/basic/input.md)
- [整数](../field/basic/integer.md)
- [Snowflake ID (53-bit)](../field/advanced/snowflake-id.md)
- [UUID](../field/advanced/uuid.md)
- [Nano ID](../field/advanced/nano-id.md)

:::warning 注意

无主键数据表需要在编辑数据表时设置「Record unique key」，否则无法在页面中创建区块，也无法正确查看或编辑记录。

:::

## 相关链接

- [数据表字段](../field/index.md) — 配置普通表字段
- [主数据库](../main/index.md) — 创建和管理主数据库中的普通表
- [外部数据库](../external/index.md) — 接入外部数据库已有表