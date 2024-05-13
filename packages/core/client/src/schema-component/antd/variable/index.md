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
}
```

<code src="./demos/demo1.tsx"></code>

### 自定义编辑组件

自定义传入children

<code src="./demos/demo4.tsx"></code>

## `Variable.TextArea`
```ts
export type VariableTextAreaProps = {
  value?: string;
  scope?: Partial<DefaultOptionType>[] | (() => Partial<DefaultOptionType>[]);
  onChange: (value: string, optionPath?: any[]) => void;
  children?: any;
  changeOnSelect?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  multiline?: boolean;
};

```

<code src="./demos/demo2.tsx"></code>

## `Variable.JSON`

<code src="./demos/demo3.tsx"></code>
