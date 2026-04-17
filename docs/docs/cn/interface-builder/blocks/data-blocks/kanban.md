---
pkg: "@nocobase/plugin-kanban"
title: "看板区块"
description: "看板区块：按分组列展示数据记录，支持拖拽排序、卡片点击打开、列宽与分组选项配置。"
keywords: "看板区块,Kanban,数据分组,拖拽排序,卡片布局,界面搭建,NocoBase"
---

# 看板

## 介绍

看板区块按分组列展示数据记录，适合任务状态流转、销售阶段跟进、工单处理等需要按阶段查看与推进数据的场景。

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_51_PM.png)

## 区块配置项

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_52_PM.png)

### 分组设置

看板区块必须先指定分组字段，系统会按字段值将记录分配到不同列中。

- 分组字段支持单选字段、多对一字段。
- 单选字段的分组选项通常来自字段本身的选项。
- 多对一字段的分组选项会从关联表记录中加载。
- 可以对分组选项调整显示名称、颜色、启用状态和显示顺序。
- 未匹配到已启用分组选项的记录会显示在“未知”列中。

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_53_PM.png)

### 拖拽设置

启用拖拽后，可以直接拖动卡片调整顺序。

- 拖拽排序依赖排序字段，未配置排序字段时不能启用拖拽。
- 排序字段需要与当前分组字段匹配。
- 可以直接选择已有排序字段，也可以在设置中创建新的排序字段。
- 将卡片拖动到其他列时，会同时更新记录的分组字段值和排序位置。

更多内容参考 [排序字段](/data-sources/field-sort)

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_53_PM%20(1).png)

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
- 打开方式：支持抽屉、对话框、页面。
- 布局：可调整卡片内字段的展示布局。

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM%20(1).png)
![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM%20(2).png)

## 配置操作

看板区块支持在顶部配置全局操作，具体可见的操作类型会随当前环境中已启用的动作能力而变化。

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_59_PM.png)

### 全局操作

- [新增](/interface-builder/actions/types/add-new)
- [弹窗](/interface-builder/actions/types/pop-up)
- [链接](/interface-builder/actions/types/link)
- [刷新](/interface-builder/actions/types/refresh)
- [自定义请求](/interface-builder/actions/types/custom-request)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI 员工](/interface-builder/actions/types/ai-employee)
