# Select

选择器。其基于 Ant Design 的 [Select](https://ant.design/components/select-cn/) 组件进行封装。

```ts
type SelectProps = AntdSelectProps<any, any> & {
  /**
   * Whether it is an object value
   */
  objectValue?: boolean;
  /**
   * format options
   * @default { label: 'label', value: 'value', color: 'color', children: 'children' }
   */
  fieldNames: FieldNames;
};
```

### Single

<code src="./demos/demo1.tsx"></code>

### Multiple

<code src="./demos/demo2.tsx"></code>

### Value is object

<code src="./demos/demo3.tsx"></code>
