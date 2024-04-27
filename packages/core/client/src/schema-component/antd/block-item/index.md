# BlockItem

普通的装饰器（Decorator）组件，无 UI 效果，一般用在 `x-decorator` 中。

主要提供了以下 2 个能力：

- 拖拽功能
- [SchemaToolbar](/core/ui-schema/schema-toolbar) 和 [SchemaSettings](/core/ui-schema/schema-settings) 的渲染

[CardItem](/components/card-item) 和 [FormItem](/components/form-item) 组件都是基于 BlockItem 实现，也具备以上相同功能。

```ts
interface BlockItemProps {
  name?: string;
  className?: string;
  children?: React.ReactNode;
}
```

注意拖拽功能需要配置 `DndContext` 组件。

<code src="./demos/new-demos/basic.tsx"></code>
