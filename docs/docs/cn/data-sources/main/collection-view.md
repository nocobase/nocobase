---
pkg: "@nocobase/plugin-data-source-main"
title: "数据库视图"
description: "连接数据库里已经存在的视图作为数据源，在 NocoBase 中配置字段与展示，适用于复杂查询结果的可视化管理。"
keywords: "数据库视图,Collection View,视图"
---
# 连接数据库视图

## 介绍
连接数据库里已经存在的视图，比如由 DBA 维护的财务报表视图、过滤后的客户视图、跨系统同步后的聚合视图。它适合复用数据库已经定义好的查询逻辑。

:::tip 提示
支持普通视图，不支持物化视图。
:::

## 安装

内置插件，无需单独安装。

## 连接视图
![connect_view](https://static-docs.nocobase.com/connect_view.png)
![connect_view_configure](https://static-docs.nocobase.com/connect_view_configure.png)

| 属性 | 新增 / 编辑 | 说明 |
| --- | --- | --- |
| Collection display name | 新增、编辑 | 数据库视图在界面中显示的名称，比如「财务报表视图」「客户统计视图」。建议使用能说明视图用途的名称。 |
| Collection name | 新增、编辑时只读 | 数据库视图在 NocoBase 中的内部名称，用于 API、区块和权限等内部引用。新增时通常会跟随所选 view 自动填充，编辑时不可修改。 |
| Database view | 新增、编辑时只读 | 选择要连接的数据库视图。NocoBase 会从这个 view 中读取字段结构和查询结果。编辑时可以查看当前连接的 view，但不能切换为另一个 view。 |
| Categories | 新增、编辑 | 数据表分类。只影响数据表管理界面的组织方式，不改变数据库视图本身。 |
| Description | 新增、编辑 | 数据表说明。建议写清楚这个 view 由谁维护、查询了哪些数据、用于哪些页面或报表。 |
| Use simple pagination mode | 新增、编辑 | 简单分页模式。启用后，分页时会跳过总记录数统计，适合数据量很大的视图，可以减少查询压力。 |
| Record unique key | 新增、编辑 | 记录唯一标识。数据库视图通常没有主键，需要选择一个能唯一定位记录的字段，否则可能无法在区块中正确查看或编辑记录。 |
| Sources | 新增、编辑时只读 | 数据库视图的字段来源。用于把视图字段和已有数据表字段关联起来，帮助 NocoBase 识别字段类型和界面类型。 |
| Fields | 仅新增 | 字段映射配置。用于确认视图中每个字段的名称、标题、数据类型和界面类型。 |
| Preview | 仅新增 | 预览数据库视图结果。提交前可以先确认字段映射和展示效果是否符合预期。 |
| Allow add new, update and delete actions | 新增、编辑 | 数据库视图是否允许新增、更新和删除。只有当数据库视图本身支持写入时才应该启用，否则相关操作可能失败。 |

## 字段映射

## 配置字段

### 同步数据库字段

## 变更视图
![edit_view](https://static-docs.nocobase.com/edit_view.png)
![edit_view_configure](https://static-docs.nocobase.com/edit_view_configure.png)

## 删除视图
