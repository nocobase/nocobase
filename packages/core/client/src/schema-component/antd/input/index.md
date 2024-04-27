# Input

文本输入框。其基于 ant-design [Input](https://ant.design/components/input/) 组件进行封装。

## Input

```ts
interface InputProps extends AntdInputProps {
  ellipsis?: boolean;
}
```

### Basic Usage

<code src="./demos/new-demos/input.tsx"></code>

### ReadPretty and Ellipsis

<code src="./demos/new-demos/input-read-pretty.tsx"></code>

## Input.TextArea

```ts
interface InputTextAreaProps extends AntdTextAreaProps {
  ellipsis?: boolean;
  text?: boolean;
  addonBefore?: any;
  suffix?: React.ReactNode;
  addonAfter?: React.ReactNode;
  /**
   * Whether to automatically process text content
   * @default true
   */
  autop?: boolean;
}
```

<code src="./demos/new-demos/textarea.tsx"></code>

## Input.URL

```ts
type InputURL = InputProps;
```

<code src="./demos/url.tsx"></code>

## Input.JSON

```ts
type JSONTextAreaProps = TextAreaProps & { value?: string; space?: number }
```

<code src="./demos/json.tsx"></code>
