# 表格字段

## 介绍

表格字段除了支持对字段调整列宽、字段标题、排序等，对于特定字段（如日期字段、关系字段、数值字段）还支持更多个性化的展示配置。

![20240511140644](https://static-docs.nocobase.com/20240511140644.png)
## 字段配置项

### 日期字段格式化

![20240417114116](https://static-docs.nocobase.com/20240417114116.png)

更多内容参考 [日期格式化](/handbook/ui/fields/specific/date-picker)

### 数值字段格式化

![20240417215229](https://static-docs.nocobase.com/20240417215229.png)

支持简单的单位换算，千分位分隔符，前后缀，精确度，科学记数法。

![20240417215425](https://static-docs.nocobase.com/20240417215425.png)

更多内容参考 [数值格式化](/handbook/ui/fields/field-settings/number-format)

### 排序

只支持同时对一列进行排序,针对当前页数据排序，暂不支持以关系字段排序。

![20240422115501](https://static-docs.nocobase.com/20240422115501.png)

### 固定列

![20240511140524](https://static-docs.nocobase.com/20240511140524.png)

### 字段组件

部分字段支持切换为其他组件，例如：`URL` 组件可以切换为 `Preview` 组件。

![20240806165152](https://static-docs.nocobase.com/20240806165152.png)

如果你需要扩展更多的组件，可以参考 [扩展有值字段组件组件](/plugin-samples/field/value)。

### 样式

支持按条件配置列的颜色和背景颜色。假设我们有一张银行交易明细表，有一列是交易金额，我们要把正数（收入）设置为绿色，负数（支出）设置为红色，以下是具体的操作步骤：

1. 首先，打开交易金额的字段设置菜单，点击风格。
![style-menu-2024-08-08-18-23-13](https://static-docs.nocobase.com/style-menu-2024-08-08-18-23-13.png)

1. 点击添加联动规则，设置第一个规则，当交易金额大于0时字段的颜色设置为绿色。
![style-green-2024-08-08-18-33-34](https://static-docs.nocobase.com/style-green-2024-08-08-18-33-34.png)

1. 再次点击添加联动规则，设置第二个规则，当交易金额小于0时字段的颜色设置为红色。
![style-red-2024-08-08-18-35-01](https://static-docs.nocobase.com/style-red-2024-08-08-18-35-01.png)

最终的效果如下
![result-2024-08-08-18-38-05](https://static-docs.nocobase.com/result-2024-08-08-18-38-05.png)
