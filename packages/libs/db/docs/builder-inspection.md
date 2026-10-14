# Inspecting a Collection before a migration

`await builder.getCollection(name)` returns a detached snapshot of the current Collection definition, or `undefined` when it is absent. A connected builder resolves the definition through its transaction's Collection reader, including the actual indexes and logical field names. A standalone planning builder returns its in-memory definition. Mutating the returned object never changes the database or the builder.

Use it to make an incremental migration safe for both older installations and installations using a corrected creation migration. Declare the operations explicitly in the migration; do not import an application's live Collection definitions. For example, inspect whether an obsolete index exists and pass its inspected name to `builder.dropIndex`. The read does not bypass migration locks or grant any additional write capability.
