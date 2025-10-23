# 详情区块

## 介绍

详情区块用于详细展示每条数据的每个字段的值。它支持灵活的字段布局，并内置了多种数据操作。

## 添加区块

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240417122622.mp4" type="video/mp4">
</video>

## 区块配置项

![20240511114328](https://static-docs.nocobase.com/20240511114328.png)

### 设置数据范围

示例：只显示已发货的订单

![20240417122910](https://static-docs.nocobase.com/20240417122910.png)

更多内容参考 [设置数据范围](/handbook/ui/blocks/block-settings/data-scope)

### 设置排序规则

![20240417123300](https://static-docs.nocobase.com/20240417123300.png)

更多内容参考 [排序规则](/handbook/ui/blocks/block-settings/sorting-rule)

- [设置数据加载方式](/handbook/ui/blocks/block-settings/loading-mode)
- [保存为区块模板](/handbook/block-template)

### 联动规则

详情区块中的联动规则支持动态设置字段 显示/隐藏。

示例：收货日期早于发货日期时隐藏发货日期。

![20240511115156](https://static-docs.nocobase.com/20240511115156.png)

更多内容参考 [联动规则](/handbook/ui/blocks/block-settings/field-linkage-rule)

### 设置区块高度

示例：设置订单详情区块高度为「全高」模式。

![20240604232307](https://static-docs.nocobase.com/20240604232307.gif)

更多内容参考 [区块高度](/handbook/ui/blocks/block-settings/block-height)

## 配置字段

### 本表字段

![20240417213735](https://static-docs.nocobase.com/20240417213735.png)

### 关系表字段

![20240417214006](https://static-docs.nocobase.com/20240417214006.png)

详情字段配置项可参考 [详情字段](/handbook/ui/fields/generic/detail-form-item)

## 配置操作

![20240417214433](https://static-docs.nocobase.com/20240417214433.png)

- [编辑](/handbook/ui/actions/types/edit)
- [删除](/handbook/ui/actions/types/delete)
- [弹窗](/handbook/ui/actions/types/pop-up)
- [更新记录](/handbook/ui/actions/types/update-record)
- [自定义请求](/handbook/action-custom-request)
- [触发工作流](/handbook/workflow/manual/triggers/custom-action)
