---
title: "Shared Components"
description: "NocoBase client v2 shared components: form containers, form fields, filters, tables, and icon components."
keywords: "client-v2,shared components,React,Antd,NocoBase"
---

# Shared Components

NocoBase client v2 includes a set of shared components. When building plugin pages, settings pages, or forms, you can use these components directly to reuse NocoBase UI and interactions.

This section groups components by usage scenario. Each page covers one component: when to use it, its common API, and whether it can be previewed in the docs.

## Quick Reference

| I want to... | Where to look |
| --- | --- |
| Control the low-level full-screen scanner | [CodeScanner](./form/code-scanner) |
| Put a standard form in a dialog | [DialogFormLayout](./form/dialog-form-layout) |
| Put a standard form in a drawer | [DrawerFormLayout](./form/drawer-form-layout) |
| Allow only `$env` environment variables | [EnvVariableInput](./form/env-variable-input) |
| Enter a file size and store it as bytes | [FileSizeInput](./form/file-size-input) |
| Edit JSON / JSON5 configuration | [JsonTextArea](./form/json-text-area) |
| Enter a password with a strength indicator | [PasswordInput](./form/password-input) |
| Load Select options asynchronously from an API | [RemoteSelect](./form/remote-select) |
| Add scanning support to an input | [ScanInput](./form/scan-input) |
| Allow a field to accept both constants and variables | [TypedVariableInput](./form/typed-variable-input) |
| Let a single-line field accept variables such as `{{ $env.X }}` and `{{ $user.name }}` | [VariableInput](./form/variable-input) |
| Insert variables into JSON / JSON5 configuration | [VariableJsonTextArea](./form/variable-json-text-area) |
| Let multi-line text accept variables | [VariableTextArea](./form/variable-text-area) |
| Filter a Collection with multiple conditions | [CollectionFilter](./filter/) |
| Embed a Collection filter panel in a page | [CollectionFilterPanel](./filter/collection-filter-panel) |
| Customize the draggable row of an antd Table | [SortableRow](./table/sortable-row) |
| Customize the drag handle column of a Table | [SortHandle](./table/sort-handle) |
| Display lists, select rows, and drag-sort rows on settings pages | [Table](./table/) |
| Use Ant Design icons or register custom icons | [Icon](./icon) |
| Create an internal registry for plugin extension items | [createFormRegistry](./create-form-registry) |

## Usage

Import the components you need in a client plugin, then use them like regular React components:

```tsx
import { RemoteSelect, Table } from '@nocobase/client-v2';

function SettingsPage() {
  return (
    <>
      <RemoteSelect request={loadOptions} />
      <Table rowKey="id" columns={columns} dataSource={records} />
    </>
  );
}
```

## When to use these components

Use React + Antd by default. Check these components first for common NocoBase plugin scenarios:

- Open drawer or dialog forms on settings pages
- Insert variables, edit JSON, enter file sizes, or scan codes in form fields
- Use Collection filters or drag sorting in list pages
- Use NocoBase's unified icon entry

For ordinary inputs, buttons, and messages, Antd components are usually clearer.

## Related Links

- [Component Development](../plugin-development/client/component/index.md)
- [Context - Common Capabilities](../plugin-development/client/ctx/common-capabilities.md)
- [FlowEngine](../flow-engine/index.md)
