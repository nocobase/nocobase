# FormItem

表单字段装饰器。其继承了 [BlockItem](/components/block-item) 的拖拽和 [SchemaToolbar](/core/ui-schema/schema-toolbar) 和 [SchemaSettings](/core/ui-schema/schema-settings) 的渲染功能。

```ts
import { IFormItemProps } from '@formily/antd-v5';
type FormItemProps = IFormItemProps
```

## Example

<code src="./demos/new-demos/basic.tsx"></code>

## 字段默认值

### 常量
<code src="./demos/new-demos/demo.tsx"></code>

### 变量
- 默认值为当前表单值

Title的默认值为当前表单Number的实时输入的值。

<code src="./demos/new-demos/demo1.tsx"></code>

- 默认值为日期变量
日期默认值为「当前时间」

<code src="./demos/new-demos/demo2.tsx"></code>