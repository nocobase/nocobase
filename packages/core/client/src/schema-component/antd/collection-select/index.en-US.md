# CollectionSelect

Used to select a data table from the current data source.

```ts
type CollectionSelectProps = SelectProps<any, any> & {
  filter?: (item: any, index: number, array: any[]) => boolean;
  isTableOid?: boolean;
};
```

## Basic Usage

<code src="./demos/basic.tsx"></code>

## Multiple Selection

`type` needs to be changed to `array`, and the property needs to be added `mode: 'multiple'`.

<code src="./demos/multiple.tsx"></code>

## Read Pretty

<code src="./demos/read-pretty.tsx"></code>
