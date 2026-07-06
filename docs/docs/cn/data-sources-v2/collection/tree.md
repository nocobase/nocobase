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

## 可用区块

树表可以使用[普通表](./general.md)的多数数据区块做增删改查。另外，它还可以配合树形能力使用：

| 区块 | 用途 |
| --- | --- |
| [表格区块](../../interface-builder/blocks/data-blocks/table.md#启用树表) | 展示树形记录，用于查看和维护上下级结构。 |
| [树筛选区块](../../interface-builder/blocks/filter-blocks/tree.md) | 用树结构筛选其他数据区块，常用于分类、组织、地区等层级筛选。 |

## 创建配置

在主数据库中点击「Create collection」，选择「Tree collection」可以创建树表。

![20240324143228](https://static-docs.nocobase.com/20240324143228.png)

树表的创建配置与普通表基本一致。`Preset fields` 会在普通表内置字段之外，增加用于保存层级关系的字段。

| 字段 | 字段名 | 说明 |
| --- | --- | --- |
| Parent ID | `parentId` | 保存父节点 ID。根节点通常为空。 |
| Parent | `parent` | 多对一关系字段，指向当前表中的父节点。 |
| Children | `children` | 一对多关系字段，表示当前节点的子节点。 |

![20240324143555](https://static-docs.nocobase.com/20240324143555.png)

:::warning 注意

树表数据要避免形成循环关系，比如 A 的父节点是 B，B 的父节点又是 A。循环关系会让树形展示和筛选结果异常。

:::

## 相关链接

- [普通表](./general.md) — 查看通用配置和区块使用方式
- [表格区块](../../interface-builder/blocks/data-blocks/table.md) — 在表格中启用树表展示
- [树筛选区块](../../interface-builder/blocks/filter-blocks/tree.md) — 使用树结构筛选数据