# CardItem

Card decorator. Its main functions are:

- Drag and render [SchemaToolbar](/core/ui-schema/schema-toolbar) and [SchemaSettings](/core/ui-schema/schema-settings), inherited from [BlockItem](/components/block-item)
- Lazy rendering

It is based on the ant-design [Card](https://ant.design/components/card-cn/) component, and lazy loading is implemented using [react-intersection-observer](https://github.com/thebuilder/react-intersection-observer).

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
