# 变量解析请求统计（Table + Fork）

本示例用于还原并可视化一个常见场景：在表格（Table）中，每一行都会创建 fork，单元格字段模型里使用 `{{ctx.record.*}}`，从而在自动流参数解析阶段触发一次 `variables:resolve` 请求。行数、列数增加时，请求会呈倍增态势。

**本页示例仅展示优化效果，后续要移除**

- 页面顶部会实时统计并展示请求次数：总请求数、`variables:resolve`、`users:list` 等。
- 你可以修改示例中的数据量或列数，观察请求次数的变化。

> 说明：接口通过 `axios-mock-adapter` 在前端 mock，`variables:resolve` 会直接原样回显 `template`，主要用于统计和演示请求放大问题。

<code src="./parallel-basic.tsx"></code>

## 多列（多次 ctx.record 解析）

- 增加多列，同时在每一列的字段模型中引用不同的 `ctx.record.xxx`。
  你将看到 `variables:resolve` 的次数随列数和行数增加而上升。

<code src="./multi-columns-parallel.tsx"></code>

## 自定义列模型（按 ctx.record 动态着色）

- 自定义一个字段模型，根据 `ctx.record.id` 的奇偶决定文字颜色（偶数为绿色，奇数为红色）。
  你可以将逻辑替换为任意业务规则（例如按状态/级别着色）。

<code src="./color-column-parallel.tsx"></code>
