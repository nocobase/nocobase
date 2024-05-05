# CardItem

卡片装饰器。主要功能为：

- 拖拽和 [SchemaToolbar](/core/ui-schema/schema-toolbar) 和 [SchemaSettings](/core/ui-schema/schema-settings) 的渲染，继承自[BlockItem](/components/block-item)
- 懒渲染

其基于 ant-design [Card](https://ant.design/components/card-cn/) 组件进行封装，懒加载基于 [react-intersection-observer](https://github.com/thebuilder/react-intersection-observer) 实现。

```ts
interface CardItemProps extends CardProps {
  name?: string;
  /**
   * lazy render options
   * @see https://github.com/thebuilder/react-intersection-observer
   */
  lazyRender?: IntersectionOptions;
}
```

## Basic

<code src="./demos/new-demos/basic.tsx" ></code>

## Custom lazy render

<code src="./demos/new-demos/lazy-render.tsx" ></code>
