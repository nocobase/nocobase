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

### `Variable.TextArea`

<code src="./demos/demo2.tsx"></code>

### `Variable.JSON`

<code src="./demos/demo3.tsx"></code>
