---
pkg: "@nocobase/plugin-data-source-main"
title: "数据库视图"
description: "连接数据库里已经存在的视图作为数据源，在 NocoBase 中配置字段与展示，适用于复杂查询结果的可视化管理。"
keywords: "数据库视图,Collection View,视图"
---
# 连接数据库视图

## 介绍

连接数据库里已经存在的 view，比如由 DBA 维护的财务报表视图、过滤后的客户视图、跨系统同步后的聚合视图。它适合复用数据库已经定义好的查询逻辑。

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

数据库视图只告诉 NocoBase 返回了哪些列。要让这些列像普通字段一样在页面中展示，还需要完成字段映射。

字段映射主要处理四件事：

| 配置 | 说明 |
| --- | --- |
| Field source | 选择视图字段来自哪个已有数据表和字段。选中来源后，NocoBase 可以复用原字段的 Field type 和 Field interface。 |
| Field type | 如果视图字段没有明确来源，需要手动确认字段的数据类型。 |
| Field interface | 确认字段在页面中如何展示和输入，比如单行文本、数字、日期、下拉选项。 |
| Field display name | 字段在界面中显示的名称。建议使用业务人员能理解的名称。 |

比如视图里返回 `customer_name`，并且它来自客户表的「客户名称」字段，可以把它映射到客户表对应字段。这样 NocoBase 就能沿用原字段的标题、类型和界面配置。

如果视图字段来自聚合或计算结果，比如 `count(*) as total`、`sum(amount) as amount_total`，通常需要手动选择数字类型和合适的 Field interface。

## 记录唯一标识

数据库视图通常没有主键。连接视图时，需要配置 Record unique key，让 NocoBase 知道用哪个字段定位一条记录。

适合作为 Record unique key 的字段通常满足这些条件：

- 字段值唯一
- 字段值稳定，不会因为排序、分页或统计口径变化而变化
- 字段不为空
- 字段在 view 中始终返回

如果 view 来自单表查询，可以优先返回原表主键。如果 view 来自多表 join 或聚合，可以在数据库视图中保留一个稳定的业务 ID，或由数据库侧生成稳定的唯一字段。

:::warning 注意

不要使用会随查询顺序变化的值作为 Record unique key，比如临时排序序号。记录唯一标识不稳定时，详情、编辑、删除和关联展示都可能出错。

:::

## 预览视图结果

提交前先使用 Preview 查看视图查询结果。预览时重点确认：

- view 是否能正常查询
- 字段是否完整
- 字段类型和界面类型是否符合业务含义
- Record unique key 是否存在并且唯一
- 不支持字段是否需要在数据库侧调整

## 配置字段

数据库视图创建后，可以通过「Configure fields」查看和维护字段元数据。

跟普通表不同，数据库视图的字段来自数据库 view。通常不建议在 NocoBase 中像普通表一样新增业务字段。需要改变字段结构时，优先在数据库侧修改 view，然后回到 NocoBase 同步字段。

### 从数据库同步

当数据库 view 的字段发生变化时，可以在「Configure fields」中点击「Sync from database」重新同步。

同步时，NocoBase 会重新读取 view 的字段，并允许你重新确认：

| 配置 | 说明 |
| --- | --- |
| Field source | 重新选择字段来源，帮助 NocoBase 复用已有字段的类型和界面配置。 |
| Field type | 对没有来源字段的 view 字段，重新确认数据类型。 |
| Field interface | 重新确认字段在页面中的展示和输入方式。 |
| Field display name | 调整字段显示名称。 |
| Preview | 查看同步后的字段展示和查询结果。 |

如果同步时出现 Unsupported fields，说明这些字段类型暂时无法被 NocoBase 正确识别。可以在数据库侧调整 view 字段类型，或先排除这些字段后再使用。

## 变更视图

![edit_view](https://static-docs.nocobase.com/edit_view.png)
![edit_view_configure](https://static-docs.nocobase.com/edit_view_configure.png)

编辑数据库视图时，通常可以调整显示名称、分类、描述、简单分页模式、记录唯一标识和是否允许新增、更新、删除。

`Database view` 编辑时只读，不能把已经连接的数据表切换到另一个 view。如果需要连接另一个 view，建议新建一个数据库视图数据表。

修改 Record unique key 或 Allow add new, update and delete actions 后，需要重新检查页面区块、权限和工作流是否仍然符合预期。

## 可写视图

如果数据库 view 本身支持写入，可以启用「Allow add new, update and delete actions」。启用后，NocoBase 会在页面中允许对这个视图执行新增、更新和删除操作。

不过大多数数据库视图更适合作为查询结果使用，默认按只读数据表处理就够了。只有当你已经确认数据库 view 支持对应写入操作，并且数据库权限也允许写入时，才建议启用。

:::warning 注意

启用可写视图不代表数据库一定能成功写入。是否能新增、更新或删除，取决于数据库 view 的定义、数据库类型、触发器或规则，以及当前数据库账号权限。

:::

## 删除视图

删除数据库视图数据表会删除 NocoBase 中的连接配置和字段元数据，不会删除数据库里的 view。

删除前仍然需要检查页面区块、图表、权限、工作流和外部 API 是否还在使用这个数据库视图数据表。

:::danger 警告

如果删除时勾选自动删除依赖对象，NocoBase 会尝试一并删除依赖该数据表的对象。执行前请确认这些依赖对象也可以删除。

:::

## 数据库视图和 SQL 表

| 对比项 | 数据库视图 | SQL 表 |
| --- | --- | --- |
| 查询逻辑位置 | 保存在数据库 view 中。 | 保存在 NocoBase 的 SQL 表配置中。 |
| 适合场景 | 长期维护的复杂查询、DBA 管理的报表视图。 | 快速验证查询、轻量报表、临时统计。 |
| 数据库对象 | 依赖数据库中已有 view。 | 不创建新的数据库表或 view。 |
| 字段同步 | 根据数据库 view 结构同步。 | 根据 SQL 查询结果同步。 |
| 增删改支持 | 取决于数据库视图本身是否可写。 | 通常不支持。 |

默认建议：临时查询和轻量报表用 [SQL 表](./collection-sql.md)；长期稳定、复杂或需要数据库侧治理的查询，用数据库视图。

## 常见问题

### 为什么没有可选的数据库视图

先确认数据库里已经创建普通 view，并且当前数据库账号有权限读取这些 view。物化视图不在当前支持范围内。

### 为什么页面区块无法查看详情或编辑记录

优先检查 Record unique key。视图没有稳定唯一字段时，NocoBase 无法可靠定位单条记录。

### 为什么启用可写后仍然写入失败

数据库 view 本身可能不支持写入，或者当前数据库账号没有写入权限。请先在数据库侧确认这个 view 是否可以执行 insert、update 或 delete。

### view 字段变化后为什么页面没有更新

进入「Configure fields」，点击「Sync from database」同步字段。同步后再检查字段来源、字段类型、Field interface 和页面区块配置。

## 相关链接

- [SQL 表](./collection-sql.md) — 通过 SQL 查询结果创建数据表
- [主数据库](./database.md) — 在主数据库中管理数据表
- [字段](../field.md) — 了解 Field type 和 Field interface
