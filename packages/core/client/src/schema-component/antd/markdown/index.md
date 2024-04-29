# Markdown

Markdown 编辑器。更多属性请参考 [TextArea](https://ant.design/components/input#inputtextarea)。

## Markdown

### Basic

```ts
interface MarkdownProps extends TextAreaProps {}
```

<code src="./demos/new-demos/basic.tsx"></code>

### Read Pretty

```ts
interface MarkdownReadPrettyProps extends InputTextAreaReadPrettyProps  {}
```

<code src="./demos/new-demos/read-pretty.tsx"></code>

## Markdown.Void

```ts
interface MarkdownVoidProps extends Omit<TextAreaProps, 'onSubmit'> {
  defaultValue?: string;
  onSubmit?: (value: string) => void;
  onCancel?: (e: React.MouseEvent) => void;
}
```

<code src="./demos/demo2.tsx"></code>
