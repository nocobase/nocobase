# Examples

## Create Multi Record Resource

```ts
const resource = ctx.createResource('MultiRecordResource');
resource.setCollection('users');
await resource.list();
```
