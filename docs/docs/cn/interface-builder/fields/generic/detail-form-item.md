# 详情字段

## 介绍

详情区块、列表区块、网格区块等字段配置基本一致，主要控制阅读状态下字段的展示。

![20251025172851](https://static-docs.nocobase.com/20251025172851.png)

## 字段配置项

### 日期字段格式化

![20251025173005](https://static-docs.nocobase.com/20251025173005.png)

更多内容参考 [日期格式化](/interface-builder/fields/specific/date-picker)

### 数值字段格式化

![20251025173242](https://static-docs.nocobase.com/20251025173242.png)

支持简单的单位换算，千分位分隔符，前后缀，精确度，科学记数法。

更多内容参考 [数值格式化](/interface-builder/fields/field-settings/number-format)

### 启用点击打开

除了关系字段支持点击打开弹窗，普通字段也可以开启点击打开以作为打开弹窗的入口，还可以设置弹窗打开方式（抽屉、对话框、子页面）。

![20251025173549](https://static-docs.nocobase.com/20251025173549.gif)

### 内容溢出显示方式

当字段项内容溢出宽度时可以设置溢出方式

- 省略显示（默认）
- 换行

![20251025173917](https://static-docs.nocobase.com/20251025173917.png)

### 字段组件

部分字段支持多种展示形态可通过切换字段组件实现。

例如：`URL` 组件可以切换为 `Preview` 组件。

![20251025174042](https://static-docs.nocobase.com/20251025174042.png)

例如：关系字段可以切换不同的展示,由标题字段组件切换为`子详情`以展示更多关系字段内容。

![20251025174311](https://static-docs.nocobase.com/20251025174311.gif)

- [编辑字段标题](/interface-builder/fields/field-settings/edit-title)
- [编辑字段描述](/interface-builder/fields/field-settings/edit-description)
- [编辑字段提示信息](/interface-builder/fields/field-settings/edit-tooltip)
