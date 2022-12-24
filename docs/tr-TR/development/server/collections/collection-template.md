# Collection templates

<Alert>
📢 Collection templates are scheduled to be available in Q4 2022.
</Alert>

In real business scenarios, different collections may have their own initialization rules and business logic, and NocoBase addresses such issues by providing collection templates.

## General collections

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ],
});
```

## Tree structure collections

```ts
db.collection({
  name: 'categories',
  tree: 'adjacency-list',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'string',
      name: 'description',
    },
    {
      type: 'belongsTo',
      name: 'parent',
      target: 'categories',
      foreignKey: 'parentId',
    },
    {
      type: 'hasMany',
      name: 'children',
      target: 'categories',
      foreignKey: 'parentId',
    },
  ],
});
```

## Parent-child inheritance collections

```ts
db.collection({
  name: 'a',
  fields: [
    
  ],
});

db.collection({
  name: 'b',
  inherits: 'a',
  fields: [
    
  ],
});
```

## More templates

As in the case of calendar collections, each initialized collection needs to be initialized with special cron and exclude fields, and the definition of such fields is done by the template

```ts
db.collection({
  name: 'events',
  template: 'calendar',
});
```
