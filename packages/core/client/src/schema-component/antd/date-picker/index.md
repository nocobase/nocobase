---
group:
  title: Schema Components
  order: 3
---

# DatePicker

## Examples

### Basic

<code src="./demos/demo1.tsx"></code>

### DatePicker (GMT)

<code src="./demos/demo2.tsx"></code>

### DatePicker (showTime=false,gmt=true,utc=true)

<code src="./demos/demo7.tsx"></code>


### DatePicker (showTime=false,gmt=false,utc=true)

<code src="./demos/demo8.tsx"></code>


### DatePicker (non-UTC)

<code src="./demos/demo3.tsx"></code>

### RangePicker (GMT)

<code src="./demos/demo4.tsx"></code>

### RangePicker (non-GMT)

<code src="./demos/demo5.tsx"></code>

### RangePicker (non-UTC)

<code src="./demos/demo6.tsx"></code>


## API

基于 antd 的 [DatePicker](https://ant.design/components/date-picker/#API)，新增了以下扩展属性，用于支持 NocoBase 的日期字段设置。

- `dateFormat` 设置日期格式
- `timeFormat` 设置时间格式
