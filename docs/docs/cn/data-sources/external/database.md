---
title: "外部数据库"
description: "NocoBase 外部数据库：连接已有 MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase/MSSQL/Oracle/ClickHouse/Doris 数据库，读取数据表结构、配置字段映射和关系字段。"
keywords: "外部数据库,MySQL,PostgreSQL,MariaDB,KingbaseES,OceanBase,MSSQL,Oracle,ClickHouse,Doris,数据表同步,字段映射,NocoBase"
---

# 外部数据库

## 介绍

外部数据库用于把已经存在的业务数据库接入 NocoBase ，读取外部数据库中的数据表、字段和视图，让这些数据表可以在页面区块、权限、工作流和 API 中使用。

跟[主数据库](../main/database.md)不同，外部数据库的表结构由原系统、数据库客户端维护，NocoBase 负责读取表结构和视图，不会修改外部数据库的真实表结构。

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
| Data source name | 数据源内部标识，用于页面区块、权限、工作流和 API 中使用。创建后不能修改。 |
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

## 变更外部数据库

在数据源列表中，点击某个外部数据库右侧的「Edit」，可以修改外部数据库的配置信息。`Data source name` 不能修改，其他配置可以修改。修改后，NocoBase 会使用新的连接信息访问外部数据库。配置信息参考上文[「添加外部数据库」](#添加外部数据库)的说明。

变更连接信息前，建议先确认这些影响：

- 如果修改账号是否仍然能读取需要的数据表、视图、字段、主键和索引
- `Database`、`Schema` 或 `Table prefix` 变化后，原来接入的数据表是否还在当前范围内
- 关闭「Add all collections」或调整「Collections」勾选后，页面区块、权限、工作流和 API 是否还依赖被移除的数据表

:::warning 注意

修改连接信息后，NocoBase 会使用新的连接配置访问外部数据库。提交前先确认新账号能读取数据表结构，并且页面区块、权限、工作流和 API 仍然能访问需要的数据表。

:::

## 删除外部数据库

在数据源列表中，点击某个外部数据库右侧的「Delete」，可以删除这个外部数据库在 NocoBase 中的数据源配置。

删除外部数据库数据源不会删除外部数据库本身，也不会删除外部数据库里的真实数据表和记录。它只会移除 NocoBase 中保存的数据源、数据表元数据和字段配置。

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
- **配置字段**：数据表字段变更、关系字段创建。

外部数据库的管理边界和主数据库不同：

| 能力 | 外部数据库 | 说明 |
| --- | --- | --- |
| 读取已有数据表 | ✅ | 连接后读取外部数据库中的已有表和 view。 |
| 创建普通数据表 | ❌ | 普通表需要在外部数据库侧创建，再回到 NocoBase 同步。 |
| 修改普通字段结构 | ❌ | 字段类型、长度、默认值等结构变更需要在数据库侧完成。 |
| 删除数据表 | ❌ | 不建议在 NocoBase 中删除外部数据库真实表。 |
| 配置字段显示 | ✅ | 可以调整 Field display name、Field interface、标题字段等元数据。 |
| 新增关系字段 | ✅ | 可在 NocoBase 中补充关系字段，用于建立表之间的业务关联。 |
| 页面区块使用 | ✅ | 配置 Record unique key 后，可以在页面中创建表格、表单、详情、图表等区块。 |

### 新增数据表

外部数据库不支持在 NocoBase 中直接创建普通数据表。要新增外部数据库的数据表，需要先在数据库侧创建表或视图，再回到 NocoBase 接入。

如果数据源启用了「Add all collections」，新表创建后可以在外部数据库管理页使用「Sync from database」同步结构，NocoBase 会读取当前范围内新出现的数据表。

如果数据源关闭了「Add all collections」，需要先编辑外部数据库配置，在「Collections」中勾选新增的数据表并保存；然后进入数据表管理，使用「Sync from database」同步字段结构。

:::tip 提示

新增普通字段、修改字段类型或删除字段，也都需要先在数据库侧完成，再用「Sync from database」更新 NocoBase 中保存的元数据。

:::

### 变更数据表

外部数据库的数据表结构由数据库侧维护。NocoBase 中的「Edit」主要用于调整数据表在 NocoBase 里的元信息，不会修改外部数据库中的真实表结构。

| 配置 | 说明 |
| --- | --- |
| Collection display name | 数据表在界面中显示的名称。可以改成业务人员能理解的名称，比如「客户」「订单」「库存明细」。 |
| Categories | 数据表分类。只影响数据源管理界面的组织方式，不改变表结构。 |
| Description | 数据表说明。适合写数据来源、维护系统、同步方式或注意事项。 |
| Use simple pagination mode | 简单分页模式。启用后，表格区块分页时会跳过总记录数统计，适合数据量很大的外部表。 |
| Record unique key | 记录唯一标识。外部表没有主键、使用联合主键或接入 view 时，需要特别配置。 |

:::tip 提示

如果要新增字段、修改字段类型、调整索引或删除字段，请先在外部数据库侧完成，再回到 NocoBase 使用「Sync from database」同步结构。

:::

### 从数据库同步

外部数据库建立连接后，NocoBase 会读取数据源里的数据表。后续如果在数据库侧新增表、删除表、修改字段或调整 view，需要回到 NocoBase 中同步结构。

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

同步会更新 NocoBase 中保存的数据表和字段元数据，包括表名、字段、字段类型、主键、唯一键和可识别的关系信息。

:::warning 注意

同步结构不会替你迁移页面配置。字段删除和字段重命名都可能影响页面区块、权限规则、工作流变量和 API 调用参数。同步前先确认这些配置是否还在使用旧字段。

:::

### 配置字段

外部数据库连接后，NocoBase 会自动读取已有字段，并把数据库字段类型映射为 NocoBase 的 Field type 和 Field interface。

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

| 配置 | 说明 |
| --- | --- |
| Field display name | 字段在界面中显示的名称，可以改成业务人员能理解的名称。 |
| Field name | 外部数据库中的真实字段名，通常不在 NocoBase 中修改。 |
| Field type | 字段在数据层的类型，由数据库字段类型推断。 |
| Field interface | 字段在界面中的展示和输入方式，比如单行文本、数字、日期、下拉菜单。 |
| Title field | 记录在关系选择、关联展示、详情标题等位置默认显示的字段。 |
| Description | 字段说明，适合写字段含义、数据来源或维护人。 |

比如外部数据库中的 `varchar` 字段，在 NocoBase 中可以显示为「单行文本」「邮箱」「手机号」「URL」「颜色」等 UI 类型。实际选择哪一种，要看这个字段的业务含义。

:::warning 注意

切换 Field interface 不等于修改外部数据库的字段类型。它主要影响页面控件、展示方式和校验规则。外部数据库真实字段类型仍然以数据库侧为准。

:::

### 新增字段

外部数据库不适合在 NocoBase 中新增普通字段。如果需要新增普通字段，建议先在数据库侧完成表结构变更，再回到 NocoBase 同步结构。

在 NocoBase 中，外部数据库通常只新增关系字段。关系字段用于补充 NocoBase 里的业务关联，不一定会在外部数据库中创建真实字段。

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

适合新增关系字段的场景：

- 外部数据库中缺少外键约束，但业务上确实有关联关系
- 需要在 NocoBase 页面里通过关系选择器选择关联记录
- 需要在详情、表格、工作流或权限中使用关联数据
- 需要把两个外部表、外部表和主数据库表关联起来使用

### 字段映射

字段映射用于把数据库字段类型转换成 NocoBase 可识别的 Field type 和 Field interface。

| 概念 | 作用 | 例子 |
| --- | --- | --- |
| 数据库字段类型 | 外部数据库中真实的字段类型。 | `varchar`、`int`、`decimal`、`timestamp`、`json`。 |
| Field type | NocoBase 识别到的数据层类型。 | `string`、`integer`、`decimal`、`date`、`json`。 |
| Field interface | NocoBase 页面里的展示和输入方式。 | 单行文本、数字、货币、日期时间、JSON。 |

常见映射思路如下：

| 数据库字段 | 常见 Field type | 常见 Field interface |
| --- | --- | --- |
| `varchar` / `char` | `string` | 单行文本、邮箱、手机号、URL、颜色、图标。 |
| `text` | `text` | 多行文本、Markdown、富文本、URL。 |
| `int` / `bigint` | `integer` / `bigInt` | 整数、排序、Unix 时间戳、下拉菜单、单选框。 |
| `decimal` / `numeric` / `float` / `double` | `decimal` / `float` / `double` | 数字、货币、百分比。 |
| `boolean` / `tinyint(1)` | `boolean` | 勾选、开关。 |
| `date` / `datetime` / `timestamp` / `time` | `date` / `dateOnly` / `time` | 日期时间、日期、时间、创建时间、更新时间。 |
| `json` / `jsonb` | `json` | JSON。 |
| `enum` / `set` | `enum` / `set` | 下拉菜单、单选框、多选框。 |

如果遇到 NocoBase 暂时无法识别的数据库字段类型，这些字段会单独展示出来。

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

遇到不支持的字段类型时，可以按这些方式处理：

- 在数据库侧改成 NocoBase 可识别的字段类型
- 使用数据库 view 转换字段类型后再接入
- 通过插件扩展字段类型和 Field interface 适配
- 暂时不在页面区块中使用该字段

## Record unique key

页面区块需要知道用哪个字段定位一条记录。这个字段就是 Record unique key，也叫筛选目标键。

通常来说，NocoBase 会优先使用数据表主键。如果外部表没有主键、使用联合主键，或者接入的是数据库 view，就需要手动选择一个具有唯一性的字段。

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

适合作为 Record unique key 的字段通常满足这些条件：

- 字段值唯一
- 字段值稳定，不会频繁变化
- 字段不为空
- 字段查询性能可接受

设置 Record unique key 后，数据表才更适合在页面中创建表格、详情、表单和操作。

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)

:::warning 注意

没有可用 Record unique key 的外部表，可能无法正确查看详情、编辑记录、删除记录或配置关系字段。接入外部数据库前，建议优先确认每张业务表是否有主键或稳定唯一字段。

:::

## 使用建议

| 场景 | 建议 |
| --- | --- |
| 只查看已有数据 | 使用只读数据库账号接入，降低误操作风险。 |
| 需要编辑已有数据 | 确认数据库账号具备写入权限，并检查主键或 Record unique key。 |
| 需要新增普通字段 | 先在数据库侧修改表结构，再回到 NocoBase 同步结构。 |
| 字段显示不符合业务含义 | 在 NocoBase 中调整 Field display name、Field interface 和标题字段。 |
| 数据库结构经常变化 | 建立结构变更流程，变更后及时同步数据源。 |
| 需要复杂查询或报表 | 可以在数据库侧维护 view，再把 view 作为外部数据库表使用。 |
| 需要完整建模能力 | 默认使用主数据库，更适合创建普通表、树表、文件表、日历表和 SQL 表。 |

## 相关链接

- [主数据库](../main/database.md) — 了解由 NocoBase 管理的数据表和字段
- [主、外部数据库对比](../main-vs-external-database.md) — 判断什么时候使用外部数据库
- [字段](../field/field.md) — 了解 Field type、Field interface 和 Record unique key
