---
title: "几何图形字段"
description: "了解 NocoBase 几何图形字段的适用场景，包括点、线、面和圆。"
keywords: "几何图形字段,空间字段,点,线,面,圆,NocoBase"
---

# 几何图形字段

## 适用场景

几何图形字段适合保存空间或地理信息。创建前先确认数据是否需要地图展示、空间筛选、路线绘制，还是只需要保存一段坐标 JSON。

| 你要保存 | 建议字段 | 适合场景 |
| --- | --- | --- |
| 点 | 点 | 门店位置、用户位置、设备定位。 |
| 线 | 线 | 配送路线、巡检路线、管线轨迹。 |
| 面 | 面 | 配送范围、地理围栏、行政区域。 |
| 圆 | 圆 | 覆盖范围、影响范围、服务半径。 |

## 字段来源

参考下面的来源路径，了解字段在 NocoBase 中的创建和管理方式：

- **[主数据库配置字段](../main/database.md#配置字段)**
- **[主数据库同步字段](../main/database.md#从数据库同步)**
- **[主数据库创建 SQL 数据表映射字段](../main/collection-sql.md)**
- **[主数据库连接数据库视图映射字段](../main/collection-view.md)**
- **[外部数据库同步字段](../external/database.md#从数据库同步)**
- **[REST API 数据源映射字段](../external/rest-api.md#字段映射)**

## 从 NocoBase 创建

通过**[主数据库配置字段](../main/database.md#新增字段)**在页面新增几何图形字段。创建时重点确认 Field interface、坐标数据格式、是否需要空间数据库能力，以及页面中如何展示和编辑。

![add_field](https://static-docs.nocobase.com/add_field.png)
![add_field_configure](https://static-docs.nocobase.com/add_field_configure.png)

### 字段配置

| 配置 | 说明 |
| --- | --- |
| Field interface | 几何图形字段的界面类型。可以选择「点」「线」「面」「圆」等。它决定页面中按位置、路线、区域还是范围来录入和展示。 |
| Field display name | 字段在界面中显示的名称。建议使用业务人员能直接理解的名称，比如「门店位置」「配送路线」「服务范围」。 |
| Field name | 字段标识名称，用于 API、权限、工作流等内部引用。创建后通常不再修改，只支持字母、数字和下划线，并且必须以字母开头。 |
| Field type | 字段在 NocoBase 数据层的类型。几何图形字段通常使用空间字段或 JSON 结构保存坐标。 |
| Coordinate format | 坐标格式。需要确认使用经纬度、GeoJSON，还是数据库原生 geometry / geography 类型。 |
| Required | 必填。适合门店位置、设备位置、服务区域等必须填写的字段。 |
| Description | 字段说明。适合写清楚坐标来源、坐标系、录入要求和地图展示方式。 |

### 字段类型映射

| Field interface | 默认 Field type | 默认数据库字段类型 | 默认长度 |
| --- | --- | --- | --- |
| 点 | `point` 或 `geometry` | `geometry(Point)` / `jsonb` |  |
| 线 | `lineString` 或 `geometry` | `geometry(LineString)` / `jsonb` |  |
| 面 | `polygon` 或 `geometry` | `geometry(Polygon)` / `jsonb` |  |
| 圆 | `circle` 或 `json` | `jsonb` |  |

这里的默认数据库字段类型以 PostgreSQL / PostGIS 或 JSON 保存方式为例。不同数据库最终生成的字段类型显示可能略有差异。

### 校验规则

几何图形字段常用校验规则包括必填、坐标格式和范围限制。空间数据一旦用于地图展示或空间筛选，就要确保坐标格式稳定。

| 校验规则 | 适合字段 | 说明 | 页面反馈 |
| --- | --- | --- | --- |
| Required | 点、线、面、圆。 | 提交记录时必须填写空间数据。适合门店位置、服务区域等核心字段。 | 字段为空时，提交表单会提示必填错误。 |
| Coordinate format | 点、线、面、圆。 | 限制坐标结构符合页面或数据库要求。适合从外部系统同步坐标的场景。 | 坐标结构不正确时，可能无法保存或无法在地图中展示。 |
| Range rule | 点、线、面、圆。 | 限制坐标在业务允许范围内。适合只允许选择某个城市、园区或服务区域内的位置。 | 坐标超出范围时，会提示范围错误。 |

### 页面使用效果

待截图

## 从数据源映射

外部数据库中的空间数据可能保存为 geometry / geography、GeoJSON、WKT 字符串或普通 JSON。NocoBase 同步字段后，需要先判断真实字段类型和坐标格式，再决定映射为几何图形字段还是 JSON 字段。

同步后，需要进入数据表的「Configure fields」检查几何字段是否识别正确。重点确认 Field interface、坐标格式、页面展示和是否需要地图能力支持。

编辑字段配置不会修改外部数据库里的真实字段名、字段类型、空间索引或坐标数据。如果需要调整这些结构，请先在数据库侧修改，再重新同步到 NocoBase。

### 字段配置

参考上文的「从 NocoBase 创建」章节，了解字段配置的各项参数。

### 字段类型映射

从数据源同步字段时，映射顺序通常是先读取数据库字段类型，再映射为 NocoBase 的 Field type，最后根据坐标结构选择 Field interface。

| 数据库字段类型 | 映射后的 Field type | 常用 Field interface | 说明 |
| --- | --- | --- | --- |
| `geometry(Point)` / `geography(Point)` | `geometry` 或 `point` | 点。 | 适合门店位置、设备定位、用户位置等单点坐标。 |
| `geometry(LineString)` | `geometry` 或 `lineString` | 线。 | 适合路线、轨迹、管线等线状数据。 |
| `geometry(Polygon)` | `geometry` 或 `polygon` | 面。 | 适合区域、围栏、配送范围等面状数据。 |
| `json` / `jsonb` | `json` | 点、线、面、圆、JSON。 | 适合以 GeoJSON 或自定义结构保存的空间数据。 |
| `varchar` / `text` | `string` 或 `text` | JSON、单行文本。 | 适合 WKT、坐标字符串等外部格式。需要确认页面是否能直接解析。 |

:::warning 注意

如果数据源没有可用的空间字段，或者只是从外部系统同步一段地理数据，也可以用 JSON 保存坐标、路径或范围数据。不过如果这些数据需要经常筛选、排序或在地图上展示，优先使用对应的几何图形字段。

:::

### 页面使用效果

待截图
