# ctx.initResource()

**Initialize** the resource in the current context: if `ctx.resource` does not exist, create it with the specified type and bind it; if it already exists, reuse it. You can then access it via `ctx.resource`.

## Type

```ts
initResource(type: ResourceType): FlowResource;
```

- `type`: resource type, commonly `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'`.
- Return: the resource instance in the current context (`ctx.resource`).

## Example

```js
// Ensure ctx.resource exists; create it by type if not
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

Difference from `makeResource`: `initResource` ensures and may set `ctx.resource`; `makeResource` only creates a new instance and does not change `ctx.resource`.

See detailed APIs for each Resource type:

- [MultiRecordResource](/runjs/resource/multi-record-resource)
- [SingleRecordResource](/runjs/resource/single-record-resource)
- [APIResource](/runjs/resource/api-resource)
- [SQLResource](/runjs/resource/sql-resource)
