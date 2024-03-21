# 概述

## `x-initializer`

不是所有节点都能使用 `x-initializer`，内置的 Schema 组件里，只有 Grid、ActionBar、Tabs、Table 组件有 `x-initializer` 参数

- Grid（通用）
- ActionBar（通用）
- Tabs（通用）
- Table
- Menu

## `x-designer`

`x-designer` 通常需要和 `BlockItem`、`FormItem`、`CardItem` 这类组件结合使用

完整的 Designer 组件有

- DragHandler
- Initializer
- Settings

```tsx | pure
<Designer draggable initializer={''} settings={''} />
```
