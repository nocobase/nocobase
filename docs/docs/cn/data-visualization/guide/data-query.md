# 数据查询

图表的配置面板整体上划分为三个部分：数据查询、图表属性和交互事件，以及最底下的取消、预览、保存按钮。

我们先来看一下“数据查询”面板，了解两种查询模式（Builder/SQL）及常用功能。

![截图占位：数据查询面板概览（Builder/SQL 切换、数据源/集合、运行查询）](https://static-docs.nocobase.com/20251023232724.png)


## 面板结构
从上到下依次为：
- 模式：Builder（图形化 简单方便）/ SQL（手写语句 更灵活）。
- 运行查询：点击执行查询数据请求。
- 查看结果：打开数据结果面板，可切换 Table/JSON 查看。再次点击收起面板。

- 数据源与集合：必填，选择数据来源与数据表。
- 度量（Measures）：必填，展示的数值字段。
- 维度（Dimensions）：按字段分组（日期/品类/地区等）。
- 过滤：设置过滤条件（=、≠、>、<、包含、范围等），多个条件可组合。
- 排序：选择字段与升/降序。
- 分页：控制数据范围与返回顺序。


## Builder 模式

### 选择数据源与集合
- 在“数据查询”面板选择模式为“Builder”。
- 选择数据源与集合（数据表）。集合不可选或为空时，优先检查权限与是否已创建。

![截图占位：选择 Builder 模式与数据源/集合](https://static-docs.nocobase.com/20251023232724.png)

### 配置度量（Measures）
- 选择一个或多个数值字段，设置聚合：`Sum`、`Count`、`Avg`、`Max`、`Min`。
- 常用场景：`Count` 统计记录数，`Sum` 统计总额。

![截图占位：度量选择与聚合方式](https://static-docs.nocobase.com/20251023232724.png)

### 配置维度（Dimensions）
- 选择一个或多个字段作为分组维度。
- 日期时间字段可设置格式（如 `YYYY-MM`、`YYYY-MM-DD`），便于按月/日分组。

![截图占位：维度选择与日期格式化](https://static-docs.nocobase.com/20251023232724.png)

### 过滤、排序与分页
- 过滤：添加条件（=、≠、包含、范围等），多个条件可组合。
- 排序：选择字段与升/降序。
- 分页：设置 `Limit` 与 `Offset` 控制返回行数，调试时建议先设置较小的 `Limit`。

![截图占位：过滤与排序分页配置](https://static-docs.nocobase.com/20251023232724.png)

### 运行查询与查看结果
- 点击“运行查询”执行，返回后在“查看数据”切换 `Table / JSON` 检查列与值。
- 映射图表字段前，先在这里确认列名与类型，避免后续图表为空或报错。

![截图占位：运行查询后的 Table/JSON 结果视图](https://static-docs.nocobase.com/20251023232724.png)

## SQL 模式

### 编写查询
- 切换到“SQL”模式，输入查询语句，点击“运行查询”。
- 示例（按日统计完成订单量）：
```sql
SELECT DATE(created_at) AS day, COUNT(*) AS num
FROM orders
WHERE status = 'completed'
GROUP BY day
ORDER BY day ASC
LIMIT 100;
```

![截图占位：SQL 编辑与运行查询](https://static-docs.nocobase.com/20251023232724.png)

### 结果与后续映射
运行后同样支持 Table/JSON 查看结果。

后续在配置“图表选项”中，基于结果列进行字段映射。
