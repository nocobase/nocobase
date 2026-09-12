# ctx.getVar()

Asynchronously reads variable values from the current runtime context. Variable resolution is consistent with `{{ctx.xxx}}` in SQL and templates, typically originating from the current user, current record, view parameters, popup context, etc.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock / JSField** | Get information about the current record, user, resource, etc., for rendering or logic. |
| **Linkage Rules / FlowEngine** | Read `ctx.record`, `ctx.formValues`, etc., for conditional logic. |
| **Formulas / Templates** | Uses the same variable resolution rules as `{{ctx.xxx}}`. |

## Type Definition

```ts
getVar(path: string): Promise<any>;
```

| Parameter | Type | Description |
|------|------|------|
| `path` | `string` | Variable path; **must start with `ctx.`**. Supports dot notation and array indices. |

**Return Value**: `Promise<any>`. Use `await` to get the resolved value; returns `undefined` if the variable does not exist.

> If a path that does not start with `ctx.` is passed, an error will be thrown: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Common Variable Paths

| Path | Description |
|------|------|
| `ctx.record` | Current record (available when a form/details block is bound to a record) |
| `ctx.record.id` | Current record primary key |
| `ctx.formValues` | Current form values (commonly used in linkage rules and FlowEngine; in form scenarios, prefer `ctx.form.getFieldsValue()` for real-time reading) |
| `ctx.user` | Current logged-in user |
| `ctx.user.id` | Current user ID |
| `ctx.user.nickname` | Current user nickname |
| `ctx.user.roles.name` | Current user role names (array) |
| `ctx.popup.record` | Record within a popup |
| `ctx.popup.record.id` | Primary key of the record within a popup |
| `ctx.urlSearchParams` | URL query parameters (parsed from `?key=value`) |
| `ctx.token` | Current API Token |
| `ctx.role` | Current role |

## ctx.getVarInfos()

Gets the **structural information** (type, title, sub-properties, etc.) of resolvable variables in the current context, making it easier to explore available paths. The return value is a static description based on `meta` and does not include actual runtime values.

### Type Definition

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

In the return value, each key is a variable path, and the value is the structural information for that path (including `type`, `title`, `properties`, etc.).

### Parameters

| Parameter | Type | Description |
|------|------|------|
| `path` | `string \| string[]` | Truncation path; only collects the variable structure under this path. Supports `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; an array represents the merging of multiple paths. |
| `maxDepth` | `number` | Maximum expansion depth, default is `3`. When `path` is not provided, top-level properties have `depth=1`. When `path` is provided, the node corresponding to the path has `depth=1`. |

### Example

```ts
// Get the variable structure under record (expanded up to 3 levels)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Get the structure of popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Get the complete top-level variable structure (default maxDepth=3)
const vars = await ctx.getVarInfos();
```

## Difference from ctx.getValue

| Method | Scenario | Description |
|------|----------|------|
| `ctx.getValue()` | Editable fields like JSField or JSItem | Synchronously gets the value of the **current field**; requires form binding. |
| `ctx.getVar(path)` | Any RunJS context | Asynchronously gets **any ctx variable**; path must start with `ctx.`. |

In a JSField, use `getValue`/`setValue` to read/write the current field; use `getVar` to access other context variables (such as `record`, `user`, `formValues`).

## Notes

- **Path must start with `ctx.`**: e.g., `ctx.record.id`, otherwise an error will be thrown.
- **Asynchronous method**: You must use `await` to get the result, e.g., `const id = await ctx.getVar('ctx.record.id')`.
- **Variable does not exist**: Returns `undefined`. You can use `??` after the result to set a default value: `(await ctx.getVar('ctx.user.nickname')) ?? 'Guest'`.
- **Form values**: `ctx.formValues` must be retrieved via `await ctx.getVar('ctx.formValues')`; it is not directly exposed as `ctx.formValues`. In a form context, prefer using `ctx.form.getFieldsValue()` to read the latest values in real-time.

## Examples

### Get Current Record ID

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Current record: ${recordId}`);
}
```

### Get Record Within a Popup

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Current popup record: ${recordId}`);
}
```

### Read Sub-items of an Array Field

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Returns an array of role names, e.g., ['admin', 'member']
```

### Set Default Value

```ts
// getVar does not have a defaultValue parameter; use ?? after the result
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Guest';
```

### Read Form Field Values

```ts
// Both ctx.formValues and ctx.form are for form scenarios; use getVar to read nested fields
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### Read URL Query Parameters

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // Corresponds to ?id=xxx
```

### Explore Available Variables

```ts
// Get the variable structure under record (expanded up to 3 levels)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars looks like { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Related

- [ctx.getValue()](./get-value.md) - Synchronously gets the current field value (JSField/JSItem only)
- [ctx.form](./form.md) - Form instance; `ctx.form.getFieldsValue()` can read form values in real-time
- [ctx.model](./model.md) - The model where the current execution context resides
- [ctx.blockModel](./block-model.md) - The parent block where the current JS is located
- [ctx.resource](./resource.md) - The resource instance in the current context
- `{{ctx.xxx}}` in SQL / Templates - Uses the same resolution rules as `ctx.getVar('ctx.xxx')`