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

### CollectionField

仅支持在 Schema 场景使用

```ts
{
  'x-decorator': 'FormItem',
  'x-decorator-props': {},
  'x-component': 'CollectionField',
  'x-component-props': {},
  properties: {},
}
```

## Hooks

### useCollectionManager()

```jsx | pure
const { collections, get } = useCollectionManager();
```

### useCollection()

```jsx | pure
const { collection, getField, findField } = useCollection();
```

### useCollectionField()

```jsx | pure
const { name, collectionField, uiSchema } = useCollectionField();
```

<code src="./demos/demo1.tsx"/>

<code src="./demos/demo2.tsx"/>
