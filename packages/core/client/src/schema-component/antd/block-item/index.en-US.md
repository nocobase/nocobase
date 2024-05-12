# BlockItem

A regular decorator component with no UI effects, usually used in `x-decorator`.

It provides the following 2 capabilities:

- Drag and drop functionality
- Rendering of [SchemaToolbar](/core/ui-schema/schema-toolbar) and [SchemaSettings](/core/ui-schema/schema-settings)

[CardItem](/components/card-item) and [FormItem](/components/form-item) components are both implemented based on BlockItem and have the same capabilities mentioned above.

```ts
interface BlockItemProps {
  name?: string;
  className?: string;
  children?: React.ReactNode;
}
```

Note that the drag and drop functionality requires configuring the `DndContext` component.

<code src="./demos/new-demos/basic.tsx"></code>
