# AssociationSelect

通过指定数据表和字段，获取数据表的数据。

```ts
type AssociationSelectProps<P = any> = RemoteSelectProps<P> & {
  action?: string;
  multiple?: boolean;
};
```

## Basic Usage

<code src="./demos/new-demos/basic.tsx"></code>

## Multiple Selection

`type` 需要改为 `array`，并且属性需要增加 `multiple: true`。

<code src="./demos/new-demos/multiple.tsx"></code>

## Read Pretty

<code src="./demos/new-demos/read-pretty.tsx"></code>
