# CollectionSelect

用于选择当前数据源的数据表。

```ts
type CollectionSelectProps = SelectProps<any, any> & {
  filter?: (item: any, index: number, array: any[]) => boolean;
  isTableOid?: boolean;
};
```

## Basic Usage

<code src="./demos/basic.tsx"></code>

## Multiple Selection

`type` 需要改为 `array`，并且属性需要增加 `mode: 'multiple'`。

<code src="./demos/multiple.tsx"></code>

## Read Pretty

<code src="./demos/read-pretty.tsx"></code>
