---
pkg: "@nocobase/plugin-data-visualization"
---

# 概述

NocoBase 的数据可视化插件，提供了可视化的数据查询和丰富的图表组件。
用户可以通过简单的配置，快速建立可视化面板，展示数据洞察，并支持多维度数据分析与展示。

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## 基本概念
- 图表区块：页面中的一个可配置图表组件，支持数据查询、图表选项与交互事件。
- 数据查询（Builder / SQL）：通过 Builder 图形化配置，或编写 SQL 获取数据。
- 度量（Measures）与维度（Dimensions）：度量用于数值聚合，维度用于分组（如日期、品类、地区）。
- 字段映射：将查询结果列映射到图表核心字段，如 `xField`、`yField`、`seriesField` 或 `Category / Value`。
- 图表选项（Basic / Custom）：Basic 以图形化方式配置常用属性；Custom 通过 JS 返回完整 ECharts `option`。
- 运行查询：在配置面板运行查询请求数据，可切换 Table / JSON 查看返回数据。
- 预览与保存：预览为临时效果；点击“保存”后配置写入数据库并正式生效。
- 上下文变量：复用页面、用户、筛选器等上下文信息（如 `{{ ctx.user.id }}`）用于查询与图表配置。
- 页面筛选器与联动：页面级“筛选器块”统一输入条件，自动合并到图表查询并联动刷新。
- 交互事件：通过 `chart.on` 注册事件，实现高亮、跳转、下钻等行为。

## 安装
数据可视化是 NocoBase 的内置插件，开箱即用，无需单独安装。
