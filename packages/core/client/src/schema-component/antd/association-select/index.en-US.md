# AssociationSelect

Retrieve data from a table by specifying the table and field.

```ts
type AssociationSelectProps<P = any> = RemoteSelectProps<P> & {
  action?: string;
  multiple?: boolean;
};
```

## Basic Usage

<code src="./demos/new-demos/basic.tsx"></code>

## Multiple Selection

`type` needs to be changed to `array`, and the property needs to be added `multiple: true`.

<code src="./demos/new-demos/multiple.tsx"></code>

## Read Pretty

<code src="./demos/new-demos/read-pretty.tsx"></code>
