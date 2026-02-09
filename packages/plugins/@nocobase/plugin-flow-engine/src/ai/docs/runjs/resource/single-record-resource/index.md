# SingleRecordResource

Resource for **a single record**. Its data shape is an object (not an array). It supports reading by primary key, creating/updating via `save`, and deleting via `destroy`. Commonly used in detail / form blocks and similar “single record” scenarios.

Inheritance: `FlowResource → APIResource → BaseRecordResource → SingleRecordResource`. It has all [APIResource](../api-resource/index.md) capabilities, plus helpers for resource name, primary key and `save` / `destroy`.

Create it via `ctx.makeResource('SingleRecordResource')` or `ctx.initResource('SingleRecordResource')`. Before use, call `setResourceName('collection')`, and for existing records set `setFilterByTk(id)`.

## Resource name and primary key

- `setResourceName(name)` / `getResourceName()` – resource name, e.g. `'users'`, `'users.profile'`
- `setSourceId(id)` / `getSourceId()` – parent record id when working with associated resources
- `setDataSourceKey(key)` / `getDataSourceKey()` – data source identifier
- `setFilterByTk(tk)` / `getFilterByTk()` – current primary key; once set, `isNewRecord` becomes `false`

## State

- `isNewRecord` – whether this resource is in “create” state
  - `true` when no `filterByTk` is set, or when created as a new record
  - `false` after `setFilterByTk()` for an existing record

## Request parameters (filter / fields)

- `setFilter(filter)` / `getFilter()` – extra filter for the current record (non‑new state)
- `setFields(fields)` / `getFields()` – requested fields
- `setAppends(appends)` / `getAppends()` / `addAppends()` / `removeAppends()` – relations to be expanded

Use these to control what data is loaded into `getData()`.

## CRUD

- `refresh()` – perform a `get` request using current `filterByTk`, then update `getData()`. Does nothing when `isNewRecord === true`
- `save(data, options?)` – create when `isNewRecord`, otherwise update. Options support `{ refresh?: boolean }` (default `true`)
- `destroy(options?)` – delete the current record by `filterByTk`, and clear local data
- `runAction(actionName, options)` – call any underlying resource action

## Configuration and events

- `setSaveActionOptions(options)` – configure request options used by `save`
- `on('refresh', fn)` – called after `refresh` finishes
- `on('saved', fn)` – called after `save` completes

## Example

```ts
// Existing record
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Update
await ctx.resource.save({ name: 'Li Si' });

// New record: do not set filterByTk, just save
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Wang Wu' });
```