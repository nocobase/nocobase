# ctx.makeResource()

Create a **new resource instance** and return it, **without** writing or changing `ctx.resource`. Use this when you need multiple independent resources or temporary ones inside a single script.

## Signature

```ts
makeResource<T = FlowResource>(resourceType: ResourceType<T>): T;
```

- `resourceType`: resource type, can be a string class name or constructor, for example:
  - `'MultiRecordResource'`
  - `'SingleRecordResource'`
  - `'SQLResource'`
  - `'APIResource'`
- Returns: a newly created resource instance.

## Typical usage

```ts
// Create a separate list resource without touching ctx.resource
const listRes = ctx.makeResource('MultiRecordResource');

listRes.setResourceName('users');
await listRes.refresh();

const rows = listRes.getData();

// ctx.resource remains whatever it was before (if any)
const current = ctx.resource;
```

Common scenarios:

- Use `ctx.resource` for the main block data, and an extra resource from `ctx.makeResource()` for:
  - Dialogs / side panels that load additional data
  - Auxiliary lookups (e.g. loading options, statistics)
  - One‑off SQL or API resources

## Difference vs `ctx.initResource()`

- `ctx.makeResource(type)`:
  - Always creates a **new** resource instance
  - Does **not** modify `ctx.resource`
- `ctx.initResource(type)`:
  - Ensures there is a resource bound to `ctx.resource`
  - Creates it only when missing

See also the resource type docs:

- [MultiRecordResource](../../resource/multi-record-resource/index.md)
- [SingleRecordResource](../../resource/single-record-resource/index.md)
- [APIResource](../../resource/api-resource/index.md)
- [SQLResource](../../resource/sql-resource/index.md)