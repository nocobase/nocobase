# Schema component library

## Wrapper Components

- BlockItem
- FormItem
- CardItem

## Layout

- Page
- Grid
- Tabs
- Space

## Field components

The field components are generally not used alone, but in the data presentation component

- CollectionField: universal component
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

## Data presentation component

Need to be used with the field component

- Calendar
- Form
- Kanban
- Table
- TableV2

## Action (onClick event-based component)

- Action
- Action.Drawer
- Action.Modal
- ActionBar：For action layout
- Menu

## Other

- G2plot
- Markdown.Void

## Usage scenarios for `x-designer` and `x-initializer`

`x-designer` takes effect when `x-decorator` or `x-component` is a component of

- BlockItem
- CardItem
- FormItem
- Table.Column
- Tabs.TabPane

`x-initializer` takes effect when `x-decorator` or `x-component` is a component of

- ActionBar
- BlockItem
- CardItem
- FormItem
- Grid
- Table
- Tabs
