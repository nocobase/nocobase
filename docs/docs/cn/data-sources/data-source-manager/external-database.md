# 外部数据库

## 介绍

使用外部已有的数据库作为数据源，目前已支持的外部数据库有 MySQL、MariaDB、PostgreSQL。

## 使用说明

### 添加外部数据库

激活插件之后，才可以在数据源管理的 Add new 下拉菜单中选择并添加。

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

填写需要接入的数据库信息

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### 数据表同步

外部数据库建立连接之后，会直接读取数据源里的所有数据表。外部数据库不支持直接添加数据表或修改表结构，如果需要修改，可以通过数据库客户端进行操作，再在界面上点击「刷新」按钮来同步。

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### 配置字段

外部数据库会自动读取已有数据表的字段，并展示出来。可以快速查看并配置字段的标题、数据类型（Field type）和 UI 类型（Field interface），也可以点击「编辑」按钮，修改更多配置。

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

因为外部数据库不支持修改表结构，所以新增字段时，可选的类型只有关系字段。关系字段并不是真实的字段，而是用于建立表和表之间的连接。

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

更多内容 [数据表字段/概述](/handbook/data-modeling/collection-fields) 章节。

### 字段类型映射

NocoBase 会自动为外部数据库的字段类型，映射相对应的数据类型（Field type）和 UI 类型（Field Interface）。

- 数据类型（Field type）：用于定义字段可以存储的数据的种类、格式和结构；
- UI 类型（Field interface）：是指在用户界面中用于显示和输入字段值的控件类型。

| PostgreSQL | MySQL/MariaDB | NocoBase Data Type | NocoBase Interface Type |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCEL |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### 不支持的字段类型

不支持的字段类型会单独展示出来，这些字段需要开发适配之后才能使用。

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### 筛选目标键

作为区块展示的数据表必须配置了筛选目标键（Filter target key），筛选目标键指的是根据特定字段筛选数据，字段值必须具备唯一性。筛选目标键默认为数据表主键字段，如果是视图或者无主键数据表、联合主键的数据表，需要自定义筛选目标键。

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

设置了筛选目标键的数据表才可以在页面里添加

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)
