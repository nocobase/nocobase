---
group:
  title: Schema Components
  order: 3
---

# DatePicker

表单项组件。

级联选择器，其基于 ant-design [DatePicker](https://ant.design/components/date-picker/) 组件封装。

## DatePicker

```ts
export interface Str2momentOptions {
  picker?: 'year' | 'month' | 'week' | 'quarter';
  utcOffset?: number;
  gmt?: boolean;
  utc?: boolean;
}

type DatePickerProps = AntdDatePickerProps & Str2momentOptions
```

### Basic Usage

<code src="./demos/new-demos/date-basic.tsx"></code>

### Format

<code src="./demos/new-demos/date-format.tsx"></code>

### Show Time Picker

<code src="./demos/new-demos/date-show-time.tsx"></code>

### Read Pretty

<code src="./demos/new-demos/date-read-pretty.tsx"></code>

### GMT

<code src="./demos/new-demos/date-gmt.tsx"></code>

### UTC

<code src="./demos/new-demos/date-utc.tsx"></code>

### GMT and UTC

<code src="./demos/new-demos/date-gmt-utc.tsx"></code>

## RangePicker

```ts
export interface Str2momentOptions {
  gmt?: boolean;
  picker?: 'year' | 'month' | 'week' | 'quarter';
  utcOffset?: any;
  utc?: boolean;
}

type DatePickerProps = AntdRangePickerProps & Str2momentOptions
```

### Basic Usage

<code src="./demos/new-demos/range-basic.tsx"></code>

### Format

<code src="./demos/new-demos/range-format.tsx"></code>

### Read Pretty

<code src="./demos/new-demos/range-read-pretty.tsx"></code>

### GMT

<code src="./demos/new-demos/range-gmt.tsx"></code>

### UTC

<code src="./demos/new-demos/range-utc.tsx"></code>

### GMT and UTC

<code src="./demos/new-demos/range-gmt-utc.tsx"></code>
