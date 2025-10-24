# 子表单

## 介绍

子表单适用于先新建关系数据后关联数据的场景，多层级的关系数据以嵌套表单的形式清晰展示，与数据选择器和下拉选择器相比，子表单在当前页面区块上直接维护关系表字段，且关系数据随主表一起提交。

## 使用说明

### 对多的关系字段子表单

![20240409213911](https://static-docs.nocobase.com/20240409213911.png)

支持多层关系字段的嵌套显示，商品/库存。

![20240422172545](https://static-docs.nocobase.com/20240422172545.png)


### 对一关系字段子表单

![20240409214419](https://static-docs.nocobase.com/20240409214419.png)

## 字段配置项
### 允许添加/关联多条(默认开启)

开启时通过点击 + 号添加多条记录。

![20240422172237](https://static-docs.nocobase.com/20240422172237.png)


### 字段组件

[字段组件](/handbook/ui/fields/association-field)：切换为其他关系字段组件，如下拉选择、数据选择器等；

### 联动规则
:::info{title=提示}
需要 NocoBase v1.3.17-beta 及以上版本。
:::

![20240906083737_rec_](https://static-docs.nocobase.com/20240906083737_rec_.gif)

更多内容参考 [联动规则](/handbook/ui/blocks/block-settings/field-linkage-rule)
