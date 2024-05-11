# UnixTimestamp

`UnixTimestamp` 是一个基于 `antd` 的DatePicker组件的封装。


```ts
interface UnixTimestampProps {
  value?: number;
   accuracy?: 'millisecond' | 'second';
  onChange?: (value: number) => void;
}
```

## Basic Usage

<code src="./demos/basic.tsx"></code>

## accuracy: second

<code src="./demos/second.tsx"></code>

## Read Pretty

<code src="./demos/read-pretty.tsx"></code>
