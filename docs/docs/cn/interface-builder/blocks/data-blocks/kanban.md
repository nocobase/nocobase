---
pkg: "@nocobase/plugin-kanban"
title: "看板区块"
description: "看板区块：按分组列展示数据记录，支持样式切换、快捷新增、弹窗配置、拖拽排序与卡片点击打开。"
keywords: "看板区块,Kanban,数据分组,拖拽排序,快捷新增,弹窗设置,卡片布局,界面搭建,NocoBase"
---

# 看板

## 介绍

看板区块按分组列展示数据记录，适合任务状态流转、销售阶段跟进、工单处理等需要按阶段查看与推进数据的场景。

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_51_PM.png)

## 添加区块

![](https://static-docs.nocobase.com/Kanban-04-29-2026_09_54_PM.png)

![](https://static-docs.nocobase.com/Kanban-04-29-2026_09_54_PM%20(1).png)

选择 "看板" 区块并指定数据表后，在弹窗中完成分组配置：

1. 选择 "分组字段"，看板会按该字段的值生成列。
2. 选择 "分组值"，用于控制显示哪些列以及列的显示顺序。
3. 如需拖拽排序，开启 "启用拖拽排序"，并选择与当前分组字段匹配的 "拖拽排序字段"。

配置完成后，即可创建看板区块。

## 区块配置项

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM.png)

### 分组设置

看板区块必须先指定分组字段，系统会按字段值将记录分配到不同列中。

- 分组字段支持单选字段、多对一字段。
- 单选字段的列标题和列颜色会直接复用字段选项中配置的标签与颜色。
- 多对一字段的分组选项会从关联表记录中加载。
- 当分组字段为多对一字段时，可以额外配置：
	- 标题字段：决定列头显示哪一个关联字段值。
	- 颜色字段：决定列头和列容器背景色。
- 通过“选择分组值”可以控制哪些列会显示，以及列的显示顺序。
- 分组值为空的记录会显示在“未知”列中。

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM%20(1).png)
![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM.png)

### 样式

看板支持两种列样式：

- `Classic`：保留更轻量的默认列背景。
- `Filled`：使用列颜色渲染列头和列容器背景，适合状态色更明确的场景。

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM%20(1).png)

### 拖拽设置

启用拖拽后，可以直接拖动卡片调整顺序。

- 启用“启用拖拽排序”后，可以进一步选择“拖拽排序字段”。
- 拖拽排序依赖排序字段，排序字段需要与当前分组字段匹配。
- 将卡片拖动到其他列时，会同时更新记录的分组字段值和排序位置。

更多内容参考 [排序字段](/data-sources/field-sort)

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_55_PM.png)

### 快捷新增

启用“快捷新增”后，每一列标题右侧都会显示一个加号按钮。

- 点击列头加号，会以当前列作为上下文打开新增弹窗。
- 新增表单会自动带入当前列对应的分组值。
- 如果当前列是“未知”列，则会把该分组字段预填为空值。

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_57_PM.png)

### 弹窗设置

区块级“弹窗设置”用于控制列头快捷新增按钮打开的弹窗行为。

- 可配置打开方式，例如抽屉、对话框或页面。
- 可配置弹窗尺寸。
- 可绑定弹窗模板或后续继续在弹窗中添加区块内容。

### 每列分页数量

用于控制每一列首次加载的记录数量。列内记录较多时，可继续滚动加载。

### 列宽

用于设置每一列的宽度，便于根据卡片内容密度调整展示效果。

### 设置数据范围

用于限制看板区块中显示的数据范围。

例如：只显示当前负责人创建的任务，或只显示某个项目下的记录。

更多内容参考 [设置数据范围](/interface-builder/blocks/block-settings/data-scope)


## 配置字段

看板卡片内部使用详情式字段布局来展示记录摘要信息。

### 添加字段

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM.png)

字段配置项可参考 [详情字段](/interface-builder/fields/generic/detail-form-item)

### 卡片设置

卡片本身支持以下设置：

- 启用点击打开：开启后，点击卡片可打开当前记录。
- 弹窗设置：可单独配置卡片点击后的打开方式、尺寸和弹窗模板。
- 布局：可调整卡片内字段的展示布局。

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_56_PM.png)

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM%20(2).png)

## 配置操作

看板区块支持在顶部配置全局操作，具体可见的操作类型会随当前环境中已启用的动作能力而变化。

![](https://static-docs.nocobase.com/Kanban-04-22-2026_10_02_PM.png)

### 全局操作

- [新增](/interface-builder/actions/types/add-new)
- [弹窗](/interface-builder/actions/types/pop-up)
- [链接](/interface-builder/actions/types/link)
- [刷新](/interface-builder/actions/types/refresh)
- [自定义请求](/interface-builder/actions/types/custom-request)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI 员工](/interface-builder/actions/types/ai-employee)
