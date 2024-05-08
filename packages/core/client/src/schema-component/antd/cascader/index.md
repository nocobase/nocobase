# Cascader

级联选择器，其基于 ant-design [Cascader](https://ant.design/components/cascader-cn/) 组件封装。

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

如果设置 `labelInValue` 为 `true`，则选中的数据为 `{ label: string, value: string }` 格式，否则为 `string` 格式。

<code src="./demos/new-demos/labelInValue.tsx"></code>

## changeOnSelectLast

如果设置 `changeOnSelectLast` 为 `true`，则必须选择最后一级，如果为 `false`，则可以选择任意级。

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
