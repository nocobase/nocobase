# ctx.useResource()

`ctx.useResource(name)` instantiates one of the built-in Flow resources (`MultiRecordResource`, `SingleRecordResource`, `SQLResource`, etc.) so your flow logic can perform CRUD without wiring up REST calls manually.

## Usage Patterns

Resources automatically inherit the current data source context (app, data source key, auth headers), so you only need to set collection and call the appropriate method.
