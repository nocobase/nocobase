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

If there is no collection parameter passed in, get the collection from CollectionManagerProvider with the corresponding name.

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

If there is no field parameter passed in, get the field from CollectionProvider with the corresponding name.


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

Universal field component that needs to be used with `<CollectionProvider/>`, but only in schema scenarios. Get the field schema from CollectionProvider with the corresponding name. Extend the configuration via the schema where the CollectionField is located.

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

## Hooks

### useCollectionManager()

Use with `<CollectionManagerProvider/>`.

```jsx | pure
const { collections, get } = useCollectionManager();
```

### useCollection()

Use with `<CollectionProvider/>`.

```jsx | pure
const { name, fields, getField, findField, resource } = useCollection();
```

### useCollectionField()

Use with `<CollectionFieldProvider/>`.

```jsx | pure
const { name, uiSchema, resource } = useCollectionField();
```

The resource needs to be used with `<RecordProvider/>` to provide context of the record of the current data table row.

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

If there is no collection parameter passed in, get the collection from CollectionManagerProvider with the corresponding name.

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

If there is no field parameter passed in, get the field from CollectionProvider with the corresponding name.

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

Universal field component that needs to be used with `<CollectionProvider/>`, but only in schema scenarios. Get the field schema from CollectionProvider with the corresponding name. Extend the configuration via the schema where the CollectionField is located.

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

## Hooks

### useCollectionManager()

Use with `<CollectionManagerProvider/>`.

```jsx | pure
const { collections, get } = useCollectionManager();
```

### useCollection()

Use with `<CollectionProvider/>`.

```jsx | pure
const { name, fields, getField, findField, resource } = useCollection();
```

### useCollectionField()

Use with `<CollectionFieldProvider/>`.

```jsx | pure
const { name, uiSchema, resource } = useCollectionField();
```

The resource needs to be used with `<RecordProvider/>` to provide context of the record of the current data table row.
