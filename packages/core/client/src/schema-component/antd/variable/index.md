# Variable

变量选择器。

## `Variable.Input`

### scope 定义

scope 可以定义变量的 label, value , type
变量的 type 会匹配对应的 helper 函数，对变量进行二次处理。目前内置了 date.format , date.offset 的 helpers。也就是说如果变量的类型是 date, 会匹配到对应的过滤器。如果变量是其他类型或者无类型，都无法匹配到过滤器。


```ts
const scope = [
  {label: 'v1', value: 'v1'}
  {label: 'now', value: 'now', type: 'date'}
]
```

<code src="./demos/scope.tsx"></code>

### helper 示例
<code src="./demos/helper-demo.tsx"></code>

### 变量值如何获取
1. VariableEvaluateProvider 上下文获取
提供 VariableEvaluateProvider 上下文，可以注入 data 属性
2. 从 scope 中的 example 属性获取
某些变量在前端无法获取到实际值（如服务端环境下的变量），但是有需要提供一个示例值方便应用 helpers，可以在声明 scope 选项时带上示例值，如 `{label: 'v1' , value: 'v1', example: 'example-value-v1'}`

一下是一个完整的例子，变量 v1 由上下文提供值，变量 v2 由 example 提供值。鼠标悬浮在变量名称上即可查看对应变量的值。
<code src="./demos/variable-value.tsx"></code>

### 应用场景
#### 默认值 (由于 demo 所限，默认值不会生效)
默认值场景需要应用变量，并且同一个字面意义的变量根据字段的类型不同需要有不同的值。
以日期的今天为例，如果是 dateOnly 类型的字段要输出 2025-01-01，如果是无时区的 dateitme，则需要输出 2025-01-01 00:00:00,
如果是有时区 datetime, 则要输出 2024-12-31T16:00:00.000Z
所以今天需要提供三个变量，`today_withtz`, `today_withouttz`, `today_dateonly`

<code src="./demos/form-default-value.tsx"></code>

### 变量选中并已被禁用的效果
当变量被禁用时，不影响已经选中的变量显示。在下面的例子中，now 变量已被禁用：

<code src="./demos/selected-and-disable.tsx"></code>

```ts
import type { DefaultOptionType } from 'antd/lib/cascader';
 type VariableInputProps = {
  value?: string;
  scope?: DefaultOptionType[] | (() => DefaultOptionType[]);
  onChange: (value: string, optionPath?: any[]) => void;
  children?: any;
  button?: React.ReactElement;
  useTypedConstant?: true | string[];
  changeOnSelect?: CascaderProps['changeOnSelect'];
  fieldNames?: CascaderProps['fieldNames'];
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  parseOptions?: ParseOptions;
}

type ParseOptions = {
  stringToDate?: boolean;
};
```

<code src="./demos/demo1.tsx"></code>

### 支持 helper 助手函数
目前变量支持添加助手函数进行二次处理，不同的变量可能支持不同的助手函数，助手函数还支持分组。
Input 组件支持传入 variableHelperMapping 属性来标记变量支持哪些助手函数。
例如，日期变量只支持日期相关的助手函数，则可配置
```ts
const variableHelperMapping = {
          rules: [
            {
              variable: '$date.*',
              helpers: ['date.*'],
            },
          ],
        },

```
<code src="./demos/demo1.tsx"></code>

### 不同的变量有不同的上下文
同一个变量在不同的运行时环境它的值也不同，所以有必要为变量提供上下文环境。
## `Variable.TextArea`

<code src="./demos/demo2.tsx"></code>

## `Variable.JSON`

<code src="./demos/demo3.tsx"></code>
