# 子表格(行内编辑)

## 介绍

子表格适用于处理对多的关系字段，支持批量新建目标表数据后关联或从已有数据选择关联。

## 使用说明

![20251027223350](https://static-docs.nocobase.com/20251027223350.png)

子表格中不同类型的字段显示不同字段组件，大字段（富文本，Json,多行文本等字段）则通过悬浮弹窗编辑。

![20251027223426](https://static-docs.nocobase.com/20251027223426.png)

子表格中的关系字段。

订单 （一对多）> Order Products（一对一） > Opportunity

![20251027223530](https://static-docs.nocobase.com/20251027223530.png)

关系字段组件默认是下拉选择器（支持下拉选择器/数据选择器）。

![20251027223754](https://static-docs.nocobase.com/20251027223754.png)

## 字段配置项

### 允许选择已有数据（默认开启）

支持从已有数据选择关联。
![20251027224008](https://static-docs.nocobase.com/20251027224008.png)

![20251027224023](https://static-docs.nocobase.com/20251027224023.gif)

### 字段组件

[字段组件](/interface-builder/fields/association-field)：切换为其他关系字段组件，如下拉选择、数据选择器等；

### 允许解除已有数据关联

> 编辑表单中的关系字段数据是否允许解除已有数据的关联

![20251028153425](https://static-docs.nocobase.com/20251028153425.gif)
