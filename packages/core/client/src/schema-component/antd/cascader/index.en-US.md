# Cascader

Cascader is a cascading selector component based on the ant-design [Cascader](https://ant.design/components/cascader/) component.

```ts
type CascaderProps<DataNodeType extends BaseOptionType = any> = AntdCascaderProps<DataNodeType> & {
   /**
   * Whether to wrap the label of option into the value
   */
  labelInValue?: boolean;
  /**
   * must select the last level
   */
  changeOnSelectLast?: boolean;
}
```

## Basic Usage

<code src="./demos/new-demos/basic.tsx"></code>

## Asynchronous Data Source

<code src="./demos/new-demos/loadData.tsx"></code>

## labelInValue

If `labelInValue` is set to `true`, the selected data will be in the format `{ label: string, value: string }`, otherwise it will be in the format `string`.

<code src="./demos/new-demos/labelInValue.tsx"></code>

## changeOnSelectLast

If `changeOnSelectLast` is set to `true`, the last level must be selected. If set to `false`, any level can be selected.

<code src="./demos/new-demos/changeOnSelectLast.tsx"></code>

## Read Pretty

```ts
interface FieldNames {
  label: string;
  value: string;
  children: string;
}

export interface CascaderReadPrettyProps {
  fieldNames?: FieldNames;
  value?: any;
}
```

<code src="./demos/new-demos/read-pretty.tsx"></code>
