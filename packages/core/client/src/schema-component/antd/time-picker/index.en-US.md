# TimePicker

TimePicker. It is a wrapper component based on the ant-design [TimePicker](https://ant.design/components/time-picker) component.

## TimePicker

### Basic Usage

```ts
type TimePickerProps = AntdTimePickerProps
```

<code src="./demos/new-demos/time.tsx"></code>

### Read Pretty

```ts
interface TimePickerReadPrettyProps {
  format?: string;
  style?: React.CSSProperties;
  value: string | string[];
  className?: string;
  prefixCls?: string;
}
```

<code src="./demos/new-demos/time-read-pretty.tsx"></code>

## Time Range Picker

### Basic Usage

```ts
type TimeRangePickerProps = AntdTimePickerProps
```

<code src="./demos/new-demos/time-range.tsx"></code>

### Read Pretty

```ts
type TimeRangePickerReadPrettyProps = TimePickerReadPrettyProps;
```

<code src="./demos/new-demos/time-range-read-pretty.tsx"></code>
