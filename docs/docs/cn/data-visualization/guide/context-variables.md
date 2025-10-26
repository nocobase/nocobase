# 使用上下文环境变量

通过上下文环境变量，你可以在直接复用当前页面/用户/时间/筛选条件等信息，做到按上下文渲染图表与联动。

## 适用范围
- 数据查询 Builder 模式的过滤条件，选择变量使用。
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- 数据查询 SQL 模式的语句编写，选择变量，插入表达式（例如 `{{ ctx.user.id }}`）。
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- 图表选项 Custom 模式直接写 JS 表达式。
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- 交互事件（例如点击下钻打开弹窗传递数据），直接写 JS 表达式。
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**注意：**
- 不要对 `{{ ... }}` 加单/双引号；绑定时系统会根据变量类型（字符串、数字、时间、NULL）安全处理。
- 变量为 `NULL` 或未定义时，请在 SQL 中使用 `COALESCE(...)` 或 `IS NULL` 显式处理空值逻辑。