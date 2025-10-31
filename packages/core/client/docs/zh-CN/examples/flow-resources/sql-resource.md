# SQLResource

```ts
const resource = new SQLResource();

resource.setFilterByTk(`${ctx.model.uid}-selectUser`);
resource.addFilterGroup(ctx.model.uid, { id: 1 });
resource.setSQL('select * from users');
resource.setSQLType('selectRow');
resource.save();

await resource.refresh();
```