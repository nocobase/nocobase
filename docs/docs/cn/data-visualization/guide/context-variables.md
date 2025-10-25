# 使用上下文环境变量

通过上下文环境变量，你可以在“数据查询”（Builder/SQL）、页面筛选器、图表事件等位置复用当前页面/用户/时间等信息，做到按上下文渲染图表与联动。

![截图占位：变量选择器与表达式示例](https://static-docs.nocobase.com/20251023232724.png)

## 适用范围
- Builder 模式的过滤条件、排序、分页等参数。
- SQL 模式的语句编写，通过 `{{ ... }}` 引用上下文变量。
- 页面筛选器（Filter Block）中的“变量输入”和“表达式”。
- 图表事件（例如点击后使用变量驱动联动）。

## 内置变量（常用）
- 当前用户与角色
  - `$user`：当前用户，例如 `{{ $user.id }}`、`{{ $user.nickname }}`。
  - `$nRole`：当前角色（或角色集合）。
  - `$nToken`：当前 API 令牌字符串（适合拼接外部 API 请求）。
- 日期与时间
  - `$nDate`：日期范围变量，返回 `[start, end]`，用于“介于/范围”类条件。
    - 常用项：`today`、`yesterday`、`tomorrow`、`thisWeek`、`lastWeek`、`thisMonth`、`lastMonth`、`thisQuarter`、`lastQuarter`、`thisYear`、`lastYear`、`last7Days`、`last30Days`、`last90Days`、`next7Days`、`next30Days`、`next90Days`、`lastIsoWeek`、`nextIsoWeek`、`now` 等。
  - `$nExactDate`：精确日期/时间变量（点值），适合赋值或精确比较。
    - 常用项：`nowLocal`、`nowUtc`、`todayDate`、`todayLocal`、`todayUtc`、`yesterdayDate`、`yesterdayLocal`、`yesterdayUtc`、`tomorrowDate`、`tomorrowLocal`、`tomorrowUtc`。
- 页面与环境
  - `$nURLSearchParams`：URL 查询参数，例：`{{ $nURLSearchParams.status }}`。
  - `$env`：全局环境变量（如通过应用配置暴露的键值）。
  - `$system.now`：系统当前时间函数。
- 表单/记录上下文（在详情页/弹窗/关联场景下）
  - `$nForm`：当前表单上下文。
  - `$nRecord`：当前记录上下文。
  - `$nParentRecord`：父记录上下文（嵌套区块）。
  - `$nPopupRecord` / `$nParentPopupRecord`：弹窗/父弹窗上下文。
  - `$iteration` / `$nParentIteration`：迭代渲染时的当前/父对象。
- 页面筛选器
  - `$nFilter.<name>`：页面筛选器中“自定义项”的当前值（用于跨图表高级联动）。

提示：
- 旧版 `$date` 已废弃，统一使用 `$nDate`。
- 变量的子项列表随控件与上下文不同，会在“变量选择器”中自动给出可选项，建议从选择器中选择，减少拼写与类型错误。

## 在 Builder 模式中使用变量
- 在“数据查询 → 过滤”中，选择字段与运算符，右侧输入支持“变量选择器”和“表达式”。
- 示例：筛选“创建人=当前用户”
  - 字段选择 `createdBy`，运算符选择“等于”，值选择变量 `$user.id`。
- 示例：筛选“创建日期在最近 7 天”
  - 字段选择 `createdAt`，运算符选择“日期介于”，值选择变量 `$nDate.last7Days`（返回 `[start, end]`）。
- 示例：从 URL 读取筛选
  - 字段选择 `status`，运算符选择“等于”，值选择变量 `$nURLSearchParams.status`。

![截图占位：Builder 过滤条件中选择变量](https://static-docs.nocobase.com/20251023232724.png)

注意：
- 对于“多对一（m2o）”等关联字段，系统会按目标键（如 `id`）自动处理。
- 使用日期范围变量时，UI 会匹配对应的“范围”运算符并传入 `[start, end]`，无需手动拆分。

## 在 SQL 模式中使用变量
- 在 SQL 文本中使用 `{{ ... }}` 引用变量，无需加引号，系统会安全绑定为参数，防止 SQL 注入。
- 数组或范围的下标访问使用点号索引（支持数字路径）：`.0`、`.1`
  - 例如：`{{ $nDate.last7Days.0 }}` 表示范围起始，`{{ $nDate.last7Days.1 }}` 表示范围结束。

示例：按当前用户与最近 7 天统计订单
```sql
SELECT DATE(created_at) AS day, COUNT(*) AS orders
FROM orders
WHERE author_id = {{ $user.id }}
  AND created_at BETWEEN {{ $nDate.last7Days.0 }} AND {{ $nDate.last7Days.1 }}
GROUP BY day
ORDER BY day ASC
LIMIT 100;
```

示例：使用 URL 查询参数与精确时间点
```sql
SELECT *
FROM logs
WHERE level = {{ $nURLSearchParams.level }}
  AND created_at >= {{ $nExactDate.nowUtc }}
ORDER BY created_at DESC
LIMIT {{ $nURLSearchParams.limit }};
```

注意：
- 不要对 `{{ ... }}` 加单/双引号；绑定时系统会根据变量类型（字符串、数字、时间、NULL）安全处理。
- 变量为 `NULL` 或未定义时，请在 SQL 中使用 `COALESCE(...)` 或 `IS NULL` 显式处理空值逻辑。
- `UTC` 与本地时间的选择：根据场景使用 `$nExactDate.nowUtc` 或 `nowLocal`，避免时区导致的边界误差。

## 与页面筛选器协同
- 通过 `$nFilter.<name>` 可以在 SQL/Builder 中读取页面筛选器的“自定义项”值，实现更灵活的跨图表联动。
- 示例：`WHERE status = {{ $nFilter.status }} AND region = {{ $nFilter.region }}`。

## 调试与最佳实践
- 在“数据查询 → 查看数据”面板切换 Table/JSON，先确认列名与类型，再进行图表映射或编写 JS。
- 调试模式：地址栏追加 `?_debug=true` 或运行 `localStorage.setItem('nocobase.debug', '1')`，便于定位问题。
- 统一字段命名与类型，减少变量解析和映射错误；范围类变量统一通过 `$nDate` 使用。