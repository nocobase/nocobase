# List

列表区块组件。其基于 ant-design [List](https://ant.design/components/list/) 组件封装。

其需要配合 `List.Decorator` 和 `List.Item` 使用，`List.Decorator` 是对 `DataBlockProvider` 的二次封装，其属性可以参考 [DataBlockProvider](/core/data-block/data-block-provider#属性详解)。

```ts
type ListProps = AntdListProps;
```

## Basic Usage

<code src="./demos/basic.tsx"></code>

## With ActionBar

其原理同 Table [ActionBar](/components/table-v2#with-actiontoolbar)

<code src="./demos/with-action.tsx"></code>

## View Or Edit Record

具体说明请参考 Table [View Or Edit Record](/components/table-v2#view-or-edit-record)

<code src="./demos/view-or-edit-record.tsx"></code>
