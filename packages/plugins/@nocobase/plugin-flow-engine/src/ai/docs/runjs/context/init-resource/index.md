# ctx.initResource()

Initialize the **current context resource**. If `ctx.resource` does not exist yet, this will create one of the given type and bind it to the context; if it already exists, it simply returns the existing instance.

After calling this, you can use `ctx.resource` in your script.

## Signature

```ts
initResource(type: ResourceType): FlowResource;
```

- `type`: resource type, usually one of:
  - `'APIResource'`
  - `'SingleRecordResource'`
  - `'MultiRecordResource'`
  - `'SQLResource'`
- Returns: the resource instance in the current context (i.e. `ctx.resource`).

## Typical usage

```ts
// Ensure there is a list resource for the current context
ctx.initResource('MultiRecordResource');

ctx.resource.setResourceName('users');
await ctx.resource.refresh();

const rows = ctx.resource.getData();
```

This is especially useful in:

- JS blocks attached to blocks that **do not** pre‑bind a resource
- Generic scripts where you want a predictable `ctx.resource` without worrying about prior state

## Difference vs `ctx.makeResource()`

- `ctx.initResource(type)`:
  - Ensures there is a resource bound to `ctx.resource`
  - May create a new instance if none exists yet
  - Always returns the context‑bound resource
- `ctx.makeResource(type)`:
  - Always creates a **new** resource instance
  - **Does not** modify `ctx.resource`

See also the resource type docs:

- [MultiRecordResource](../../resource/multi-record-resource/index.md)
- [SingleRecordResource](../../resource/single-record-resource/index.md)
- [APIResource](../../resource/api-resource/index.md)
- [SQLResource](../../resource/sql-resource/index.md)
