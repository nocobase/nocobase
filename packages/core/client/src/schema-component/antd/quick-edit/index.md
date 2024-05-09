# QuickEdit

快速编辑器组件，用于快速编辑数据，可用在 Table cell 中。

```ts
import { IFormItemProps } from '@formily/antd-v5';

interface QuickEditProps extends IFormItemProps {
  children?: React.ReactNode;
}
```

## Basic

<code src="./demos/basic.tsx"></code>

## Read Pretty

` 'x-pattern': 'readPretty'` 下，只显示文本，点击时不会显示编辑器。

<code src="./demos/read-pretty.tsx"></code>

## SubTable

在 `SubTable` 中使用。

<code src="./demos/subtable.tsx"></code>
