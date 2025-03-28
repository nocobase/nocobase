# Variable

变量选择器组件，用于在表单和配置中选择和设置变量。

## `Variable.Input`

### Scope 定义

Scope 用于定义变量的基本属性，包括：
- `label`: 显示名称
- `value`: 变量值
- `type`: 变量类型

变量的 `type` 属性会匹配对应的 helper 函数，用于对变量进行二次处理。目前内置了以下 helper：
- `date.format`: 日期格式化
- `date.offset`: 日期偏移

只有类型为 `date` 的变量才能匹配到对应的过滤器，其他类型或无类型的变量无法使用这些过滤器。

```ts
const scope = [
  {label: 'v1', value: 'v1'}
  {label: 'now', value: 'now', type: 'date'}
]
```

<code src="./demos/scope.tsx"></code>

### Helper 示例

目前支持两个内置的 helper 函数：

1. **date.format**
   - 用于格式化日期变量
   - 支持常见的日期格式，如 'YYYY-MM-DD'、'YYYY-MM-DD HH:mm:ss' 等
   - 示例：`{{$date.now | date.format 'YYYY-MM-DD'}}`

2. **date.offset**
   - 用于对日期进行偏移计算
   - 支持年、月、日、时、分、秒的偏移
   - 示例：`{{$date.now | date.offset '1d'}}`（向后偏移1天）

<code src="./demos/helper-demo.tsx"></code>

### 变量值获取方式

变量值可以通过以下两种方式获取：

1. **VariableEvaluateProvider 上下文**
   - 通过提供 VariableEvaluateProvider 上下文
   - 可以注入 data 属性来获取变量值

2. **Scope 中的 example 属性**
   - 适用于前端无法获取实际值的场景（如服务端环境下的变量）
   - 通过 example 属性提供示例值，方便应用 helpers
   - 示例：`{label: 'v1', value: 'v1', example: 'example-value-v1'}`

下面的示例展示了两种方式：
- 变量 v1 通过上下文获取值
- 变量 v2 通过 example 获取值
- 鼠标悬浮在变量名称上可查看对应变量的值

<code src="./demos/variable-value.tsx"></code>

### 应用场景

#### 1. 默认值设置
根据字段类型的不同，同一个变量可能需要不同的值。以"今天"为例：
- `dateOnly` 类型：输出 `2025-01-01`
- 无时区 `datetime`：输出 `2025-01-01 00:00:00`
- 有时区 `datetime`：输出 `2024-12-31T16:00:00.000Z`

因此需要提供三个变量：
- `today_withtz`
- `today_withouttz`
- `today_dateonly`

<code src="./demos/form-default-value.tsx"></code>

#### 2. 数据范围
<code src="./demos/data-scope-demo.tsx"></code>

### dateFormat 组件优化
<code src="./demos/format-configuator.tsx"></code>
### 变量禁用状态
当变量被禁用时，已选中的变量值仍然保持显示。下面的示例展示了 `now` 变量被禁用的情况：

<code src="./demos/selected-and-disable.tsx"></code>

### 组件属性

```ts
import type { DefaultOptionType } from 'antd/lib/cascader';

type VariableInputProps = {
  value?: string;                    // 变量值
  scope?: DefaultOptionType[] | (() => DefaultOptionType[]);  // 变量范围
  onChange: (value: string, optionPath?: any[]) => void;      // 值变化回调
  children?: any;                   // 子组件
  button?: React.ReactElement;      // 自定义按钮
  useTypedConstant?: true | string[];  // 使用类型常量
  changeOnSelect?: CascaderProps['changeOnSelect'];  // 选择时是否触发变化
  fieldNames?: CascaderProps['fieldNames'];  // 字段名称映射
  disabled?: boolean;               // 是否禁用
  style?: React.CSSProperties;      // 样式
  className?: string;               // 类名
  parseOptions?: ParseOptions;      // 解析选项
}

type ParseOptions = {
  stringToDate?: boolean;  // 是否将字符串转换为日期
};
```


### 变量上下文

同一个变量在不同的运行时环境可能有不同的值，因此需要为变量提供上下文环境。

## `Variable.TextArea`

<code src="./demos/demo2.tsx"></code>

## `Variable.JSON`

<code src="./demos/demo3.tsx"></code>
