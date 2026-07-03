---
pkg: "@nocobase/plugin-data-source-main"
title: "数据库视图"
description: "连接数据库里已经存在的视图作为数据源，在 NocoBase 中配置字段与展示，适用于复杂查询结果的可视化管理。"
keywords: "数据库视图,Collection View,视图"
---
# 连接数据库视图

## 介绍

连接数据库里的 VIEW，比如由 DBA 维护的财务报表视图、过滤后的客户视图、跨系统同步后的聚合视图。它适合复用数据库已经定义好的查询逻辑。

当前页面连接的是主数据库中已经存在的普通数据库 view。NocoBase 不负责创建或维护这个 view 的 SQL 定义，只会把它作为一个可以配置字段元数据的数据表使用。

:::tip 提示

支持主数据库当前可访问范围内的普通 view，不支持物化视图。连接前需要确认数据库账号有读取 view 结构和执行查询的权限；view 字段需要有稳定的列名，字段类型应能被 NocoBase 识别。

:::

## 插件安装

内置插件，无需单独安装。

## 连接数据库视图

1. 点击系统功能中的数据源菜单，访问数据源主页。
2. 选择数据源列表中的 **Main** 数据源，点击「Configure」操作，访问主数据库。
3. 在主数据库管理中点击「Create collection」，选择「Connect to database view」

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![connect_view](https://static-docs.nocobase.com/connect_view.png)
![connect_view_configure](https://static-docs.nocobase.com/connect_view_configure.png)

| 配置 | 说明 |
| --- | --- |
| Collection display name | 数据库视图在界面中显示的名称，比如「财务报表视图」「客户统计视图」。建议使用能说明视图用途的名称。 |
| Collection name | 数据库视图在 NocoBase 中的标识名称，用于 API、关系字段、权限、工作流等内部引用。它会自动生成，也可以手动修改；只支持字母、数字和下划线，并且必须以字母开头。 |
| Database view | 选择要连接的数据库视图。从视图中读取字段结构和查询结果。编辑时可以查看当前连接的 view，但不能切换为另一个 view。 |
| Categories | 数据表分类。只影响数据表管理界面的组织方式，不改变数据库视图本身。 |
| Description | 数据表说明。建议写清楚这个 view 由谁维护、查询了哪些数据、用于哪些页面或报表。 |
| Use simple pagination mode | 简单分页模式。启用后，表格区块分页时会跳过总记录数统计，适合数据量大的视图，可以减少查询压力。 |
| Record unique key | 记录唯一标识。数据库视图通常没有主键，需要选择一个能唯一定位记录的字段，否则可能无法在区块中正确查看或编辑记录。 |
| Source collections | 数据库视图的字段来源。用于把视图字段和已有数据表字段关联起来，帮助 NocoBase 识别字段类型和界面类型。 |
| Fields | 字段映射配置。用于确认视图中每个字段的名称、标题、数据类型和界面类型。 |
| Preview | 预览数据库视图结果。提交前可以先确认字段映射和展示效果是否符合预期。 |
| Allow add new, update and delete actions | 是否允许对数据库视图执行新增、更新和删除。启用后，NocoBase 会在页面中开放对应操作入口；是否能写入成功，仍取决于数据库 view 本身是否可写，以及数据库账号是否有 insert、update 和 delete 权限。 |

:::tip 提示

`Source collections` 是 NocoBase 根据数据库视图字段推断出的来源数据表。它告诉 NocoBase 这个 view 里的字段主要来自哪些已有数据表，并在字段映射时限定可选的 `Field source`。

推断结果用于辅助快速配置，如果 view 中有字段重命名、计算、聚合或复杂 join，结果可能不完全准确或者无法推断，需要在 `Fields` 中手动确认。

:::

### 字段映射

字段映射是连接数据库视图后必须确认的配置。连接 view 后，NocoBase 会先推断每个视图字段的来源和数据库类型：能推断到来源字段时，会自动带出已有字段的 Field type、Field interface 和 Field display name；不能推断时，则根据数据库字段类型给出初始 Field type，需要手动确认字段类型和界面配置。
[了解更多字段配置信息](../field/field)

| 配置 | 说明 |
| --- | --- |
| Field source | 选择视图字段来自哪个已有数据表和字段。选中来源后，NocoBase 可以复用原字段的 Field type 和 Field interface。 |
| Field type | 如果视图字段没有明确来源，需要手动确认字段的数据类型。 |
| Field interface | 确认字段在页面中如何展示和输入，比如单行文本、数字、日期、下拉选项。 |
| Field display name | 字段在界面中显示的名称。建议使用业务人员能理解的名称。 |

比如视图里返回 `customer_name`，并且它来自客户表的「客户名称」字段，可以把它映射到客户表对应字段。这样 NocoBase 就能沿用原字段的标题、类型和界面配置。

如果视图字段来自聚合或计算结果，比如 `count(*) as total`、`sum(amount) as amount_total`，通常需要手动选择 Field type 和合适的 Field interface。

:::tip 提示

`Field source` 来自 NocoBase 对数据库视图的推断，表示某个视图字段可能对应哪个已有字段。字段带有 `Field source` 时，NocoBase 会优先复用来源字段的 Field type 和 Field interface。

如果不能推断来源字段，或者推断结果不符合业务含义，需要删除 `Field source`，手动选择 `Field type` 和 `Field interface`、`Field display name`。

:::

### 记录唯一标识

数据库视图需要配置 Record unique key，否则无法在页面中创建区块、无法正确查看或编辑记录。适合作为 Record unique key 的字段通常满足这些条件：

- 字段值唯一
- 字段值稳定，不会因为排序、分页或统计口径变化而变化
- 字段不为空
- 字段在 view 中始终返回

如果 view 来自单表查询，可以优先返回原表主键。如果 view 来自多表 join 或聚合，可以在数据库视图中保留一个稳定的业务 ID，或由数据库侧生成稳定的唯一字段。

### 允许增删改操作

如果数据库 view 支持写入，可以启用「Allow add new, update and delete actions」。NocoBase 会在页面中允许对这个视图执行新增、更新和删除操作。

不过大多数数据库视图更适合作为查询结果使用，默认按只读数据表处理就够了。只有当你已经确认数据库 view 支持对应写入操作，并且数据库权限也允许写入时，才建议启用。

### 预览视图结果

提交前先使用 Preview 查看视图查询结果。预览时重点确认：

- view 是否能正常查询
- 字段是否完整
- 字段类型和界面类型是否符合业务含义
- Record unique key 是否存在并且唯一
- 不支持字段是否需要在数据库侧调整

## 配置字段

数据库视图创建后，在数据表列表中，点击视图右侧的「Configure fields」，可以进入字段配置页面，查看和维护字段元数据。

### 编辑字段

编辑字段主要用于调整 NocoBase 中保存的字段元数据，不会修改数据库 view 的真实列结构。

常见可调整内容包括：

| 配置 | 说明 |
| --- | --- |
| Field source | 调整字段来源。来源字段匹配正确时，可以复用原字段的 Field type 和 Field interface。 |
| Field type | 调整字段类型。适合处理推断不准确，或字段来自计算、聚合结果的情况。 |
| Field interface | 调整字段在页面中的展示和输入方式。 |
| Field display name | 调整字段在界面中的显示名称。 |

如果字段来自已有数据表，优先确认 `Field source` 是否正确。如果字段来自 SQL 计算、聚合或表达式结果，通常需要手动选择 `Field type` 和 `Field interface`。

### 删除字段

删除字段只会移除 NocoBase 中保存的字段元数据，不会删除数据库 view 里的真实列。

删除前需要确认页面区块、筛选条件、排序、权限、工作流和 API 是否还在使用这个字段。如果数据库 view 中仍然返回这个列，后续执行「Sync from database」时，NocoBase 可能会再次识别到这个字段，需要重新确认是否接入。

### 字段映射

数据库视图创建后，仍然可以在「Configure fields」中调整字段映射。这个操作用于修正 NocoBase 保存的字段元数据，不会修改数据库 view 的 SQL 定义，也不会修改 view 返回的真实列。

如果自动推断的 `Field source` 不准确，可以重新选择来源字段，或清空来源后手动配置 `Field type` 和 `Field interface`。对于计算字段、聚合字段、拼接字段，通常更适合手动配置字段类型和界面类型。

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

## 编辑视图

![edit_view](https://static-docs.nocobase.com/edit_view.png)
![edit_view_configure](https://static-docs.nocobase.com/edit_view_configure.png)

编辑数据库视图时，通常可以调整显示名称、分类、描述、简单分页模式、记录唯一标识和是否允许新增、更新、删除。

`Database view` 编辑时只读，不能把已经连接的数据表切换到另一个 view。如果需要连接另一个 view，建议新建一个数据库视图数据表。

修改 Record unique key 或 Allow add new, update and delete actions 后，需要重新检查页面区块、权限和工作流是否仍然符合预期。

## 删除视图

删除数据库视图数据表会删除 NocoBase 中的连接配置和字段元数据，不会删除数据库里的 view。

删除前仍然需要检查页面区块、图表、权限、工作流和外部 API 是否还在使用这个数据库视图数据表。

:::danger 警告

如果删除时勾选自动删除依赖对象，NocoBase 会尝试一并删除依赖该数据表的对象。执行前请确认这些依赖对象也可以删除。

:::
