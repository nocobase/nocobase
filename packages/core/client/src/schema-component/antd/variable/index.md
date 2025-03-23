# Variable

变量选择器。

## `Variable.Input`

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
