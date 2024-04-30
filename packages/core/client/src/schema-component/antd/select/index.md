# Select

选择器。其基于 Ant Design 的 [Select](https://ant.design/components/select-cn/) 组件进行封装。

```ts
interface FieldNames {
  label?: string;
  value?: string;
  color?: string;
  options?: string;
}

type SelectProps = AntdSelectProps<any, any> & {
  /**
   * Whether it is an object value
   */
  objectValue?: boolean;
  /**
   * format options
   * @default { label: 'label', value: 'value', color: 'color', options: 'children' }
   */
  fieldNames: FieldNames;
};
```

## Basic Usage

<code src="./demos/new-demos/basic.tsx"></code>

## Multiple

<code src="./demos/new-demos/multiple.tsx"></code>

## ObjectValue

<code src="./demos/new-demos/object-value.tsx"></code>

## fieldNames

<code src="./demos/new-demos/fieldNames.tsx"></code>

## Read Pretty

```ts
interface SelectReadPrettyProps {
  value: any;
  options?: any[];
  ellipsis?: boolean;
  /**
   * format options
   * @default { label: 'label', value: 'value', color: 'color', options: 'children' }
   */
  fieldNames?: FieldNames;
}
```

<code src="./demos/new-demos/read-pretty.tsx"></code>
