---
group:
  title: Client
  order: 1
---

# SchemaInitializer

用于各种 schema 的初始化。新增的 schema 可以插入到某个已有 schema 节点的任意位置，包括：

```ts
{
  properties: {
    // beforeBegin 在当前节点的前面插入
    node1: {
      properties: {
        // afterBegin 在当前节点的第一个子节点前面插入
        // ...
        // beforeEnd 在当前节点的最后一个子节点后面
      },
    },
    // afterEnd 在当前节点的后面
  },
}
```

## Examples

### Basic

<code src="./demos/basic.tsx"></code>

### Nested items

<code src="./demos/nested-items.tsx"></code>

### Custom Items Component

列表默认使用 `List` 组件，可以通过 `ItemsComponent` 属性自定义列表组件。

<code src="./demos/custom-items-component.tsx"></code>

### Custom Button

<code src="./demos/custom-button.tsx"></code>

### Built Type

NocoBase 提供了几个内置的组件，可以直接使用。

<code src="./demos/build-type.tsx"></code>

### Dynamic visible & children

动态显示和隐藏 Item 项，以及动态加载 children。

<code src="./demos/dynamic-visible-children.tsx"></code>

### Insert schema

#### Basic

<code src="./demos/insert-schema-basic.tsx"></code>

#### Action

<code src="./demos/insert-schema-action.tsx"></code>

#### FormItem

<code src="./demos/insert-schema-form-item.tsx"></code>
