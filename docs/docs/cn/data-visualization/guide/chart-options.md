# 图表选项

配置图表的展示方式，支持两种模式：Basic（图形化）与 Custom（JS 自定义）。Basic 适合快速映射与常用属性；Custom 适合复杂场景与高级定制。

![截图占位：图表选项面板概览（模式切换、类型选择、字段映射、预览/保存）](https://static-docs.nocobase.com/20251023232724.png)

## 模式选择

- Basic：图形化配置，选择类型并完成字段映射，常见属性开关直接调整。
- Custom：在编辑器中编写 JS，基于 `ctx.data` 返回 ECharts `option`。

![截图占位：模式切换（Basic / Custom）](https://static-docs.nocobase.com/20251023232724.png)

## Basic 模式

### 选择图表类型
- 支持：折线、面积、柱状、条形、饼/环形、漏斗、散点。
- 类型切换后字段要求可能不同，先确认“数据查询 → 查看数据”的列名与类型。

![截图占位：类型选择](https://static-docs.nocobase.com/20251023232724.png)

### 字段映射
- 折线/面积/柱状/条形：
  - `xField`：维度（如日期、品类、地区）
  - `yField`：度量（聚合后的数值）
  - `seriesField`（可选）：系列分组（用于多条线/多组柱）
- 饼/环形：
  - `Category`：分类维度
  - `Value`：度量
- 漏斗：
  - `Category`：阶段/分类
  - `Value`：值（通常为数量或占比）
- 散点：
  - `xField`、`yField`：两个度量或维度，用于坐标轴

![截图占位：字段映射区域](https://static-docs.nocobase.com/20251023232724.png)

注意：
- 维度或度量变更后重新确认映射，避免出现空图或错位。
- 饼/环形、漏斗必须提供“分类 + 值”组合。

### 常用属性
- 堆叠、平滑（折线/面积）
- 标签显示、提示（tooltip）、图例（legend）
- 坐标轴标签旋转、分隔线
- 饼/环形的半径与内半径、漏斗排序方式

![截图占位：属性调整（标签/提示/堆叠/坐标轴等）](https://static-docs.nocobase.com/20251023232724.png)

建议：
- 时间序列用折线/面积并适度开启平滑；大类对比用柱状/条形。
- 数据密集时不必开启全部标签，避免遮挡。

### 预览与保存
- 点击“预览”更新图表以验证配置。
- 点击“保存/确定”使配置生效并持久化；“取消”回滚未保存的更改。

![截图占位：预览与保存](https://static-docs.nocobase.com/20251023232724.png)

## Custom 模式（JS）

用于返回完整的 ECharts `option`，适合多系列合并、复杂提示、动态样式等高级定制。

### 数据上下文
- `ctx.data.objects`：对象数组（每行记录）
- `ctx.data.rows`：二维数组（含表头）
- `ctx.data.columns`：按列分组的二维数组

![截图占位：Custom 编辑器与补全（ctx.data.*）](https://static-docs.nocobase.com/20251023232724.png)

### 示例：按月订单量折线图
```js
const rows = ctx.data.rows;
// rows[0] 为表头，例如 ['month', 'orders_count']
const header = rows[0];
const monthIdx = header.indexOf('month');
const countIdx = header.indexOf('orders_count');

const months = rows.slice(1).map(r => r[monthIdx]);
const counts = rows.slice(1).map(r => r[countIdx]);

return {
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: months },
  yAxis: { type: 'value' },
  series: [
    { type: 'line', name: '订单量', data: counts, smooth: true }
  ],
  legend: { show: true }
};
```

注意：
- 保持纯函数风格：仅根据 `ctx.data` 生成 `option`。
- 查询列名调整会影响索引；统一列命名并先在“运行查询 → 查看数据”确认。
