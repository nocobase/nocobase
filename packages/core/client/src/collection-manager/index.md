---
nav:
  path: /client
group:
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

### CollectionField

万能字段组件，需要与 `<CollectionProvider/>` 搭配使用，仅限于在 Schema 场景使用。从 CollectionProvider 里取对应 name 的 field schema。可通过 CollectionField 所在的 schema 扩展配置。

```ts
{
  name: 'title',
  'x-decorator': 'FormItem',
  'x-decorator-props': {},
  'x-component': 'CollectionField',
  'x-component-props': {},
  properties: {},
}
```

<code src="./demos/demo2.tsx"/>

## Hooks

### useCollectionManager()

与 `<CollectionManagerProvider/>` 搭配使用

```jsx | pure
const { collections, get } = useCollectionManager();
```

### useCollection()

与 `<CollectionProvider/>` 搭配使用

```jsx | pure
const { name, fields, getField, findField, resource } = useCollection();
```

### useCollectionField()

与 `<CollectionFieldProvider/>` 搭配使用

```jsx | pure
const { name, uiSchema, resource } = useCollectionField();
```

resource 需要与 `<RecordProvider/>` 搭配使用，用于提供当前数据表行记录的上下文。如：

<code src="./demos/demo3.tsx"/>
<code src="./demos/demo4.tsx"/>
