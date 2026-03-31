# ctx.getVar()

**Asynchronously** reads a variable from the current runtime context. Variable sources are the same as for SQL and template `{{ctx.xxx}}`: current user, current record, view params, popup context, etc.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock / JSField** | Get current record, user, resource, etc. for rendering or logic |
| **Linkage / event flow** | Read `ctx.record`, `ctx.formValues`, etc. for conditions |
| **Formulas / templates** | Same variable resolution as `{{ctx.xxx}}` |

## Type

```ts
getVar(path: string): Promise<any>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | Variable path; **must start with `ctx.`**; supports dot and array index |

**Returns**: `Promise<any>`; use `await` to get the resolved value. Returns `undefined` if the variable does not exist.

> If the path does not start with `ctx.`, an error is thrown: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Common paths

| Path | Description |
|------|-------------|
| `ctx.record` | Current record (when form/detail is bound to a record) |
| `ctx.record.id` | Current record primary key |
| `ctx.formValues` | Current form values (common in linkage/event flow; in form context prefer `ctx.form.getFieldsValue()` for live values) |
| `ctx.user` | Current user |
| `ctx.user.id` | Current user id |
| `ctx.user.nickname` | Current user nickname |
| `ctx.user.roles.name` | Current user role names (array) |
| `ctx.popup.record` | Record in popup |
| `ctx.popup.record.id` | Popup record primary key |
| `ctx.urlSearchParams` | URL query params (from `?key=value`) |
| `ctx.token` | Current API token |
| `ctx.role` | Current role |

## ctx.getVarInfos()

Returns **structure info** (type, title, child properties, etc.) for variables that can be resolved in the current context. Useful to discover available paths. Values are static meta, not runtime values.

### Type

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

Each key in the result is a variable path; each value is that path’s structure (e.g. `type`, `title`, `properties`).

### Options

| Option | Type | Description |
|--------|------|-------------|
| `path` | `string \| string[]` | Limit to paths under this; e.g. `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; array = multiple paths merged |
| `maxDepth` | `number` | Max depth to expand; default `3`. Without path, top-level depth=1; with path, that node depth=1 |

### Example

```ts
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

const vars = await ctx.getVarInfos();
```

## Relation to ctx.getValue

| Method | Context | Description |
|--------|---------|-------------|
| `ctx.getValue()` | JSField, JSItem, etc. | Sync; **current field** value; requires form binding |
| `ctx.getVar(path)` | Any RunJS | Async; **any ctx variable**; path must start with `ctx.` |

In JSField, use getValue/setValue for the field; use getVar for other context (record, user, formValues).

## Notes

- **Path must start with `ctx.`**: e.g. `ctx.record.id`; otherwise an error is thrown.
- **Async**: Use `await`, e.g. `const id = await ctx.getVar('ctx.record.id')`.
- **Missing variable**: Returns `undefined`; use `??` for default: `(await ctx.getVar('ctx.user.nickname')) ?? 'Guest'`.
- **Form values**: Get via `await ctx.getVar('ctx.formValues')`; not exposed as `ctx.formValues`. In form context prefer `ctx.form.getFieldsValue()` for latest values.

## Examples

### Current record id

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Current record: ${recordId}`);
}
```

### Popup record

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Popup record: ${recordId}`);
}
```

### Array field items

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// e.g. ['admin', 'member']
```

### Default value

```ts
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Guest';
```

### Form field value

```ts
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### URL query params

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // ?id=xxx
```

### Explore variables

```ts
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// e.g. { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Related

- [ctx.getValue()](./get-value.md): sync current field value (JSField/JSItem only)
- [ctx.form](./form.md): form instance; `ctx.form.getFieldsValue()` for live form values
- [ctx.model](./model.md): current model
- [ctx.blockModel](./block-model.md): parent block
- [ctx.resource](./resource.md): resource in current context
- SQL / template `{{ctx.xxx}}`: same resolution as `ctx.getVar('ctx.xxx')`
