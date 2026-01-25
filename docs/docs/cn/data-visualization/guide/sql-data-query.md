# SQL 模式查询数据

在“数据查询”面板切换到 SQL 模式，编写并运行查询语句，直接使用返回结果进行图表映射与渲染。

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## 编写SQL语句
- 在“数据查询”面板选择“SQL”模式。
- 输入 SQL，点击“运行查询”执行。
- 支持复杂的多表JOIN、VIEW 等完整sql语句

示例：按月统计订单金额
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## 查看结果
- 点击 “查看数据” 打开数据结果预览面板。

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

数据支持分页展示，也可以切换 Table/JSON 检查列名与类型
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## 字段映射
- 在 图表选项 配置中基于查询数据结果列完成映射。
- 默认自动会把第一列作为维度（x轴 或 分类），第二列作为度量（y轴 或 值）。所以请注意SQL中的字段顺序：

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- 维度字段 放在第一列
  SUM(total_amount) AS total -- 度量字段 放在后面
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## 使用上下文变量
点击 SQL 编辑器右上角的 x 按钮，可以选择使用上下文变量。

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

选择确认后，会在SQL文本光标位置（或选中内容位置）插入变量的表达式。

例如 `{{ ctx.user.createdAt }}`，注意不要自己另外加引号。

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## 更多示例
更多使用示例，可以参考 Nocobase [Demo应用](https://demo3.sg.nocobase.com/admin/5xrop8s0bui)

**建议：**
- 列名稳定后再进行图表映射，避免后续报错。
- 调试阶段设置 `LIMIT` 减少返回行数，加快预览。


## 预览、保存与回滚
- 点击“运行查询”会执行请求数据，并刷新图表预览。
- 点击“保存”会将当前 SQL 文本等配置保存到数据库。
- 点击“取消”回到上次保存状态，丢弃当前未保存变更。