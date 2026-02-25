# 字段联动规则

## 介绍

字段联动规则是指允许根据用户的行为动态调整表单/详情区块字段的状态，目前支持字段联动规则的区块包括：

- [表单区块](/interface-builder/blocks/data-blocks/form)
- [详情区块](/interface-builder/blocks/data-blocks/details)
- [子表单](/interface-builder/fields/specific/sub-form)

## 使用说明

### **表单区块**

在表单区块中，联动规则可根据特定条件动态调整字段的行为：

- **控制字段的显示/隐藏**：根据其他字段的值来决定当前字段是否显示。
- **设置字段是否必填**：在特定条件下，动态设置字段为必填或非必填。
- **赋值**：根据条件自动为字段赋值。
- **执行指定的 JavaScript**：根据业务需求编写 JavaScript。

### **详情区块**

在详情区块中，联动规则主要用于动态控制详情区块上字段的显示和隐藏。

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## 属性联动

### 赋值

赋值动作支持两种方式：

- **默认值**：用于预先填充，用户仍可修改，通常只在“新增对象/字段为空”时生效；
- **固定值**：由系统写入，规则触发时会覆盖字段当前值，适合状态等系统字段。

:::info{title=提示}
如果同一字段同时配置了「表单区块的字段值」和「联动规则的赋值」，联动规则的赋值优先级更高。更多内容参考 [字段值](/interface-builder/blocks/block-settings/field-values)。
:::

示例：订单勾选为增补订单时，订单状态自动赋值为「待审核」。

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

![字段联动规则-赋值模式切换与值编辑器](https://static-docs.nocobase.com/placeholder.png)

### 必填

示例：订单状态为「已支付」时，订单金额必填。

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### 显示/隐藏

示例：仅订单状态为「待支付」时才显示支付账户和总金额。

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)
