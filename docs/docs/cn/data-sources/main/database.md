---
pkg: "@nocobase/plugin-data-source-main"
title: "主数据库"
description: "NocoBase 主数据库：存储系统表数据与业务数据，支持 MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase，从数据库同步表表结构、创建普通表/树表/SQL 表等"
keywords: "主数据库,MySQL、PostgreSQL、MariaDB、KingbaseES、OceanBase,数据表同步"
---
# 主数据库

## 介绍

[部署 NocoBase ](/ai/install-nocobase-app)配置的数据库，用于存储 NocoBase 的系统表数据，也支持存储用户业务表数据，支持数据库：

:::warning 注意
- MySQL>=8.0.17
- PostgreSQL>=10
- MariaDB>=10.9
- KingbaseES>=
- OceanBase>=

:::
## 安装

内置插件，无需单独安装。

## 访问主数据库

1. 点击系统功能中的数据源菜单，访问数据源主页。
2. 选择数据源列表中的 **Main** 数据源，点击**配置**操作，访问主数据库，进行管理。

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
## 主数据库管理

主数据库提供数据表管理功能，可以检索、创建、变更、删除数据表，也可以同步数据库中已有数据表的字段；提供数据表字段创建、变更、删除。
- **筛选**：检索 NocoBase 主数据库管理的数据表
- **创建数据表**：新增业务数据表
- **编辑**：变更业务数据表
- **删除**：删除业务数据表
- **从数据库同步**：同步数据库中已有数据表的结构
- **配置字段**：数据表字段创建、变更、删除
-  **+** ：tab页的 **+** 对数据表分类管理，创建、变更、删除分类
![main_datasource_management](https://static-docs.nocobase.com/main_datasource_management.png)
### 新增数据表
**支持多种表结构类型：**

- [**普通数据表**](/data-sources/data-source-main/general-collection)：适合保存常规业务数据，比如客户、订单、合同、报销单。
- [**树结构表**](/data-sources/collection-tree)：适合保存有上下级关系的数据，比如组织架构、商品分类、地区层级。
- [**日历数据表**](/data-sources/calendar/calendar-collection)：适合保存带开始时间、结束时间或日期范围的数据，比如会议室预约、项目排期、课程安排、值班计划。配合[日历区块](/interface-builder/blocks/data-blocks/calendar)展示、添加数据。
- [**文件数据表**](/data-sources/file-manager/file-collection)：适合管理文件本身，比如合同附件、发票文件、产品图片、员工证件。文件表保存的是文件元信息，文件实际由文件存储引擎保存；在业务表（普通表、树表、日历表）中创建[关系字段](#)关联文件表，使用业务表创建区块配置关系字段上传文件，文件元信息会自动保存到文件表中。
- [**继承表**](/data-sources/data-source-main/inheritance-collection)：适合多类业务对象有一组公共字段，但每一类又有自己的专属字段的场景。比如先创建一个「资产」父表，放置资产编号、资产名称、购入日期、负责人等公共字段，再派生出「电脑资产」「车辆资产」「办公家具」等子表；子表会继承父表结构，同时可以继续定义 CPU、车牌号、规格型号等自己的字段。

![create_collection](https://static-docs.nocobase.com/create_collection.png)
![create_collection_configure](https://static-docs.nocobase.com/create_collection_configure.png)

| 配置 | 说明 |
| --- | --- |
| Collection display name | 数据表在界面中显示的名称，比如「客户」「订单」「合同附件」。建议使用业务人员能直接理解的名称。 |
| Collection name | 数据表的内部名称，用于 API、关系字段、权限、工作流等内部引用。它会自动生成，也可以手动修改；只支持字母、数字和下划线，并且必须以字母开头。 |
| Inherits | 选择要继承的父表。当前数据表会继承父表的字段结构，同时还可以继续定义自己的字段。适合多个数据表有公共字段的场景。**仅在主数据库是 PostgreSQL 的时候可见**。 |
| Categories | 数据表分类。分类只影响数据表管理界面的组织方式，不改变数据表结构。数据表较多时，建议按业务模块分类，比如「客户管理」「项目管理」「财务」。 |
| Description | 数据表说明。可以写数据表保存什么数据、由谁维护、和哪些业务流程有关，方便后续维护。 |
| Use simple pagination mode | 简单分页模式。启用后，表格区块分页时会跳过总记录数统计，适合数据量很大的表，可以减少查询压力。 |
| Preset fields | 预设字段。创建表时可以选择是否自动添加 ID、创建时间、创建人、更新时间、更新人等常用字段。普通业务表建议保留这些字段。 |

**主键说明**
- Primary key：标识主键字段。用于在数据库层唯一标识一条记录。创建表时建议保留 ID 预设字段，默认主键类型是 `Snowflake ID (53-bit)`；如果有特殊需要，也可以选择文本、整数、UUID 或 Nano ID 作为主键。

![create_collection_primary_key](https://static-docs.nocobase.com/create_collection_primary_key.png)

:::warning 注意
无主键数据表，需要编辑数据表，设置**记录唯一标识**，否则无法在页面中创建区块、无法正确查看或编辑记录

:::

### 变更数据表
在数据表列表中，点击某个数据表右侧的「Edit」，可以修改数据表的基础配置。编辑数据表主要用于调整数据表元信息和部分运行配置，不是用来批量修改字段结构。
![edit_collection](https://static-docs.nocobase.com/edit_collection.png)
![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

| 配置 | 允许编辑 | 说明 |
| --- | --- | --- |
| Collection display name | ✅ | 数据表在界面中显示的名称，比如「客户」「订单」「合同附件」。建议使用业务人员能直接理解的名称。 |
| Collection name | ❌ | 数据表的内部名称，用于 API、关系字段、权限、工作流等内部引用。它会自动生成，也可以手动修改；只支持字母、数字和下划线，并且必须以字母开头。 |
| Inherits | ❌ | 选择要继承的父表。当前数据表会继承父表的字段结构，同时还可以继续定义自己的字段。适合多个数据表有公共字段的场景。**仅在主数据库是 PostgreSQL 的时候可见**。 |
| Categories | ✅ | 数据表分类。分类只影响数据表管理界面的组织方式，不改变数据表结构。数据表较多时，建议按业务模块分类，比如「客户管理」「项目管理」「财务」。 |
| Description | ✅ | 数据表说明。可以写数据表保存什么数据、由谁维护、和哪些业务流程有关，方便后续维护。 |
| Use simple pagination mode | ✅ | 简单分页模式。启用后，表格区块分页时会跳过总记录数统计，适合数据量很大的表，可以减少查询压力。 |
| Record unique key | ✅ | 记录唯一标识。用于定位一条记录，通常选择主键或唯一字段。SQL 表和数据库视图需要特别关注这个配置，否则可能无法在页面区块中正确查看或编辑记录。 |

### 删除数据表
在数据表列表中，点击某个数据表右侧的「Delete」，可以删除数据表。主数据库中的数据表还支持批量选择后统一删除。
![delete_collection](https://static-docs.nocobase.com/delete_collection.png)


### 配置字段
在数据表列表中，点击某个数据表右侧的「Configure fields」，可以进入字段配置页面。字段配置用于维护一张数据表有哪些字段、字段在界面中如何显示、字段值如何保存，以及哪一个字段作为记录的默认标题。
![configure_field](https://static-docs.nocobase.com/configure_field.png)

#### 新增字段
点击「Add field」可以新增字段。先选择 Field interface，再填写字段显示名称和字段名称。Field interface 决定这个字段在界面中如何输入和展示，比如单行文本、数字、日期、下拉选项、附件或关系选择。
[了解更多字段配置信息](../field)
![add_field](https://static-docs.nocobase.com/add_field.png)
![add_field_configure](https://static-docs.nocobase.com/add_field_configure.png)

| 配置 | 说明 |
| --- | --- |
| Field interface | 字段的界面类型。它会影响字段表单中后续出现的配置项。 |
| Field display name | 字段在界面中显示的名称。建议使用业务人员能直接理解的名称，比如「客户名称」「预计完成时间」。 |
| Field name | 字段内部名称。创建后通常不再修改，只支持字母、数字和下划线，并且必须以字母开头。 |
| Field type | 字段在数据层的类型。通常由所选 Field interface 自动带出，只有部分字段需要手动选择。 |
| 专属配置 | 不同字段会出现不同配置。比如选项字段需要配置选项，关系字段需要选择目标数据表，附件字段需要确认文件相关配置。 |
| 校验规则 | 控制字段是否必填、是否唯一、格式是否符合要求等。实际可用规则取决于字段类型。 |
| Description | 字段说明。适合写字段含义、录入要求、数据来源或维护人。 |

#### 映射Field interface

[了解更多字段配置信息](../field)

#### 编辑字段
点击字段右侧的「Edit」可以编辑字段配置。编辑字段适合调整字段在 NocoBase 中的展示和使用方式，比如修改显示名称、描述、界面类型、校验规则或字段专属配置。
[了解更多字段配置信息](../field)
![edit_field](https://static-docs.nocobase.com/edit_field.png)
![edit_field_configure](https://static-docs.nocobase.com/edit_field_configure.png)

#### 删除字段
点击字段右侧的「Delete」可以删除单个字段。主数据源中还可以勾选多个字段后，点击顶部的「Delete」批量删除。
![delete_field](https://static-docs.nocobase.com/delete_field.png)

:::warning 注意
删除字段可能影响页面区块、表单、权限、工作流、API 和已有数据。删除前先确认字段是否仍被使用；如果字段来自外部数据库、SQL 查询或数据库视图，优先在数据源侧确认结构变更，再回到 NocoBase 同步字段。
:::

### 从数据库同步

#### 从数据库加载数据表

#### 从数据库同步表结构

### [连接数据库视图](collection-view)

### [创建 SQL 数据表](collection-sql)