# Input

文本输入框。其基于 ant-design [Input](https://ant.design/components/input/) 组件进行封装。

## Input

### Basic Usage

```ts
type InputProps = AntdInputProps;
```

<code src="./demos/new-demos/input.tsx"></code>

### JSON5

<code src="./demos/new-demos/json5.tsx"></code>

### ReadPretty

```ts
interface InputReadPrettyProps {
  value?: any;
  className?: string;
  style?: React.CSSProperties;
  addonBefore?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonAfter?: React.ReactNode;
  ellipsis?: boolean;
  prefixCls?: string;
}
```

<code src="./demos/new-demos/input-read-pretty.tsx"></code>

## Input.TextArea

### Basic Usage

```ts
type InputTextAreaProps = AntdTextAreaProps;
```

<code src="./demos/new-demos/textarea.tsx"></code>

### ReadPretty

```ts
interface InputTextAreaReadPrettyProps {
  value?: any;
  className?: string;
  style?: React.CSSProperties;
  addonBefore?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonAfter?: React.ReactNode;
  ellipsis?: boolean;
  text?: boolean;
  autop?: boolean;
  prefixCls?: string;
}
```

<code src="./demos/new-demos/textarea-read-pretty.tsx"></code>

## Input.URL

### Basic Usage

```ts
type InputURLProps = InputProps;
```

<code src="./demos/new-demos/url.tsx"></code>

### ReadPretty

```ts
interface URLReadPrettyProps {
  value?: any;
  className?: string;
  style?: React.CSSProperties;
  addonBefore?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonAfter?: React.ReactNode;
  prefixCls?: string;
}
```

<code src="./demos/new-demos/url-read-pretty.tsx"></code>

## Input.JSON

### Basic Usage

```ts
type JSONTextAreaProps = AntdTextAreaProps & { value?: string; space?: number; json5?: boolean; }
```

<code src="./demos/new-demos/json.tsx"></code>

### ReadPretty

```ts
interface JSONTextAreaReadPrettyProps {
  value?: any;
  className?: string;
  style?: React.CSSProperties;
  space?: number;
  prefixCls?: string;
}
```

<code src="./demos/new-demos/json-read-pretty.tsx"></code>
