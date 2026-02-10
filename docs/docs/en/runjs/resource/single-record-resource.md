# SingleRecordResource

A resource for **single records**. Data is a single object and supports fetching by primary key, create/update (save), and delete. Suitable for details and forms.

Inheritance: FlowResource -> APIResource -> BaseRecordResource -> SingleRecordResource. It provides the request capability of [APIResource](/runjs/resource/api-resource) and extends resource name, primary key, and save/destroy.

Creation: `ctx.makeResource('SingleRecordResource')` or `ctx.initResource('SingleRecordResource')`. Call `setResourceName('collection')`; use `setFilterByTk(id)` for PK-based operations.

---

## Resource name and primary key

| Method | Description |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Resource name, e.g. `'users'`, `'users.profile'` |
| `setSourceId(id)` / `getSourceId()` | Parent record ID for related resources |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Data source key |
| `setFilterByTk(tk)` / `getFilterByTk()` | Current record PK; sets `isNewRecord` to false |

---

## State

| Property/Method | Description |
|----------|------|
| `isNewRecord` | Whether this is a new record (true when no filterByTk is set or newly created) |

---

## Request parameters (filter / fields)

| Method | Description |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filter (usable when not new) |
| `setFields(fields)` / `getFields()` | Requested fields |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Association expansion |

---

## CRUD

| Method | Description |
|------|------|
| `refresh()` | Request get by current `filterByTk`, update `getData()`; no request if new |
| `save(data, options?)` | Create when new, otherwise update; optional `{ refresh: false }` |
| `destroy(options?)` | Delete by current `filterByTk`, and clear local data |
| `runAction(actionName, options)` | Call any resource action |

---

## Configuration and events

| Method | Description |
|------|------|
| `setSaveActionOptions(options)` | Request config for save |
| `on('refresh', fn)` / `on('saved', fn)` | Triggered on refresh complete, after save |

---

## Example

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Update
await ctx.resource.save({ name: 'Bob' });

// Create: no filterByTk
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Charlie' });
```
