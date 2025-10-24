# 子表格

## 介绍

子表格适用于处理对多的关系字段，支持批量新建目标表数据后关联或从已有数据选择关联。

## 使用说明

![20240410151306](https://static-docs.nocobase.com/20240410151306.png)

子表格中不同类型的字段显示不同字段组件，大字段（富文本，Json,多行文本等字段）则通过悬浮弹窗编辑。

![20240410154316](https://static-docs.nocobase.com/20240410154316.png)

子表格中的关系字段。

订单 （一对多）> 商品（一对多） > 库存。

![20240410152232](https://static-docs.nocobase.com/20240410152232.png)

关系字段组件默认是下拉选择器（支持数据选择器/子表单（弹窗））。

![20240410152847](https://static-docs.nocobase.com/20240410152847.png)

支持拖拽排序。

![20240422215629](https://static-docs.nocobase.com/20240422215629.gif)

## 字段配置项

### 允许选择已有数据（默认不开启）

支持从已有数据选择关联。

![20240410160432](https://static-docs.nocobase.com/20240410160432.png)

![20240410160714](https://static-docs.nocobase.com/20240410160714.png)

### 字段组件

[字段组件](/handbook/ui/fields/association-field)：切换为其他关系字段组件，如下拉选择、数据选择器等；

### 联动规则
:::info{title=提示}
需要 NocoBase v1.3.17-beta 及以上版本。
:::

![20240906084911_rec_](https://static-docs.nocobase.com/20240906084911_rec_.gif)

更多内容参考 [联动规则](/handbook/ui/blocks/block-settings/field-linkage-rule)

### 允许解除已有数据关联

:::info{title=提示}
需要 NocoBase v1.3.34-beta 及以上版本。
:::

![20241021210710](https://static-docs.nocobase.com/20241021210710.png)

![20241021211909](https://static-docs.nocobase.com/20241021211909.png)
