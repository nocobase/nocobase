# SingleRecordResource

A Resource oriented towards a **single record**: data is a single object, supporting retrieval by primary key, creation/updating (save), and deletion. It is suitable for "single record" scenarios such as details and forms. Unlike [MultiRecordResource](./multi-record-resource.md), the `getData()` method of `SingleRecordResource` returns a single object. You specify the primary key via `setFilterByTk(id)`, and `save()` will automatically call `create` or `update` based on the `isNewRecord` state.

**Inheritance**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Creation**: `ctx.makeResource('SingleRecordResource')` or `ctx.initResource('SingleRecordResource')`. You must call `setResourceName('collectionName')` before use. When performing operations by primary key, call `setFilterByTk(id)`. In RunJS, `ctx.api` is injected by the runtime environment.

---

## Use Scenarios

| Scenario | Description |
|------|------|
| **Details Block** | The Details block uses `SingleRecordResource` by default to load a single record by its primary key. |
| **Form Block** | Create/Edit forms use `SingleRecordResource`, where `save()` automatically distinguishes between `create` and `update`. |
| **JSBlock Details** | Load a single user, order, etc., in a JSBlock and customize the display. |
| **Association Resources** | Load associated single records using the format `users.profile`, requiring `setSourceId(parentRecordID)`. |

---

## Data Format

- `getData()` returns a **single record object**, which corresponds to the `data` field of the `get` API response.
- `getMeta()` returns metadata (if available).

---

## Resource Name and Primary Key

| Method | Description |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Resource name, e.g., `'users'`, `'users.profile'` (association resource). |
| `setSourceId(id)` / `getSourceId()` | The parent record ID for association resources (e.g., `users.profile` requires the primary key of the `users` record). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Data source identifier (used in multi-data source environments). |
| `setFilterByTk(tk)` / `getFilterByTk()` | The primary key of the current record; once set, `isNewRecord` becomes `false`. |

---

## State

| Property/Method | Description |
|----------|------|
| `isNewRecord` | Whether it is in a "New" state (true if `filterByTk` is not set or if it was just created). |

---

## Request Parameters (Filter / Fields)

| Method | Description |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filter (available when not in "New" state). |
| `setFields(fields)` / `getFields()` | Requested fields. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Association loading (appends). |

---

## CRUD

| Method | Description |
|------|------|
| `refresh()` | Requests `get` based on the current `filterByTk` and updates `getData()`; does nothing in "New" state. |
| `save(data, options?)` | Calls `create` when in "New" state, otherwise calls `update`; optional `{ refresh: false }` prevents automatic refreshing. |
| `destroy(options?)` | Deletes the record based on the current `filterByTk` and clears local data. |
| `runAction(actionName, options)` | Calls any resource action. |

---

## Configuration and Events

| Method | Description |
|------|------|
| `setSaveActionOptions(options)` | Request configuration for the `save` action. |
| `on('refresh', fn)` / `on('saved', fn)` | Triggered after refresh is complete or after saving. |

---

## Examples

### Basic Retrieval and Update

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Update
await ctx.resource.save({ name: 'John Doe' });
```

### Create New Record

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Jane Smith', email: 'janesmith@example.com' });
```

### Delete Record

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// After destroy, getData() returns null
```

### Association Loading and Fields

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Association Resources (e.g., users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Parent record primary key
res.setFilterByTk(profileId);    // filterByTk can be omitted if profile is a hasOne relationship
await res.refresh();
const profile = res.getData();
```

### Save Without Auto-Refresh

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// getData() retains the old value as refresh is not triggered after saving
```

### Listening to refresh / saved Events

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>User: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Saved successfully');
});
await ctx.resource?.refresh?.();
```

---

## Notes

- **setResourceName is Required**: You must call `setResourceName('collectionName')` before use, otherwise the request URL cannot be constructed.
- **filterByTk and isNewRecord**: If `setFilterByTk` is not called, `isNewRecord` is `true`, and `refresh()` will not initiate a request; `save()` will execute a `create` action.
- **Association Resources**: When the resource name is in `parent.child` format (e.g., `users.profile`), you must call `setSourceId(parentPrimaryKey)` first.
- **getData Returns an Object**: The `data` returned by single-record APIs is a record object; `getData()` returns this object directly. It becomes `null` after `destroy()`.

---

## Related

- [ctx.resource](../context/resource.md) - The resource instance in the current context
- [ctx.initResource()](../context/init-resource.md) - Initialize and bind to `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Create a new resource instance without binding
- [APIResource](./api-resource.md) - General API resource requested by URL
- [MultiRecordResource](./multi-record-resource.md) - Oriented towards collections/lists, supporting CRUD and pagination