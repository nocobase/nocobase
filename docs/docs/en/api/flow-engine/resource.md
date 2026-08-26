---
title: "Resource API"
description: "NocoBase FlowEngine Resource API reference: complete method signatures, parameter formats, and filter syntax for MultiRecordResource and SingleRecordResource."
keywords: "Resource,MultiRecordResource,SingleRecordResource,FlowResource,CRUD,filter,NocoBase"
---

# Resource API

NocoBase FlowEngine provides two Resource classes for handling frontend data operations — `MultiRecordResource` for lists/tables (multiple records) and `SingleRecordResource` for forms/details (single record). They encapsulate REST API calls and provide reactive data management.

Inheritance chain: `FlowResource` → `APIResource` → `BaseRecordResource` → `MultiRecordResource` / `SingleRecordResource`

## MultiRecordResource

Used for lists, tables, kanban boards, and other multi-record scenarios. Import from `@nocobase/flow-engine`.

### Data Operations

| Method | Parameters | Description |
|------|------|------|
| `getData()` | - | Returns `TDataItem[]`, initial value is `[]` |
| `hasData()` | - | Whether the data array is non-empty |
| `create(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Create a record, automatically refreshes after creation by default |
| `get(filterByTk)` | `filterByTk: string \| number` | Get a single record by primary key |
| `update(filterByTk, data, options?)` | `filterByTk: string \| number`, `data: object` | Update a record, automatically refreshes after completion |
| `destroy(filterByTk, options?)` | `filterByTk: string \| number \| Array` | Delete records, supports batch deletion |
| `destroySelectedRows()` | - | Delete all selected rows |
| `refresh()` | - | Refresh data (calls the `list` action), multiple calls within the same event loop are merged |

### Pagination

| Method | Description |
|------|------|
| `getPage()` | Get current page number |
| `setPage(page)` | Set page number |
| `getPageSize()` | Get page size (default 20) |
| `setPageSize(pageSize)` | Set page size |
| `getCount()` | Get total record count |
| `getTotalPage()` | Get total number of pages |
| `next()` | Go to next page and refresh |
| `previous()` | Go to previous page and refresh |
| `goto(page)` | Jump to a specific page and refresh |

### Selected Rows

| Method | Description |
|------|------|
| `setSelectedRows(rows)` | Set selected rows |
| `getSelectedRows()` | Get selected rows |

### Example: Using in CollectionBlockModel

When extending `CollectionBlockModel`, you need to create a resource via `createResource()`, then read data in `renderComponent()`:

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class ManyRecordBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  // Declare the use of MultiRecordResource for data management
  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData();   // TDataItem[]
    const count = this.resource.getCount(); // Total record count

    return (
      <div>
        <h3>Total {count} records (Page {this.resource.getPage()})</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records block'),
});
```

See the full example at [FlowEngine → Block Extensions](../../plugin-development/client/flow-engine/block.md).

### Example: Calling CRUD in Action Buttons

In an `ActionModel`'s `registerFlow` handler, access the current block's resource via `ctx.blockModel?.resource` to call CRUD methods:

```tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps = {
    type: 'primary',
    children: tExpr('New todo'),
  };
}

NewTodoActionModel.define({
  label: tExpr('New todo'),
});

NewTodoActionModel.registerFlow({
  key: 'newTodoFlow',
  title: tExpr('New todo'),
  on: 'click',
  steps: {
    openForm: {
      async handler(ctx) {
        // Get the current block's resource
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        ctx.viewer.dialog({
          title: ctx.t('New todo'),
          content: (view) => (
            <MyForm
              onSubmit={async (values) => {
                // Create a record; resource will automatically refresh after creation
                await resource.create(values);
                ctx.message.success(ctx.t('Created successfully'));
                view.close();
              }}
              onCancel={() => view.close()}
            />
          ),
        });
      },
    },
  },
});
```

See the full example at [Building a Full-Stack Data Management Plugin](../../plugin-development/client/examples/fullstack-plugin.md).

### Example: CRUD Operations Quick Reference

```ts
async handler(ctx) {
  const resource = ctx.blockModel?.resource as MultiRecordResource;

  // --- Create ---
  await resource.create({ title: 'New item', completed: false });
  // Without auto-refresh
  await resource.create({ title: 'Draft' }, { refresh: false });

  // --- Read ---
  const items = resource.getData();     // TDataItem[]
  const count = resource.getCount();    // Total record count
  const item = await resource.get(1);   // Get a single record by primary key

  // --- Update ---
  await resource.update(1, { title: 'Updated' });

  // --- Delete ---
  await resource.destroy(1);            // Delete a single record
  await resource.destroy([1, 2, 3]);    // Batch delete

  // --- Pagination ---
  resource.setPage(2);
  resource.setPageSize(50);
  await resource.refresh();
  // Or use shortcut methods
  await resource.goto(3);
  await resource.next();
  await resource.previous();

  // --- Refresh ---
  await resource.refresh();
}
```

## SingleRecordResource

Used for forms, detail pages, and other single-record scenarios. Import from `@nocobase/flow-engine`.

### Data Operations

| Method | Parameters | Description |
|------|------|------|
| `getData()` | - | Returns `TData` (single object), initial value is `null` |
| `save(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Smart save — calls create when `isNewRecord` is true, otherwise calls update |
| `destroy(options?)` | - | Delete the current record (uses the previously set filterByTk) |
| `refresh()` | - | Refresh data (calls the `get` action), skipped when `isNewRecord` is true |

### Key Properties

| Property | Description |
|------|------|
| `isNewRecord` | Indicates whether this is a new record. `setFilterByTk()` automatically sets it to `false` |

### Example: Form Detail Scenario

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { SingleRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DetailBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.one;

  createResource() {
    return this.context.makeResource(SingleRecordResource);
  }

  get resource() {
    return this.context.resource as SingleRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData(); // Single object or null
    if (!data) return <div>Loading...</div>;

    return (
      <div>
        <h3>{data.title}</h3>
        <p>{data.content}</p>
      </div>
    );
  }
}

DetailBlockModel.define({
  label: tExpr('Detail block'),
});
```

### Example: Creating and Editing Records

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource as SingleRecordResource;

  // --- Create a new record ---
  resource.isNewRecord = true;
  await resource.save({ name: 'John', age: 30 });
  // save internally calls the create action, automatically refreshes after completion

  // --- Edit an existing record ---
  resource.setFilterByTk(1);  // Automatically sets isNewRecord = false
  await resource.refresh();   // Load current data first
  const data = resource.getData();
  await resource.save({ ...data, name: 'Jane' });
  // save internally calls the update action

  // --- Delete the current record ---
  await resource.destroy();   // Uses the previously set filterByTk
}
```

## Common Methods

The following methods are available on both `MultiRecordResource` and `SingleRecordResource`:

### Filtering

| Method | Description |
|------|------|
| `setFilter(filter)` | Directly set the filter object |
| `addFilterGroup(key, filter)` | Add a named filter group (recommended, composable and removable) |
| `removeFilterGroup(key)` | Remove a named filter group |
| `getFilter()` | Get the aggregated filter; multiple groups are automatically combined with `$and` |

### Field Control

| Method | Description |
|------|------|
| `setFields(fields)` | Set the fields to return |
| `setAppends(appends)` | Set appends for association fields |
| `addAppends(appends)` | Append to appends (deduplicated) |
| `setSort(sort)` | Set sorting, e.g., `['-createdAt', 'name']` |
| `setFilterByTk(value)` | Set filter by primary key |

### Resource Configuration

| Method | Description |
|------|------|
| `setResourceName(name)` | Set the resource name, e.g., `'users'` or association resource `'users.tags'` |
| `setSourceId(id)` | Set the parent record ID for association resources |
| `setDataSourceKey(key)` | Set the data source (adds the `X-Data-Source` request header) |

### Metadata and State

| Method | Description |
|------|------|
| `getMeta(key?)` | Get metadata; returns the entire meta object if no key is provided |
| `loading` | Whether data is currently loading (getter) |
| `getError()` | Get error information |
| `clearError()` | Clear errors |

### Events

| Event | Triggered When |
|------|----------|
| `'refresh'` | After `refresh()` successfully fetches data |
| `'saved'` | After a `create` / `update` / `save` operation succeeds |

```ts
resource.on('saved', (data) => {
  console.log('Record saved:', data);
});
```

## Filter Syntax

NocoBase uses a JSON-style filter syntax where operators are prefixed with `$`:

```ts
// Equal to
{ status: { $eq: 'active' } }

// Not equal to
{ status: { $ne: 'deleted' } }

// Greater than
{ age: { $gt: 18 } }

// Contains (fuzzy match)
{ name: { $includes: 'test' } }

// Combined conditions
{
  $and: [
    { status: { $eq: 'active' } },
    { age: { $gt: 18 } },
  ]
}

// OR conditions
{
  $or: [
    { status: { $eq: 'active' } },
    { role: { $eq: 'admin' } },
  ]
}
```

It is recommended to use `addFilterGroup` to manage filter conditions on Resources:

```ts
// Add multiple filter groups
resource.addFilterGroup('status', { status: { $eq: 'active' } });
resource.addFilterGroup('age', { age: { $gt: 18 } });
// getFilter() automatically aggregates to: { $and: [...] }

// Remove a filter group
resource.removeFilterGroup('status');

// Refresh to apply filters
await resource.refresh();
```

## MultiRecordResource vs SingleRecordResource Comparison

| Feature | MultiRecordResource | SingleRecordResource |
|------|-------|-------|
| getData() returns | `TDataItem[]` (array) | `TData` (single object) |
| Default refresh action | `list` | `get` |
| Pagination | Supported | Not supported |
| Selected rows | Supported | Not supported |
| Create | `create(data)` | `save(data)` + `isNewRecord=true` |
| Update | `update(filterByTk, data)` | `save(data)` + `setFilterByTk(id)` |
| Delete | `destroy(filterByTk)` | `destroy()` |
| Typical scenarios | Lists, tables, kanban boards | Forms, detail pages |

## Related Links

- [Building a Full-Stack Data Management Plugin](../../plugin-development/client/examples/fullstack-plugin.md) — Full example: practical usage of `resource.create()` in custom action buttons
- [FlowEngine → Block Extensions](../../plugin-development/client/flow-engine/block.md) — Usage of `createResource()` and `resource.getData()` in CollectionBlockModel
- [ResourceManager (Server-side)](../../plugin-development/server/resource-manager.md) — Server-side REST API resource definitions, which are the interfaces called by client-side Resources
- [FlowContext API](./flow-context.md) — Documentation for methods like `ctx.makeResource()`, `ctx.initResource()`, etc.
