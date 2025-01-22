# Filter

用于筛选数据的组件，常用于区块过滤数据。

```ts
type FilterActionProps<T = {}> = ActionProps & {
  options?: any[];
  form?: Form;
  onSubmit?: (values: T) => void;
  onReset?: (values: T) => void;
}
```

### Basic Usage

我们可以结合 `useRequest()` 发起请求。

<code src="./demos/new-demos/basic.tsx"></code>

### Default Value

可以通过 `schema.default` 设置默认值。

<code src="./demos/new-demos/default-value.tsx"></code>

### With Data Block

如果是在 [DataBlock](/core/data-block/data-block-provider) 区块中使用，我们可以使用 [useDataBlockResource()](/core/data-block/data-block-request-provider) 发起请求。

<code src="./demos/new-demos/with-data-block.tsx"></code>

### with Collection fields

可以使用 `useFilterFieldOptions(collection.fields)` 获取集合字段的选项。

<code src="./demos/new-demos/collection-fields.tsx"></code>
