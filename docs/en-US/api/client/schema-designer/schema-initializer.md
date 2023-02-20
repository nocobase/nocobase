# SchemaInitializer

Used for the initialization of various schemas. Newly added schema can be inserted anywhere in an existing schema node, including:

```ts
{
  properties: {
    // beforeBegin - Insert in front of the current node
    node1: {
      properties: {
        // afterBegin - Insert in front of the first child node of the current node
        // ...
        // beforeEnd - After the last child node of the current node
      },
    },
    // afterEnd - After the current node
  },
}
```

The core of SchemaInitializer includes `<SchemaInitializer.Button />` and `<SchemaInitializer.Item />` the two components. `<SchemaInitializer.Button />` is used to create the dropdown menu button of schema, and the options of the dropdown menu is `<SchemaInitializer.Item/>`.

### `<SchemaInitializerProvider />`

### `<SchemaInitializer.Button />`

### `<SchemaInitializer.Item/>`
