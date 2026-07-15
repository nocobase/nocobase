---
pkg: "@nocobase/plugin-collection-sql"
title: "SQL 表"
description: "通过 SQL 查询结果创建数据表，配置字段来源、字段映射和记录唯一标识，适用于关联查询、统计和报表展示。"
keywords: "SQL 表,SQL collection,SQL 查询,字段映射,报表,NocoBase"
---

#  SQL 表

## 介绍

编写 SQL 查询语句形成  SQL 表，不会在数据库创建真实数据库表，是读取 SQL 查询结果，让查询结果可以在表格、详情、图表和工作流中使用。适用场景：汇总数据、统计报表。

:::warning 注意

 SQL 表只支持 `SELECT` 语句或 `WITH ... SELECT` 语句，只支持数据查询展示，不支持数据的新增、编辑和删除。

:::

## 创建  SQL 表

1. 点击系统功能中的数据源菜单，访问数据源主页。
2. 选择数据源列表中的 **Main** 数据源，点击「Configure」操作，访问主数据库。
3. 在主数据库管理中点击「Create collection」，选择「SQL collection」。

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![create_sql_collection](https://static-docs.nocobase.com/create_sql_collection.png)
![create_sql_collection_configure](https://static-docs.nocobase.com/create_sql_collection_configure.png)

| 配置 | 说明 |
| --- | --- |
| Collection display name | SQL 表在界面中显示的名称，比如「销售汇总」「库存预警」。建议使用能说明查询结果含义的名称。 |
| Collection name | SQL 表在 NocoBase 中的标识名称，用于 API、关系字段、权限、工作流等内部引用。它会自动生成，也可以手动修改；只支持字母、数字和下划线，并且必须以字母开头。 |
| Categories | 数据表分类。只影响数据表管理界面的组织方式，不改变 SQL 查询。 |
| Description | 数据表说明。建议写清楚这段 SQL 查询了哪些数据、由谁维护、用于哪个页面或报表。 |
| Record unique key | 记录唯一标识。SQL 查询结果没有真实主键，需要选择一个能唯一定位记录的字段或字段组合，否则可能无法在区块中正确查看记录。 |
| SQL | SQL 表使用的查询语句。NocoBase 会执行这段 SQL，基于查询结果配置字段，再把查询结果作为数据表使用。 |
| Source collections | SQL 查询结果的字段来源。用于把查询结果中的字段和已有数据表字段关联起来，帮助 NocoBase 识别字段来源和界面类型。 |
| Fields | 字段映射配置。用于确认每个字段的名称、来源、界面类型和显示名称。 |
| Preview | 预览 SQL 查询结果。提交前可以先确认字段映射和展示效果是否符合预期。 |

### 编写 SQL 查询语句

输入 SQL 查询语句，点击「Execute」，执行查询并尝试解析返回字段和来源数据表。
点击「Execute」只用于执行预览和字段解析。确认 SQL 查询语句可用后，再点击「Confirm」，表单才能把这段 SQL 作为已确认的查询语句提交。

![execute_sql_statement](https://static-docs.nocobase.com/202405191453556.png)

:::tip 提示

`Source collections` 是根据 SQL 查询语句推断出的来源数据表。识别查询结果里的字段主要来自哪些已有数据表，并在字段映射时限定可选的 `Field source`。

推断结果用于辅助快速配置。如果 SQL 查询语句中有别名、子查询、计算字段、聚合函数或复杂 join，结果可能不完全准确或者无法推断，可以手动指定 `Source collections`。

:::

### 字段映射

字段映射是创建  SQL 表后必须确认的配置。SQL 查询结果本身只告诉 NocoBase 返回了哪些列。为了让这些列像普通字段一样在界面中使用，还需要确认 `Field source`或者配置 `Field interface` 和字段显示名称。
[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

![configure_sql_field_source](https://static-docs.nocobase.com/202405191453579.png)
![configure_sql_field_interface](https://static-docs.nocobase.com/202405191454703.png)

| 配置 | 说明 |
| --- | --- |
| Field source | 选择 SQL 查询结果字段来自哪个已有数据表和字段。选中来源后，NocoBase 可以复用原字段的 Field interface。 |
| Field interface | 确认字段在页面中如何展示和输入，比如单行文本、数字、日期、下拉选项。 |
| Field display name | 字段在界面中显示的名称。建议使用业务人员能理解的名称。 |

比如 SQL 查询里返回 `customers.name as customer_name`，并且它来自客户表的「客户名称」字段，可以把它映射到客户表对应字段。这样 NocoBase 就能沿用原字段的标题和界面配置。

如果字段来自计算结果，比如 `count(*) as total`、`sum(amount) as amount_total`，通常没有明确的来源字段，需要手动选择合适的 Field interface。

:::tip 提示

`Field source` 依赖 `Source collections`。只有先选中来源数据表，字段映射表里才会出现该数据表下可选的来源字段。

字段推断有 `Field source` 时，NocoBase 会优先复用来源字段的 Field interface。如果不能推断来源字段，可以手动指定 `Field source`；如果推断结果不符合业务含义，需要删除 `Field source`，可以手动指定 `Field source`，或者手动选择 `Field interface` 和配置 `Field display name`。

:::

### 记录唯一标识

SQL 表需要配置 Record unique key，否则无法在页面中创建区块、无法正确查看记录。支持选择一个字段或者多个字段组合作为唯一标识。适合作为 Record unique key 的字段通常满足这些条件：

- 查询结果中每一行都唯一
- 字段值稳定，不会因为分页、排序或统计口径变化而变化
- 字段不为空
- 字段在查询结果中始终返回

如果查询结果来自单表，可以优先返回原表主键。如果查询结果来自多表 join 或聚合，可以在 SQL 中保留一个稳定的业务 ID，或返回多个能共同定位记录的字段。

:::warning 注意

不要使用 `row_number()` 这类会随排序、筛选或统计范围变化的值作为长期稳定的 Record unique key。记录唯一标识变化后，页面区块、权限、工作流和外部 API 可能无法定位同一条记录。

:::

### 预览查询结果

提交前先使用 Preview 查看 SQL 查询结果。预览时重点确认：

- SQL 是否能正常执行
- 返回字段是否完整
- Field interface 和显示名称是否符合业务含义
- Record unique key 是否存在并且数据唯一
- 查询结果是否适合页面展示

![preview_sql_collection](https://static-docs.nocobase.com/202405191455439.png)

## 配置字段

 SQL 表创建后，在数据表列表中，点击  SQL 表右侧的「Configure fields」，可以进入字段配置页面。字段配置用于维护  SQL 表有哪些字段、字段在界面中如何显示，以及 SQL 查询结果如何映射为 NocoBase 的 Field interface。
[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

### 切换UI类型

 SQL 表创建后，仍然可以在字段配置中调整字段的界面配置。字段配置页主要用于切换 Field interface、修改显示名称、描述和字段专属配置。
![configure_field_sql](https://static-docs.nocobase.com/configure_field_sql.png)

适合在这里处理这些情况：

- 创建  SQL 表时，设 Field interface 不正确
- 字段显示名称不符合业务习惯，需要改成更易理解的名称
- 查询结果字段的业务含义发生变化，需要重新确认展示方式
- 字段描述或字段专属配置需要调整,比如下拉选项

### 从数据库同步

如果 SQL 查询语句没有变化，但底层数据表结构或字段发生变化，可以进入「Configure fields」，点击「Sync from database」重新执行 SQL 并同步字段。字段映射参考[「创建  SQL 表」](#字段映射)。

![sync_sql_collection_fields](https://static-docs.nocobase.com/202405191456216.png)

### 编辑字段

点击字段右侧的「Edit」可以编辑字段配置。编辑字段适合调整字段在 NocoBase 中的展示和使用方式，比如修改显示名称、描述、校验规则或字段专属配置。
[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

:::warning 注意

编辑字段配置不会修改 SQL 查询语句、来源表字段名、来源表字段定义或数据库索引。如果需要调整查询结果里的真实列，请先修改 SQL 查询语句，再重新执行和同步字段。

:::

### 删除字段

点击字段右侧的「Delete」可以删除单个字段。删除字段只会移除 NocoBase 中保存的字段，不会删除 SQL 查询语句，也不会删除来源数据表里的真实列。
[了解更多字段配置信息](../data-modeling/collection-fields/index.md)

:::warning 注意

删除字段可能影响页面区块、筛选条件、排序、权限、工作流、API 和已有配置，删除前先确认字段是否仍被使用。如果 SQL 查询语句中仍然返回这个列，后续执行「Sync from database」时，NocoBase 可能会再次识别到这个字段。

:::

## 编辑  SQL 表

在数据表列表中，点击某个  SQL 表右侧的「Edit」，可以调整  SQL 表在 NocoBase 中的元信息和运行配置。编辑时的配置项和创建  SQL 表时基本一致，仅`Collection name` 不可修改。

如果 SQL 查询语句发生变化，需要重新点击「Execute」并确认字段映射、Record unique key 和预览结果。

![edit_sql_collection](https://static-docs.nocobase.com/202405191455302.png)

:::warning 注意

修改 SQL 查询语句可能导致字段名称、字段映射或 Record unique key 变化。修改后请重新检查页面区块、图表、权限和工作流是否仍然可用。

:::

## 删除  SQL 表

在数据表列表中，点击  SQL 表右侧的「Delete」，只会删除 NocoBase 中的  SQL 表配置和字段，不会删除底层来源表，也不会删除来源表中的数据。
也支持批量选择后统一删除。删除前需要检查页面区块、图表、权限、工作流和外部 API 是否还在使用这个  SQL 表。
