# Data Visualization

提供BI面板和数据可视化功能。

## 介绍

新版数据可视化插件以Collection为基础，提供了可视化的数据检索、图表配置面板，多个图表可以在同一区块内进行组织，支持以插件形式扩展和使用其他图表组件库。未来还计划支持SQL模式，单个及多个图表的时间、条件筛选，数据下钻，图表与数据区块联动等功能。

## 图表区块

<img src="https://s2.loli.net/2023/06/30/vTKZt9EXxS4Im5L.png"/>

- 图表区块可以组织多个图表，区块中的图表可以像区块一样排列和拖拽。
- 区块标题可以编辑。
- 图表以Collection为基础，新建图表时需要选定一个Collection.
- 有查看权限的Collection才可以用于配置图表，否则将会在选项中被隐藏。
- 图表可以修改 (Configure), 复制 (Duplicate), 设置标题 (Edit block title).

## 配置面板

<img src="https://s2.loli.net/2023/06/30/75GMbhCcypHitkE.png"/>

配置面板整体上分为三个区块：数据配置，图表配置，图表预览。

### 数据配置

<img src="https://s2.loli.net/2023/06/30/34fnM7i6SIPJgFm.png" width="500" />

- 顶部下拉框代表当前正在配置的Collection，通过下拉菜单可以切换。
- 配置完成后，点击"Run query"可以通过配置获取数据，"Data"面板会展示数据。

#### 度量

<img src="https://s2.loli.net/2023/06/30/xZwW6UR1klB4dCs.png" width="500" />

度量字段，通常是图表需要展示的核心数据。度量数据可以通过聚合函数进行统计，支持常用的数据库统计函数`Sum`, `Count`, `Avg`, `Max`, `Min`. 度量字段可以有多个，可以设置别名。

#### 维度

<img src="https://s2.loli.net/2023/06/30/2eAHvGojmlL1YtQ.png" width="500" />

维度字段，通常是图表数据分组的依据。对于日期类型字段，支持如图所示的格式化方式，格式化通过数据库函数实现（例如：MySQL对应`date_format`），其他类型数据格式化见[数据转换](数据转换)部分。

> **维度格式化 (Dimensions Format) VS 数据转换 (Transform)**  
> - 维度格式化发生在获取最终数据之前，数据分组按照维度格式化后的值进行，通常在按时间段筛选数据时有此需求。  
> - 数据转换对响应数据做进一步处理，诸如可读性处理，以展现恰当的数据，数据转换在前端进行。

#### 筛选

<img src="https://s2.loli.net/2023/06/30/kvbHO5Y1fsiMm3E.png" width="500" />

此处配置将对分组前的数据进行过滤。

#### 排序 (Sort) 和限制 (Limit)

<img src="https://s2.loli.net/2023/06/30/HCpiQ4qATcLeKUE.png" width="500" />

目前图表允许的数据集条数上限为2000.

#### 缓存

<img src="https://s2.loli.net/2023/06/30/OY6JephtbcH4run.png" width="300" />

开启缓存后，图表将展示缓存的数据。

### 图表配置

<img src="https://s2.loli.net/2023/06/30/KHaPvYsBxh7plGQ.png" width="500" />

- 图表类型 (Chart Type) - 用于展示的图表类型，目前按图表库分组。如何使用其他图表库？
- 基础配置 - 选择图表后，会出现相应的基础可视化配置，字段配置通常提供了下拉菜单供选择，选项中包含了Collection的基础字段和字段别名。
- JSON配置 - 当基础配置不满足要求时，可以使用JSON配置其他图表属性。

### 数据转换

<img src="https://s2.loli.net/2023/06/30/yf82mYs6V1aCRIj.png" width="500" />

使用数据转换可以对接口响应的数据做进一步处理，目前支持转换处理的数据类型为 `number`, `date`, `time`, `datetime`, 对于不属于支持的数据类型的字段，可以手动选择为这几个类型，以使用对应的转换方法。

## 使用其他图表库

```TypeScript
import { ChartLibraryProvider } from '@nocobase/plugin-charts-v2/client';
```

图表插件提供了ChartLibraryProvider组件，组件接收以下属性:
- name 图表库名字
- charts 图表组件列表，参考`packages/plugins/charts-v2/src/client/renderer/library/G2PlotLibrary.tsx`