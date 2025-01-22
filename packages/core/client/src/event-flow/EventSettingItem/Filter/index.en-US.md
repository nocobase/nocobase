# Filter

A component used for filtering data, commonly used to filter data in blocks.

```ts
type FilterActionProps<T = {}> = ActionProps & {
  options?: any[];
  form?: Form;
  onSubmit?: (values: T) => void;
  onReset?: (values: T) => void;
}
```

### Basic Usage

We can make requests using `useRequest()`.

<code src="./demos/new-demos/basic.tsx"></code>

### Default Value

Default values can be set using `schema.default`.

<code src="./demos/new-demos/default-value.tsx"></code>

### With Data Block

If used within a [DataBlock](/core/data-block/data-block-provider), we can make requests using [useDataBlockResource()](/core/data-block/data-block-request-provider).

<code src="./demos/new-demos/with-data-block.tsx"></code>

### with Collection fields

You can use `useFilterFieldOptions(collection.fields)` to get options for collection fields.

<code src="./demos/new-demos/collection-fields.tsx"></code>
