# Variable

Variable selector.

## `Variable.Input`

### 默认值模式

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

### 数据范围模式
数据范围的模式

### `Variable.TextArea`

<code src="./demos/demo2.tsx"></code>

### `Variable.JSON`

<code src="./demos/demo3.tsx"></code>
