# 字段联动规则

## 介绍

字段联动规则是指允许根据用户的行为动态调整表单/详情区块字段的状态，目前支持字段联动规则的区块包括：

- [表单区块](/handbook/ui/blocks/data-blocks/form#%E8%81%94%E5%8A%A8%E8%A7%84%E5%88%99)
- [详情区块](/handbook/ui/blocks/data-blocks/details#%E8%81%94%E5%8A%A8%E8%A7%84%E5%88%99)
- [子表单](/handbook/ui/fields/specific/nester)（需 v1.3.17-beta 及以上版本）
- [子表格](/handbook/ui/fields/specific/sub-table)（需 v1.3.17-beta 及以上版本）

## 使用说明

### **表单区块**

在表单区块中，联动规则可根据特定条件动态调整字段的行为：

- **控制字段的显示/隐藏**：根据其他字段的值来决定当前字段是否显示。
- **设置字段是否必填**：在特定条件下，动态设置字段为必填或非必填。
- **赋值**：根据条件自动为字段赋值。
- **配置选项字段的选项范围**：根据条件动态更新下拉选项的可选范围。
- **限定时间字段的可选时间范围**：在时间字段中，依据其他字段的值限定可选的时间范围。

### **详情区块**

在详情区块中，联动规则主要用于动态控制详情区块上字段的显示和隐藏。

![20250418161037](https://static-docs.nocobase.com/20250418161037.png)

## 属性联动

### 赋值

示例:订单勾选为增补订单时，订单状态自动赋值为「待审核」。

![20250418161712](https://static-docs.nocobase.com/20250418161712.png)

### 必填

示例: 订单状态为「待支付」时，订单金额必填。

![20250418163252](https://static-docs.nocobase.com/20250418163252.png)

### 显示/隐藏

示例: 仅订单状态为「待支付」时才显示支付方式。

![20250418163733](https://static-docs.nocobase.com/20250418163733.png)

### 选项

> **注意**: 该功能**从v1.7.0-beta.2版本起支持**

支持为`select`, `radioGroup`, `multipleSelect`, `checkboxGroup`等类型的字段动态的配置选项，其可选项可以根据表单中其他字段的变化实现联动。

示例：仅订单金额高于10000时可选择「分期付款」。

![20250418164806](https://static-docs.nocobase.com/20250418164806.png)

联动效果如下

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20250418164831.mp4" type="video/mp4">
</video>

### 日期范围

> **注意**: 该功能**从v1.7.0-beta.2版本起支持**

支持为`date`, `datetime`, `dateOnly`, `datetimeNoTz`, `unixTimestamp`, `createdAt`, `updatedAt`等类型字段动态配置日期范围，其可选日期范围可以根据表单中其他字段的变化自动调整。

示例：选择订单日期后，发货日期不能早于订单日期。

![20250418165500](https://static-docs.nocobase.com/20250418165500.png)

示例：交付日期 (Delivery Date) 不能早于今天且不能晚于订单截止日期 (Order Deadline)。

![20250418170520](https://static-docs.nocobase.com/20250418170520.png)

更多联动规则说明参考 [联动规则](/handbook/ui/linkage-rule)
