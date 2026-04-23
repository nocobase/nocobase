---
pkg: "@nocobase/plugin-calendar"
title: "日历区块"
description: "日历区块以日历视图展示事件与日期数据，适用于会议安排、活动计划等场景，支持配置标题字段、起止时间、农历显示及数据范围等。"
keywords: "日历区块, 日历视图, 事件管理, 会议安排, Calendar, NocoBase"
---

# 日历区块

## 介绍

日历区块以直观的日历视图展示事件及日期相关数据，适用于会议安排、活动计划等典型场景。

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_27_PM.png)

## 安装

该区块为内置插件，无需额外安装。

## 添加区块

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_39_PM.png)

选择 "日历" 区块，并指定对应的数据表，即可完成创建。

## 区块配置项

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_38_AM.png)

### 标题字段

用于展示在日历事件条上的标题信息。

当前支持的字段类型包括：`input`、`select`、`phone`、`email`、`radioGroup`、`sequence` 等，也支持通过插件扩展更多类型。

### 开始日期字段

用于指定事件的开始时间。

### 结束日期字段

用于指定事件的结束时间。

### 快速创建事件

点击日历中的空白日期区域，可快速弹出浮层创建事件。

![](https://static-docs.nocobase.com/Add-new-04-23-2026_10_39_AM.png)

点击已有事件时：
- 当前事件会高亮显示
- 同时弹出详情窗口，便于查看或编辑

### 显示农历

开启后，日历中将显示对应的农历信息。

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM.png)

### 数据范围

用于限制日历区块中展示的数据范围。

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM.png)

更多说明请参考：[设置数据范围](/interface-builder/blocks/block-settings/data-scope)

### 区块高度

可自定义日历区块高度，避免内部出现滚动条，提升整体布局体验。

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM%20(1).png)

更多说明请参考：[区块高度](/interface-builder/blocks/block-settings/block-height)

### 颜色字段

用于配置日历事件的背景颜色，提升视觉区分度。

使用步骤：

1. 在数据表中新增一个 **下拉单选（Single select）** 或 **单选框（Radio group）** 字段，并为选项配置颜色；
2. 在日历区块配置中，将该字段设置为「颜色字段」；
3. 在创建或编辑事件时选择颜色，即可在日历中生效。

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM%20(1).png)

### 周起始日

支持设置每周的起始日，可选择：
- 周日
- 周一（默认）

可根据不同地区的使用习惯进行调整，使日历展示更符合实际需求。


## 配置操作

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_32_PM.png)

### 今天

点击 "今天" 按钮，可快速跳转回当前日期所在的日历视图。

### 切换页面

根据当前视图模式进行时间切换：
- 月视图：上一月 / 下一月
- 周视图：上一周 / 下一周
- 日视图：昨天 / 明天

### 选择视图

支持在以下视图间切换：
- 月视图（默认）
- 周视图
- 日视图

### 标题

用于显示当前视图对应的日期。