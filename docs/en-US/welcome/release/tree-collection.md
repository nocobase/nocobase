# Tree collection

## Collection options

```ts
{
  name: 'categories',
  tree: 'adjacency-list',
  fields: [
    {
      type: 'belongsTo',
      name: 'parent',
      treeParent: true,
    },
    {
      type: 'hasMany',
      name: 'children',
      treeChildren: true,
    },
  ],
}
```

## UI

### Create tree collection

<img src="./tree-collection/tree-collection.jpg">


### Default fields

<img src="./tree-collection/init.jpg">

### Table block

<img src="./tree-collection/tree-table.jpg">

### Add child

<img src="./tree-collection/add-child.jpg">

### Expend/Collapse

<img src="./tree-collection/expend-collapse.jpg">
