# SQL 模式查询数据

在“数据查询”面板切换到 SQL 模式，编写并运行查询语句，直接使用返回结果进行图表映射与渲染。

![截图占位：SQL 编辑器与运行查询](https://static-docs.nocobase.com/20251023232724.png)

## 切换模式与编写语句
- 在“数据查询”面板选择“SQL”模式。
- 输入 SQL，点击“运行查询”执行。

示例：按日统计订单量
```sql
SELECT DATE(created_at) AS day, COUNT(*) AS orders
FROM orders
WHERE status = 'completed'
GROUP BY day
ORDER BY day DESC
LIMIT 100;
```

示例：按状态分类统计
```sql
SELECT status, COUNT(*) AS total
FROM orders
GROUP BY status
ORDER BY total DESC;
```

![截图占位：运行结果（Table/JSON）](https://static-docs.nocobase.com/20251023232724.png)

## 查看结果与映射
- 在“查看数据”切换 Table/JSON 检查列名与类型。
- 在“图表选项（Basic/Custom）”中基于结果列完成映射或编写 JS。

建议：
- 列名稳定后再进行图表映射，避免后续报错。
- 调试阶段设置 `LIMIT` 减少返回行数，加快预览。

![截图占位：基于结果列进行图表映射](https://static-docs.nocobase.com/20251023232724.png)

## 保存与回滚
- 点击“保存/确定”持久化 SQL 文本与结果映射。
- 点击“取消”回到上次保存状态，丢弃当前未保存变更。