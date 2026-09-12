---
pkg: "@nocobase/plugin-data-source-main"
title: "数据库视图"
description: "连接数据库里已经存在的视图作为数据源，在 NocoBase 中配置字段与展示，适用于复杂查询结果的可视化管理。"
keywords: "数据库视图,Collection View,视图"
---
# 连接数据库视图

## 介绍

连接数据库里的视图，比如由 DBA 维护的财务报表视图、过滤后的客户视图、跨系统同步后的聚合视图。它适合复用数据库已经定义好的查询逻辑。

:::tip 提示

支持主数据库连接账号所有者范围内的普通视图，不支持物化视图。即使该账号对其他所有者的视图有查询权限，这些视图也不会出现在可连接列表中。连接前需要确认视图字段有稳定的列名，字段类型应能被 NocoBase 识别。

:::

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

`Source collections` 是根据数据库视图推断出的来源数据表，识别 view 里的字段主要来自哪些已有数据表，并在字段映射时限定可选的 `Field source`。

推断结果用于辅助快速配置，如果 view 中有字段重命名、计算、聚合或复杂 join，结果可能不完全准确或者无法推断，需要在 `Fields` 中手动确认。

:::

### 字段映射

字段映射是连接数据库视图后必须确认的配置。连接 view 后，NocoBase 会先推断每个视图字段的来源和数据库类型：能推断到来源字段时，会自动带出已有字段的 Field type、Field interface 和 Field display name；不能推断时，则根据数据库字段类型给出初始 Field type，需要手动确认字段类型和界面配置。
[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

![connect_view_configure_field_source](https://static-docs.nocobase.com/connect_view_configure_field_source.png)
![connect_view_configure_field_interface](https://static-docs.nocobase.com/connect_view_configure_field_interface.png)

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

数据库视图需要配置 Record unique key，否则无法在页面中创建区块、无法正确查看或编辑记录。支持选择一个字段或者多个字段组合作为唯一标识。适合作为 Record unique key 的字段通常满足这些条件：

- 字段值唯一
- 字段值稳定，不会因为排序、分页或统计口径变化而变化
- 字段不为空
- 字段在 view 中始终返回

如果 view 来自单表查询，可以优先返回原表主键。如果 view 来自多表 join 或聚合，可以在数据库视图中保留一个稳定的业务 ID，或由数据库侧生成稳定的唯一字段。

### 允许增删改操作

如果数据库 view 支持写入，可以启用「Allow add new, update and delete actions」。NocoBase 会在页面中允许对这个视图执行新增、更新和删除操作。

数据库视图更适合作为查询结果使用，默认按只读数据表处理。只有当你已经确认数据库 view 支持对应写入操作，并且数据库权限也允许写入时，才建议启用。

### 预览视图结果

提交前先使用 Preview 查看视图查询结果。预览时重点确认：

- view 是否能正常查询
- 字段是否完整
- 字段类型和界面类型是否符合业务含义
- Record unique key 是否存在并且数据唯一
- 不支持的字段类型是否需要在数据库侧调整

![connect_view_configure_preview](https://static-docs.nocobase.com/connect_view_configure_preview.png)

## 配置字段

数据库视图创建后，在数据表列表中，点击视图右侧的「Configure fields」，可以进入字段配置页面。字段配置用于维护视图有哪些字段、字段在界面中如何显示，以及数据库 view 字段如何映射为 NocoBase 的 Field type 和 Field interface。

数据库视图的普通字段来自数据库 view，NocoBase 不会在 view 中直接新增、修改或删除真实列。在字段配置页中，只支持新增多对一关系字段，用来补充 NocoBase 中的业务关联。数据库视图不支持作为关系字段的目标数据表，标题字段通常不需要配置。

[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

![configure_view](https://static-docs.nocobase.com/configure_view.png)

### 新增关系字段

数据库视图只能新增多对一关系字段。多对一关系字段可以把 view 中已有字段映射到目标数据表的主键或唯一字段，用于在页面中展示关联记录，但不会在数据库 view 中创建真实字段或外键约束。

点击「Add field」可以新增多对一关系字段。

[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

![add_view_field](https://static-docs.nocobase.com/add_view_field.png)
![add_view_field_configure](https://static-docs.nocobase.com/add_view_field_configure.png)

| 配置 | 说明 |
| --- | --- |
| Field display name | 多对一关系字段在界面中显示的名称。建议使用业务人员能理解的名称，比如「所属客户」「关联订单」。 |
| Field name | 多对一关系字段在 NocoBase 中保存的标识名称，用于 API、权限、工作流等内部引用。 |
| Source collection | 源数据表，也就是当前数据库视图数据表。用于确定 `Foreign key` 从哪个数据表字段中选择；数据库视图新增多对一关系字段时，通常保持为当前 view。 |
| Target collection | 要关联的目标数据表。通常选择普通数据表、外部数据库表等真实数据表，不能选择数据库视图。 |
| Foreign key | 当前数据库视图中用于保存目标记录标识的字段。这个字段需要在 view 查询结果中稳定返回。 |
| Target key | 目标数据表中被 `Foreign key` 匹配的字段，通常选择主键或唯一字段。 |
| Description | 字段说明。适合写关联关系含义、数据来源、维护方式或注意事项。 |

### 字段映射

数据库视图连接后，NocoBase 会根据 view 字段和来源字段推断 Field type，并匹配一个默认 Field interface。如果字段来源、展示方式或业务含义不符合预期，可以在字段配置中调整映射。

[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

![edit_view_field_configure](https://static-docs.nocobase.com/edit_view_field_configure.png)

:::tip 提示

- Field interface（界面类型 / UI 类型）：决定字段在前端如何展示和交互。比如「单行文本」「数字」「下拉菜单」「日期时间」等，它是用户视角的字段分类
- Field type（数据类型）：决定 NocoBase 如何识别字段的数据类型。没有来源字段的 view 字段通常由数据库字段类型推断，比如 `string`、`integer`、`decimal`、`boolean`、`datetime` 等

:::

:::warning 注意

调整 Field source、Field type 或 Field interface 不等于修改数据库 view 的字段类型。它主要影响页面展示方式、校验规则，以及 NocoBase 对字段的识别方式。

:::

### 从数据库同步

如果数据库侧修改了 view 字段结构，可以进入「Configure fields」，点击「Sync from database」重新读取字段结构。同步后，NocoBase 会更新字段：新增 view 中出现的新字段，清理 view 中已经删除的字段，并重新确认字段类型和字段来源。

![edit_view_sync_from_database](https://static-docs.nocobase.com/edit_view_sync_from_database.png)
![edit_view_sync_from_database_configure](https://static-docs.nocobase.com/edit_view_sync_from_database_configure.png)

:::warning 注意

字段重命名在同步时通常会表现为“删除旧字段 + 新增新字段”。同步前先确认旧字段是否已经被页面、权限、工作流或外部 API 使用，避免同步后出现配置失效。同步后还需要重新检查 Field type 和 Field interface。

:::

### 编辑字段

点击字段右侧的「Edit」可以编辑字段配置。编辑字段适合调整字段在 NocoBase 中的展示和使用方式，比如修改显示名称、描述、校验规则或字段专属配置。
[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

![edit_field](https://static-docs.nocobase.com/edit_field.png)
![edit_field_configure](https://static-docs.nocobase.com/edit_field_configure.png)

:::warning 注意

编辑字段配置不会修改数据库 view 中的真实列名、字段类型、SQL 表达式或索引。如果需要调整 view 的真实结构，请先在数据库侧修改 view，再使用「Sync from database」同步。

:::

### 删除字段

点击字段右侧的「Delete」可以删除单个字段。删除字段只会移除 NocoBase 中保存的字段，不会删除数据库 view 的真实列。

[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

![delete_field](https://static-docs.nocobase.com/delete_field.png)

:::warning 注意

删除字段可能影响页面区块、筛选条件、排序、权限、工作流、API 和已有配置，删除前先确认字段是否仍被使用。如果数据库 view 中仍然返回这个列，后续执行「Sync from database」时，NocoBase 可能会再次识别到这个字段。

:::

## 编辑视图

数据库视图的 SQL 定义由数据库侧维护。在数据表列表中，点击某个数据库视图右侧的「Edit」，用于调整数据库视图在 NocoBase 中的元信息和运行配置，不会修改数据库里的 view。如果需要连接另一个数据库 view，建议新建一个数据库视图数据表。

![edit_view](https://static-docs.nocobase.com/edit_view.png)
![edit_view_configure](https://static-docs.nocobase.com/edit_view_configure.png)

| 配置 | 说明 |
| --- | --- |
| Collection display name | 数据库视图在界面中显示的名称。可以改成业务人员能理解的名称，比如「财务报表视图」「客户统计视图」。 |
| Collection name | 数据库视图在 NocoBase 中的标识名称。编辑时不可修改。 |
| Database view | 当前连接的数据库 view。编辑时只读，不能切换为另一个 view。 |
| Categories | 数据表分类。只影响数据源管理界面的组织方式，不改变数据库 view。 |
| Description | 数据表说明。适合写 view 的维护人、查询来源、使用页面或报表用途。 |
| Use simple pagination mode | 简单分页模式。启用后，表格区块分页时会跳过总记录数统计，适合数据量较大的 view。 |
| Record unique key | 记录唯一标识。用于定位一条记录，通常选择 view 中稳定唯一的字段或字段组合。 |
| Allow add new, update and delete actions | 是否允许新增、更新和删除。只有当数据库 view 本身支持写入，并且数据库账号有对应权限时才建议启用。 |

:::warning 注意

修改 Record unique key 或 Allow add new, update and delete actions 后，需要重新检查页面区块、权限和工作流是否仍然符合预期。

:::

## 删除视图

在数据表列表中，点击数据库视图右侧的「Delete」，可以删除数据库视图数据表。删除数据库视图数据表只会删除 NocoBase 中的连接配置和字段，不会删除数据库里的 view。

主数据库中的数据库视图也支持批量选择后统一删除。删除前需要检查页面区块、图表、权限、工作流和外部 API 是否还在使用这个数据库视图数据表。
![delete_view](https://static-docs.nocobase.com/delete_view.png)
![delete_view_second_confirmation](https://static-docs.nocobase.com/delete_view_second_confirmation.png)
