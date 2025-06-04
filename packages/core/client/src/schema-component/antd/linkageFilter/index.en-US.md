# LinkageFilter

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


<code src="./demos/new-demos/basic.tsx"></code>
