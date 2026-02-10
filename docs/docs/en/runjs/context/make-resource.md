# ctx.makeResource()

Create a **new** resource instance and return it, **without** modifying `ctx.resource`. Use when you need multiple independent resources or a temporary resource.

## Type

```ts
makeResource<T = FlowResource>(resourceType: ResourceType<T>): T;
```

- `resourceType`: resource type, a class name string or constructor, e.g. `'MultiRecordResource'`, `'SingleRecordResource'`, `'SQLResource'`, `'APIResource'`.
- Return: the newly created resource instance.

## Example

```js
// Create a list resource without changing ctx.resource
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();

// ctx.resource remains unchanged (if any)
const current = ctx.resource;
```

Difference from `initResource`: `makeResource` only creates a new instance; `initResource` initializes and binds to context when `ctx.resource` is missing.

See detailed APIs for each Resource type:

- [MultiRecordResource](/runjs/resource/multi-record-resource) - multiple records / list
- [SingleRecordResource](/runjs/resource/single-record-resource) - single record
- [APIResource](/runjs/resource/api-resource) - generic API resource
- [SQLResource](/runjs/resource/sql-resource) - SQL query resource
