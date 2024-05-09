# QuickEdit

QuickEdit component is used for quickly editing data and can be used in Table cells.

```ts
import { IFormItemProps } from '@formily/antd-v5';

interface QuickEditProps extends IFormItemProps {
  children?: React.ReactNode;
}
```

## Basic

<code src="./demos/basic.tsx"></code>

## Read Pretty

Under the `'x-pattern': 'readPretty'` configuration, only the text is displayed and the editor is not shown when clicked.

<code src="./demos/read-pretty.tsx"></code>

## SubTable

Used in `SubTable`.

<code src="./demos/subtable.tsx"></code>
