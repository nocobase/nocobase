# 图表选项

配置图表的展示方式，支持两种模式：Basic（图形化）与 Custom（JS 自定义）。Basic 适合快速映射与常用属性；Custom 适合复杂场景与高级定制。


## 面板结构

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> Tips: 为了更方便地配置当前内容，可以先折叠收起其他面板。

最顶部是操作栏
模式选择
- Basic：图形化配置，选择类型并完成字段映射，常见属性开关直接调整。
- Custom：在编辑器中编写 JS，返回 ECharts `option`。

## Basic 模式

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### 选择图表类型
- 支持：折线图、面积图、柱状图、条形图、饼图、环形图、漏斗图、散点图 等。
- 不同图表类型要求的字段可能不同，先确认“数据查询 → 查看数据”的列名与类型。

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


> 更多图表选项配置可以参考 Echarts 文档 [坐标轴](https://echarts.apache.org/handbook/en/concepts/axis) 和 [示例](https://echarts.apache.org/examples/en/index.html)


**注意：**
- 维度或度量变更后重新确认映射，避免出现空图或错位。
- 饼/环形、漏斗必须提供“分类 + 值”组合。

### 常用属性

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- 堆叠、平滑（折线/面积）
- 标签显示、提示（tooltip）、图例（legend）
- 坐标轴标签旋转、分隔线
- 饼/环形的半径与内半径、漏斗排序方式


**建议：**
- 时间序列用折线/面积并适度开启平滑；大类对比用柱状/条形。
- 数据密集时不必开启全部标签，避免遮挡。

## Custom 模式

用于返回完整的 ECharts `option`，适合多系列合并、复杂提示、动态样式等高级定制。
推荐用法：把数据统一收敛在 `dataset.resource` 中，详细用法请参考 Echars 文档 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### 数据上下文
- `ctx.data.objects`：对象数组（每行记录，推荐）
- `ctx.data.rows`：二维数组（含表头）
- `ctx.data.columns`：按列分组的二维数组


### 示例：按月订单折线图
```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
```

### 预览与保存
- Custom 模式下修改完，可以点击右边的 预览 按钮更新图表预览。
- 在底部点击 “保存”使配置生效并保存；点击“取消”撤销本次所有配置修改。

![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!TIP]
> 关于图表选项的更多说明，请参见 高级用法 — 自定义图表配置。
