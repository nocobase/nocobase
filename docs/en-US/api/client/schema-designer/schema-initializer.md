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
