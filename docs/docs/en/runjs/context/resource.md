# ctx.resource

The **resource** instance (FlowResource) in the current context, used to access and operate on data.

- It may be pre-bound by the block/modal runtime.
- If no resource exists in the context, call `ctx.initResource(type)` first, then use `ctx.resource`.

Common usage:

```js
// Ensure resource exists (create by type if needed)
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

Common methods (depend on resource type): `getData()`, `setData(value)`, `refresh()`, `setResourceName(name)`, `setFilterByTk(tk)`, `runAction(actionName, params)`, and `on`/`off` event subscriptions.

See detailed APIs for each Resource type:

- [MultiRecordResource](/runjs/resource/multi-record-resource) - multiple records / list
- [SingleRecordResource](/runjs/resource/single-record-resource) - single record
- [APIResource](/runjs/resource/api-resource) - generic API resource
- [SQLResource](/runjs/resource/sql-resource) - SQL query resource
