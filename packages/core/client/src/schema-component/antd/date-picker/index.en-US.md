# DatePicker

Cascader selector, which is a wrapper for the ant-design [DatePicker](https://ant.design/components/date-picker/) component.

## DatePicker

```ts
type DatePickerProps = AntdDatePickerProps
```

### Basic Usage

<code src="./demos/new-demos/date-basic.tsx"></code>

### Format

<code src="./demos/new-demos/date-format.tsx"></code>

### Show Time Picker

<code src="./demos/new-demos/date-show-time.tsx"></code>

### Read Pretty

```ts
interface GetDefaultFormatProps {
  format?: string;
  dateFormat?: string;
  timeFormat?: string;
  picker?: 'year' | 'month' | 'week' | 'quarter';
  showTime?: boolean;
}

interface Str2momentOptions {
  gmt?: boolean;
  picker?: 'year' | 'month' | 'week' | 'quarter';
  utcOffset?: number;
  utc?: boolean;
}

interface ReadPrettyDatePickerProps extends Str2momentOptions, GetDefaultFormatProps {
  value?: Str2momentValue;
  className?: string;
  prefixCls?: string;
}
```

<code src="./demos/new-demos/date-read-pretty.tsx"></code>

<!-- ### GMT

<code src="./demos/new-demos/date-gmt.tsx"></code> -->

<!-- ### UTC

<code src="./demos/new-demos/date-utc.tsx"></code> -->

<!-- ### GMT and UTC

<code src="./demos/new-demos/date-gmt-utc.tsx"></code> -->

## RangePicker

```ts
type DatePickerProps = AntdRangePickerProps
```

### Basic Usage

<code src="./demos/new-demos/range-basic.tsx"></code>

### Format

<code src="./demos/new-demos/range-format.tsx"></code>

### Read Pretty

```ts
interface DateRangePickerReadPrettyProps extends Str2momentOptions, GetDefaultFormatProps {
  value?: Str2momentValue;
  className?: string;
  prefixCls?: string;
  style?: React.CSSProperties;
}
```

<code src="./demos/new-demos/range-read-pretty.tsx"></code>

<!-- ### GMT

<code src="./demos/new-demos/range-gmt.tsx"></code> -->

<!-- ### UTC

<code src="./demos/new-demos/range-utc.tsx"></code> -->

<!-- ### GMT and UTC

<code src="./demos/new-demos/range-gmt-utc.tsx"></code> -->
