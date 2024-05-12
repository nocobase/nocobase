# List

List block component. It is a wrapper based on the ant-design [List](https://ant.design/components/list/) component.

It needs to be used with `List.Decorator` and `List.Item`. `List.Decorator` is a secondary wrapper for `DataBlockProvider`, and its properties can be referred to [DataBlockProvider](/core/data-block/data-block-provider#property-details).

```ts
type ListProps = AntdListProps;
```

## Basic Usage

<code src="./demos/basic.tsx"></code>

## With ActionBar

The principle is the same as Table [ActionBar](/components/table-v2#with-actiontoolbar)

<code src="./demos/with-action.tsx"></code>

## View Or Edit Record

For detailed instructions, please refer to Table [View Or Edit Record](/components/table-v2#view-or-edit-record)

<code src="./demos/view-or-edit-record.tsx"></code>
