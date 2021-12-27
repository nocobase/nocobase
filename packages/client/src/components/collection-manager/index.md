---
group:
  title: Client
  path: /client
---

# CollectionManager

## Components

### CollectionManagerProvider

```jsx | pure
<CollectionManagerProvider interfaces={{}} collections={[]}></CollectionManagerProvider>
```

### CollectionProvider

```jsx | pure
const collection = {
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input'
      },
    },
  ],
};
<CollectionProvider collection={collection}></CollectionProvider>
```

如果没有传 collection 参数，从 CollectionManagerProvider 里取对应 name 的 collection。

```jsx | pure
const collections = [
  {
    name: 'tests',
    fields: [
      {
        type: 'string',
        name: 'title',
        interface: 'input',
        uiSchema: {
          type: 'string',
          'x-component': 'Input'
        },
      },
    ],
  }
];
<CollectionManagerProvider collections={collections}>
  <CollectionProvider name={'tests'}></CollectionProvider>
</CollectionManagerProvider>
```

### CollectionFieldProvider

```jsx | pure
const field = {
  type: 'string',
  name: 'title',
  interface: 'input',
  uiSchema: {
    type: 'string',
    'x-component': 'Input'
  },
};
<CollectionFieldProvider field={field}></CollectionFieldProvider>
```

如果没有传 field 参数，从 CollectionProvider 里取对应 name 的 field。

```jsx | pure
const collection = {
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input'
      },
    },
  ],
};
<CollectionProvider collection={collection}>
  <CollectionFieldProvider name={'title'}></CollectionFieldProvider>
</CollectionProvider>
```

### Collection.FormItem

title、description 属性只在 decorator 里有效，在表单和详情视图和需要 FormItem 的场景里，需要用 Collection.FormItem 替换原来的 FormItem。使用 Collection.FormItem 时，x-component 无效。

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

## Hooks

### useCollectionManager()

与 `<CollectionManagerProvider/>` 结合使用

```jsx | pure
const { collections, get } = useCollectionManager();
```

### useCollection()

与 `<CollectionProvider/>` 结合使用

```jsx | pure
const { name, fields, getField, findField } = useCollection();
```

### useCollectionField()

与 `<CollectionFieldProvider/>` 结合使用

```jsx | pure
const { name, uiSchema } = useCollectionField();
```

## Examples

<code src="./demos/demo2.tsx"/>
