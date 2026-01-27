# 表格字段

## 介绍

表格字段除了支持对字段调整列宽、字段标题、排序等，对于特定字段（如日期字段、关系字段、数值字段）还支持更多个性化的展示配置。

![20251024174558](https://static-docs.nocobase.com/20251024174558.png)

## 字段配置项

### 日期字段格式化

![20251024175303](https://static-docs.nocobase.com/20251024175303.png)

更多内容参考 [日期格式化](/interface-builder/fields/specific/date-picker)

### 数值字段格式化

支持简单的单位换算，千分位分隔符，前后缀，精确度，科学记数法。

![20251024175445](https://static-docs.nocobase.com/20251024175445.png)

更多内容参考 [数值格式化](/interface-builder/fields/field-settings/number-format)

### 启用快速编辑

当启用快速编辑该列鼠标 hover 时将出现编辑按钮，点击即可在弹窗中快速编辑并保存数据。

![20251025171158](https://static-docs.nocobase.com/20251025171158.gif)

### 启用点击打开

除了关系字段支持点击打开弹窗，普通字段也可以开启点击打开以作为打开弹窗的入口。

![20251025172308](https://static-docs.nocobase.com/20251025172308.gif)

### 内容溢出显示方式

当列内容溢出表格列宽度时可以设置溢出方式

- 省略显示（默认）
- 换行

![20251025172549](https://static-docs.nocobase.com/20251025172549.png)

### 固定列

![20251025170858](https://static-docs.nocobase.com/20251025170858.gif)

### 字段组件

部分字段支持多种展示形态，用户可以通过切换字段组件来实现不同的显示效果，满足不同场景下的需求。例如，**URL** 类型字段可以切换为 **Preview** 组件，以更好地展示链接内容或图像预览。

![20251025171658](https://static-docs.nocobase.com/20251025171658.png)

### 显示样式

- 标签
- 文本

![20251025172723](https://static-docs.nocobase.com/20251025172723.png)

### 可排序的

目前绝大多数字段类型都支持服务端排序，当开启排序后，支持根据目标字段倒序/正序排序数据

![20251125221247](https://static-docs.nocobase.com/20251125221247.png)

#### 表格区块中字段排序

![20251125221425](https://static-docs.nocobase.com/20251125221425.gif)

#### 详情区块中子表格字段排序

![20251125221949](https://static-docs.nocobase.com/20251125221949.gif)