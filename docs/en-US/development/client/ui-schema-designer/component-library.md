# Schema 组件库

## 包装器组件

- BlockItem
- FormItem
- CardItem

## 布局

- Page
- Grid
- Tabs
- Space

## 字段组件

字段组件一般不单独使用，而是用在数据展示组件当中

- CollectionField：万能组件
- Cascader
- Checkbox
- ColorSelect
- DatePicker
- Filter
- Formula
- IconPicker
- Input
- InputNumber
- Markdown
- Password
- Percent
- Radio
- RecordPicker
- RichText
- Select
- TimePicker
- TreeSelect
- Upload

## 数据展示组件

需要与字段组件搭配使用

- Calendar
- Form
- Kanban
- Table
- TableV2

## 操作（onClick 事件型组件）

- Action
- Action.Drawer
- Action.Modal
- ActionBar：用于操作布局
- Menu

## 其他

- G2plot
- Markdown.Void

## `x-designer` 和 `x-initializer` 的使用场景

`x-decorator` 或 `x-component` 是以下组件时，`x-designer` 生效：

- BlockItem
- CardItem
- FormItem
- Table.Column
- Tabs.TabPane

`x-decorator` 或 `x-component` 是以下组件时，`x-initializer` 生效：

- ActionBar
- BlockItem
- CardItem
- FormItem
- Grid
- Table
- Tabs