---
group:
  title: Schema Components
  order: 3
---

# CardItem

卡片装饰器。主要功能为：

- 拖拽和 [SchemaToolbar](/core/ui-schema/schema-toolbar) 和 [SchemaSettings](/core/ui-schema/schema-settings) 的渲染，继承自[BlockItem](/components/block-item)
- 懒渲染

```ts
interface CardItemProps extends CardProps {
  name?: string;
  children?: React.ReactNode;
  /**
   * lazy render options
   * @see https://github.com/thebuilder/react-intersection-observer
   */
  lazyRender?: IntersectionOptions;
}
```

## 基础用法

<code src="./demos/new-demos/basic.tsx" ></code>

## 自定义懒渲染参数

<code src="./demos/new-demos/lazy-render.tsx" ></code>
