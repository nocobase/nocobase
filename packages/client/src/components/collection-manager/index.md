---
group:
  title: Client
  path: /client
---

# CollectionManager

## Providers

### CollectionManagerProvider

```jsx | pure
<CollectionManagerProvider interfaces={{}}></CollectionManagerProvider>
```

### CollectionProvider

```jsx | pure
<CollectionProvider name={'tests'} collection={{}}></CollectionProvider>
```

### CollectionFieldProvider

```jsx | pure
const fields = [
  {
    type: 'string',
    name: 'title',
    interface: 'input',
    uiSchema: {
      type: 'string',
      'x-component': 'Input'
    },
  },
];

<CollectionProvider name={'tests'} fields={fields}>
  <CollectionFieldProvider name={'title'} uiSchema={{}}>
  </CollectionFieldProvider>
</CollectionProvider>
```

### Collection.FormItem

title、description 属性只在 decorator 里有效，可以在表单和详情里使用。使用 Collection.FormItem 时，x-component 无效。

```ts
{
  'x-decorator': 'Collection.FormItem',
  'x-decorator-props': {},
  'x-component-props': {},
  properties: {},
}
```

### Collection.Field

```ts
{
  'x-component': 'Collection.Field',
  'x-component-props': {},
  properties: {},
}
```

<Alert title="Collection.FormItem 和 Collection.Field 的区别">
Collection.FormItem 是 decorator，Collection.Field 是 component。title、description 属性由 FormItem 管理。
在表单和详情视图和需要 FormItem 的场景里，需要用 Collection.FormItem 替换原来的 FormItem。
</Alert>

## Hooks

### useCollectionManager()

```jsx | pure
const { collections, get } = useCollectionManager();
```

### useCollection()

```jsx | pure
const { name, fields, getField, findField } = useCollection();
```

### useCollectionField()

```jsx | pure
const { name, uiSchema } = useCollectionField();
```

<code src="./demos/demo2.tsx"/>
