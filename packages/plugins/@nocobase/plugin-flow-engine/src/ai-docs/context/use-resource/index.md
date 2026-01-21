# ctx.useResource()

`ctx.useResource(name)` instantiates one of the built-in Flow resources (`MultiRecordResource`, `SingleRecordResource`, `SQLResource`, etc.) so your flow logic can perform CRUD without wiring up REST calls manually.

## Usage Patterns

- **List data** (`@nocobase/plugin-flow-engine/context/use-resource/basic.md` → `listUsers`): grab `MultiRecordResource`, set `collectionName`, and call `.list()`.
- **Fetch a single record** (`@nocobase/plugin-flow-engine/context/use-resource/basic.md` → `getRecord`): use `SingleRecordResource` with `filterByPk`.
- **Reuse the resource instance** (`@nocobase/plugin-flow-engine/context/use-resource/basic.md` → `useMultiRecordResource`): configure once and hand the resource to other helpers.

Resources automatically inherit the current data source context (app, data source key, auth headers), so you only need to set collection and call the appropriate method.
