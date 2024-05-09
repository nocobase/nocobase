# Rich Text

Rich Text Editor. It is a wrapper based on [react-quill](https://github.com/zenoamaro/react-quill).

## Basic Usage

```ts
interface RichTextProps {
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
}
```

<code src="./demos/new-demos/basic.tsx"></code>

## Read Pretty

```ts
type RichTextReadPrettyProps = HtmlReadPrettyProps;
```

<code src="./demos/new-demos/read-pretty.tsx"></code>
