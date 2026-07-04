---
title: "外部数据库"
description: "NocoBase 外部数据库：连接已有 MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase/MSSQL/Oracle/ClickHouse/Doris 数据库，读取数据表结构、配置字段映射和关系字段。"
keywords: "外部数据库,MySQL,PostgreSQL,MariaDB,KingbaseES,OceanBase,MSSQL,Oracle,ClickHouse,Doris,数据表同步,字段映射,NocoBase"
---

# 外部数据库

## 介绍

外部数据库用于把已经存在的业务数据库接入 NocoBase ，读取外部数据库中的数据表、字段和视图，让这些数据表可以在页面区块、权限、工作流和 API 中使用。

与[主数据库](../main/database.md)不同，外部数据库的表结构由原系统、数据库客户端维护，NocoBase 负责读取表结构和视图，不会修改外部数据库的真实表结构。

外部数据库支持的数据库版本和商业版本如下：

| 数据库 | 支持版本 | 社区版 | 标准版 | 专业版 | 企业版 |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 5.7 | ❌ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 9.5 | ❌ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.3 | ❌ | ✅ | ✅ | ✅ |
| MSSQL | 2014-2019 | ❌ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |
| Oracle | >= 11g | ❌ | ❌ | ❌ | ✅ |
| ClickHouse | 以对应插件说明为准 | ❌ | ❌ | ❌ | ✅ |
| Doris | 以对应插件说明为准 | ❌ | ❌ | ❌ | ✅ |

:::tip 提示

KingbaseES 只支持 PostgreSQL 兼容模式，OceanBase、ClickHouse、Doris 只支持 MySQL 兼容模式。

:::

外部数据库适用场景：

- 连接已有业务系统（如老 ERP、MES、WMS）数据库，利用 NocoBase 的能力，在不改动原数据库表结构的前提下，快速搭建管理界面、权限控制、工作流和报表。
- 为已有系统补充轻量应用能力，比如审批、数据修正、异常处理、运营看板等，不需要替换原系统。
- 对已有数据库做只读查询、统计分析或 BI 展示，减少对原业务系统页面的依赖。
- 分阶段迁移历史系统，先在 NocoBase 中接入旧库继续使用，再逐步把新业务数据放到主数据库中维护。
- 数据库结构仍由 DBA、迁移脚本或原业务系统维护，NocoBase 只负责读取结构、配置界面和使用数据。

:::warning 注意

外部数据库不是 NocoBase 的系统数据库。NocoBase 不会接管外部数据库的备份、还原、迁移和表结构，这些仍然需要在外部数据库维护。

:::

## 插件安装

外部数据库由对应的数据源插件提供。安装并启用插件后，才能在「数据源管理」的「Add new」菜单中选择对应数据库类型。

| 数据库 | 对应插件 | 安装方式 |
| --- | --- | --- |
| MySQL | `@nocobase/plugin-data-source-external-mysql` | 需要商业授权，安装并启用插件后使用。 |
| PostgreSQL | `@nocobase/plugin-data-source-external-postgres` | 需要商业授权，安装并启用插件后使用。 |
| MariaDB | `@nocobase/plugin-data-source-external-mariadb` | 需要商业授权，安装并启用插件后使用。 |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | 需要商业授权，安装并启用插件后使用。 |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | 需要商业授权，安装并启用插件后使用。 |
| MSSQL | `@nocobase/plugin-data-source-external-mssql` | 需要商业授权，安装并启用插件后使用。 |
| Oracle | `@nocobase/plugin-data-source-external-oracle` | 需要商业授权，安装并启用插件后使用。 |
| ClickHouse | `@nocobase/plugin-data-source-external-clickhouse` | 需要商业授权，安装并启用插件后使用。 |
| Doris | `@nocobase/plugin-data-source-external-doris` | 需要商业授权，安装并启用插件后使用。 |

![add_new_database](https://static-docs.nocobase.com/add_new_database.png)

如果「Add new」菜单里没有目标数据库类型，通常需要先确认：

- 对应插件是否已经安装
- 插件是否已经启用
- 当前商业授权是否包含该插件
- 当前用户是否有数据源管理权限

## 添加外部数据库

在「数据源管理」中点击「Add new」，选择要接入的数据库类型，然后填写连接信息。

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

常见连接配置如下。不同数据库的表单会略有差异，实际以你选择的数据库类型为准。

| 配置 | 说明 |
| --- | --- |
| Data source name | 数据源标识名称，用于页面区块、权限、工作流和 API 中使用。创建后不能修改。 |
| Data source display name | 数据源在界面中显示的名称，建议使用业务人员能理解的名称，比如「ERP 数据库」「报表库」。 |
| Host / Port | 数据库主机地址和端口。 |
| Database | 要连接的数据库名称。MySQL、MariaDB、PostgreSQL、MSSQL、KingbaseES、ClickHouse、Doris 需要填写。 |
| Username / Password | 用于访问外部数据库的账号和密码，只读取该 Owner 下的数据表和视图。 |
| Schema | PostgreSQL、KingbaseES 等数据库可以通过 schema 限定读取范围。 |
| ServerName / Service name | Oracle 数据库需要填写服务名或类似连接参数。 |
| Connection mode | Oracle 数据库连接模式。Oracle Database 12.1 及以上版本通常使用 Thin 模式，早于 12.1 的版本使用 Thick 模式。 |
| Client directory | Oracle Thick 模式下的 Oracle Client 库目录。只有选择 Thick 模式时才需要配置。 |
| Table prefix | 表名前缀。配置后，NocoBase 只读取匹配该前缀的数据表和视图，并在 NocoBase 中生成不带前缀的数据表名称。 |
| Collections / Add all collections | 控制是否接入全部数据表。启用「Add all collections」时，NocoBase 会接入当前范围内的全部表；关闭后，只接入你在「Collections」里勾选的表。 |
| Enabled the data source | 是否启用这个数据源。关闭后，数据源配置会保留，但页面区块、权限、工作流和 API 无法继续使用它读取数据。 |
| SSL options | PostgreSQL 的 SSL 连接配置。可以设置 SSL mode、是否拒绝未授权证书，以及 CA 证书、客户端证书和客户端密钥路径。 |
| Encrypt connection / Trust server certificate | MSSQL 的连接加密配置。可以开启加密连接，也可以按数据库证书情况选择是否信任服务端证书。 |

### 选择数据表

填写连接信息后，可以先点击「Load Collections」读取外部数据库中可用的数据表和视图。读取结果会受到连接配置、schema、`Table prefix` 和数据库账号影响。

默认会启用「Add all collections」，表示接入当前范围内的全部数据表。如果只想接入部分表，可以关闭「Add all collections」，然后在列表中勾选需要的数据表。

建议只选择业务中会用到的数据表。这样可以减少无关表进入 NocoBase，也能降低后续同步、权限配置和页面搭建时的维护成本。

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning 注意

单个外部数据源一次最多接入 500 张数据表或视图。如果外部数据库中的对象很多，建议先通过 schema、Owner、`Table prefix` 或「Collections」收窄范围，只接入当前应用会用到的表。

:::

:::warning 注意

无主键数据表，需要[**编辑数据表**](#编辑数据表)，设置**记录唯一标识**，否则无法在页面中创建区块、无法正确查看或编辑记录

:::

## 编辑外部数据库

编辑外部数据库不仅会修改连接参数，也可能改变这个数据源在 NocoBase 中接入的数据表范围。比如修改 `Database`、`Schema`、`Table prefix`，或者调整「Add all collections」和「Collections」勾选项，都可能让 NocoBase 新增或移除部分数据表。

在数据源列表中，点击某个外部数据库右侧的「Edit」，可以修改外部数据库的配置信息。`Data source name` 不能修改，其他配置可以修改。修改后，NocoBase 会使用新的连接信息访问外部数据库。配置信息参考上文[「添加外部数据库」](#添加外部数据库)的说明。
![edit_external_database](https://static-docs.nocobase.com/edit_external_database.png)
![edit_external_database_configure](https://static-docs.nocobase.com/edit_external_database_configure.png)

变更连接信息前，建议先确认这些影响：

- 修改账号后，是否仍然能读取需要的数据表、视图、字段、主键和索引
- `Database`、`Schema` 或 `Table prefix` 变化后，原来接入的数据表是否还在当前范围内
- 关闭「Add all collections」或调整「Collections」勾选后，页面区块、权限、工作流和 API 是否还依赖被移除的数据表

:::warning 注意

修改连接信息后，NocoBase 会使用新的连接配置访问外部数据库。如果新的数据表范围少了某些表，NocoBase 会移除这些表，依赖它们的页面区块、权限、工作流和 API 可能无法正常工作。这个操作不会删除外部数据库中的真实表和数据。

:::

## 删除外部数据库

在数据源列表中，点击某个外部数据库右侧的「Delete」，可以删除这个外部数据库在 NocoBase 中的数据源配置。
![delete_external_database](https://static-docs.nocobase.com/delete_external_database.png)

删除外部数据库数据源不会删除外部数据库本身，也不会删除外部数据库里的真实数据表和记录。它只会移除 NocoBase 中保存的数据源、数据表和字段配置。

删除前建议检查这些内容：

- 页面区块是否还在使用这个外部数据库
- 权限规则是否引用了这个数据源或其中的数据表
- 工作流、图表、API 调用是否依赖这些数据表
- 关系字段是否引用了这个外部数据库中的表

:::warning 注意

删除数据源后，依赖该数据源的页面区块、权限、工作流和 API 可能无法正常工作。如果只是临时连接失败，优先编辑连接配置，不要直接删除数据源。

:::

## 外部数据库管理

在数据源列表中，点击某个外部数据库右侧的「Configure」，可以访问外部数据库，进行管理。
![edit_database](https://static-docs.nocobase.com/edit_database.png)

外部数据库提供数据表管理功能，可以检索、变更、删除数据表，也可以同步数据库中已有数据表的字段；提供数据表字段变更、关系字段创建。

- **筛选**：检索 NocoBase 外部数据库管理的数据表
- **编辑**：变更业务数据表
- **删除**：删除业务数据表
- **从数据库同步**：同步数据库中已有数据表的结构
- **配置字段**：数据表字段变更、关系字段创建

### 新增数据表

外部数据库不支持在 NocoBase 中直接创建普通数据表。新增外部数据库的数据表，先在数据库侧创建表或视图，再回到 NocoBase 接入。

如果数据源启用了「Add all collections」，新表创建后可以在外部数据库管理页使用[**「Sync from database」**](#从数据库同步)同步结构，会读取当前范围内新出现的数据表。

如果数据源关闭了「Add all collections」，需要先[**编辑外部数据库**](#变更外部数据库)配置，在「Collections」中勾选新增的数据表并保存；然后进入数据表管理，使用[「Sync from database」](#从数据库同步)同步字段结构。

### 从数据库同步

外部数据库建立连接后，NocoBase 会读取数据源里的数据表。后续如果在数据库侧新增表、删除表、修改字段、调整字段类型或调整 view，需要在 NocoBase 中同步结构。

在外部数据库的数据表列表中点击「Sync from database」，可以重新读取表结构，并更新 NocoBase 中保存的表和字段。数据库侧删除的表会同步移除，启用「Add all collections」时，新表会被加入。

![sync_from_external_database](https://static-docs.nocobase.com/sync_from_external_database.png)

:::warning 注意

同步结构不会替你迁移页面配置。表被移除、字段被删除、字段重命名、字段类型变化，都可能影响页面区块、权限规则、工作流变量和 API 调用参数。同步前先确认这些配置是否还在使用旧表或旧字段，同步后需要检查并调整相关配置。

:::

:::warning 注意

无主键数据表，需要[**编辑数据表**](#变更数据表)，设置**记录唯一标识**，否则无法在页面中创建区块、无法正确查看或编辑记录

:::

### 编辑数据表

外部数据库的数据表结构由数据库侧维护。在数据表列表中，点击某个数据表右侧的「Edit」，用于调整数据表在 NocoBase 里的元信息，不会修改外部数据库中的真实表结构。
![edit_external_collection](https://static-docs.nocobase.com/edit_external_collection.png)
![edit_external_collection_configure](https://static-docs.nocobase.com/edit_external_collection_configure.png)

| 配置 | 说明 |
| --- | --- |
| Collection display name | 数据表在界面中显示的名称。可以改成业务人员能理解的名称，比如「客户」「订单」「库存明细」。 |
| Collection name | 数据表在 NocoBase 中的标识名称。该名称由外部数据库表名生成，不支持修改。 |
| Categories | 数据表分类。只影响数据源管理界面的组织方式，不改变表结构。 |
| Description | 数据表说明。适合写数据来源、维护系统、同步方式或注意事项。 |
| Use simple pagination mode | 简单分页模式。启用后，表格区块分页时会跳过总记录数统计，适合数据量很大的外部表。 |
| Record unique key | 记录唯一标识。用于定位一条记录，通常选择主键或唯一字段。数据库视图需要特别关注这个配置，否则无法在页面中创建区块、无法正确查看或编辑记录。 |

### 配置字段

在数据表列表中，点击某个数据表右侧的「Configure fields」，可以进入字段配置页面。外部数据库的字段配置用于维护字段在 NocoBase 中如何显示、如何交互、如何作为标题字段使用，以及如何把数据库字段类型映射为 Field type 和 Field interface。

外部数据库的物理字段来自数据库侧同步，NocoBase 不会在外部数据库中直接新增、修改或删除这些字段。在字段配置页中，NocoBase 只能新增关系字段，用来补充 NocoBase 中的业务关联。
[了解更多字段配置信息](../field/field.md)
![configure_field_external_collection](https://static-docs.nocobase.com/configure_field_external_collection.png)

#### 新增关系字段

在 NocoBase 中，外部数据库只能新增关系字段。关系字段可以基于已有的主键、外键或唯一字段建立关联，但不会在外部数据库中创建真实字段。
[了解更多字段配置信息](../field/field.md)
![external_database_add_relation_fields](https://static-docs.nocobase.com/external_database_add_relation_fields.png)
![relation_field_configure](https://static-docs.nocobase.com/relation_field_configure.png)

| 配置 | 说明 |
| --- | --- |
| Field interface | 关系字段的类型，比如一对一、一对多、多对一、多对多。选择后会出现对应的关系配置。 |
| Field display name | 关系字段在界面中显示的名称。建议使用业务人员能理解的名称，比如「所属客户」「关联订单」。 |
| Field name | 关系字段在 NocoBase 中保存的标识名称，用于 API、权限、工作流等内部引用。 |
| Target collection | 要关联的目标数据表。可以选择外部数据库中的表，也可以按实际业务关联到其他数据源中的表。 |
| Relation keys | 关系字段使用的关联键。通常基于已有的主键、外键或唯一字段建立关系，不会在外部数据库中创建新字段。 |
| Description | 字段说明。适合写关联关系含义、数据来源、维护方式或注意事项。 |

:::warning 注意

新增物理字段、修改字段类型、调整索引或删除字段，都需要先在外部数据库侧完成，再用「Sync from database」更新 NocoBase 中保存的字段。

:::

#### 字段映射

外部数据库连接后，NocoBase 会根据数据库字段类型推断 Field type，并匹配一个默认 Field interface。如果输入方式、展示方式或业务含义不符合预期，可以在字段配置中调整 Field interface。
[了解更多字段配置信息](../field/field.md)

![mapping_field](https://static-docs.nocobase.com/mapping_field.png)

:::tip 提示

- Field Interface（界面类型 / UI 类型）：决定字段在前端如何展示和交互。比如「单行文本」「数字」「下拉菜单」「日期时间」等，它是用户视角的字段分类
- Field Type（数据类型）：决定 NocoBase 如何识别字段的数据类型。外部数据库的普通字段通常由数据库字段类型推断，比如 `string`、`integer`、`decimal`、`boolean`、`datetime` 等

:::

:::warning 注意

切换 Field type 或 Field interface 不等于修改外部数据库的字段类型。它主要影响页面展示方式、校验规则、存储的数据格式。

:::

如果遇到 NocoBase 无法识别的数据库字段类型，字段会单独展示出来。

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

处理方式：

- 在数据库侧改成 NocoBase 可识别的字段类型
- 通过插件扩展字段类型和 Field interface 适配
- 暂时不在页面区块中使用该字段

#### 标题字段

标题字段用于关系字段选择、关联数据在页面区块展示时候，默认显示的数据。比如客户表通常可以把「客户名称」设为标题字段，订单表可以把「订单编号」设为标题字段。这样在其他表选择客户或订单时，看到的是业务人员能理解的文本，而不是内部 ID。

#### 编辑字段

点击字段右侧的「Edit」可以编辑字段配置。编辑字段适合调整字段在 NocoBase 中的展示和使用方式，比如修改显示名称、描述、界面类型、校验规则或字段专属配置。
[了解更多字段配置信息](../field/field)
![edit_field](https://static-docs.nocobase.com/edit_field.png)
![edit_field_configure](https://static-docs.nocobase.com/edit_field_configure.png)

:::warning 注意

编辑字段配置不会修改外部数据库中的真实字段名、字段类型、长度、默认值或索引。如果需要调整这些结构，请先在数据库侧完成，再使用「Sync from database」同步。

:::

#### 删除关系字段

外部数据库在 NocoBase 中仅支持删除关系字段。删除关系字段只会移除 NocoBase 中保存的关系字段，不会删除外部数据库中的真实字段或数据。

如果需要删除外部数据库中的物理字段，请先在数据库侧完成，再回到 NocoBase 使用「Sync from database」同步字段结构。
[了解更多字段配置信息](../field/field.md)
![delete_field](https://static-docs.nocobase.com/delete_field.png)

:::warning 注意

删除关系字段或同步物理字段删除，都可能影响页面区块、表单、权限、工作流、API 和已有配置。删除前先确认字段是否仍被使用。

:::

## [REST API](rest-api)
## [外部 NocoBase ](nocobase)
