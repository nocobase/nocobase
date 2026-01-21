# Meta

## Register Meta Enabled Properties

Use this snippet to register meta enabled properties.

```ts
ctx.defineProperty('user', {
  get: () => ({
    id: 1,
    username: 'admin',
    roles: [
      { name: 'root', title: 'Super Admin' },
      { name: 'admin', title: 'Admin' },
    ],
  }),
  meta: {
    type: 'object',
    title: 'User',
    properties: {
      id: { type: 'number', title: 'ID' },
      username: { type: 'string', title: 'Username' },
      roles: {
        type: 'array',
        title: 'Roles',
        properties: {
          name: { type: 'string', title: 'Name' },
          title: { type: 'string', title: 'Title' },
        },
      },
    },
  },
});

ctx.defineProperty('record', {
  get: () => ({
    id: 42,
    title: 'Flow task',
  }),
  meta: {
    type: 'object',
    title: 'Record',
    properties: {
      id: { type: 'number', title: 'ID' },
      title: { type: 'string', title: 'Title' },
    },
  },
});
```

## Get Meta Tree

Use this snippet to get meta tree.

```ts
return ctx.getPropertyMetaTree();
```
