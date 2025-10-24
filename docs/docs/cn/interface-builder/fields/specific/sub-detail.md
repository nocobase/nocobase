# 子详情

## 介绍

子详情是子表单在阅读模式下的对应组件，与标签和标题组件相比，子详情不仅可以展示更多本表数据，还可以配置展示关系表数据信息，多层级的关系数据以嵌套详情的形式清晰展示。

## 使用说明

### 对多的关系字段子详情

![20240822225058](https://static-docs.nocobase.com/20240822225058.png)

支持多层关系字段的嵌套显示，示例：订单/商品/库存，订单/商品/供应商。

![20240822225231](https://static-docs.nocobase.com/20240822225231.png)

### 对一的关系字段子详情

![20240822230215](https://static-docs.nocobase.com/20240822230215.png)

## 字段配置项

### 设定排序规则

支持为对多的关系数据调整数据展示顺序。

![20240822230359](https://static-docs.nocobase.com/20240822230359.png)

![20240822230422](https://static-docs.nocobase.com/20240822230422.png)

### 字段组件

[字段组件](/handbook/ui/fields/association-field)：切换为其他关系字段组件，如下拉选择、数据选择器等；

### 联动规则
:::info{title=提示}
需要 NocoBase v1.3.17-beta 及以上版本。
:::

![20240906090603_rec_](https://static-docs.nocobase.com/20240906090603_rec_.gif)

更多内容参考 [联动规则](/handbook/ui/blocks/block-settings/field-linkage-rule)
