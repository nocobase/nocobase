# Inspecting a Collection before a migration

`await builder.getCollection(name)` returns a detached snapshot of the current Collection definition, or `undefined` when it is absent. A connected builder resolves the definition through its transaction's Collection reader, including the actual indexes and logical field names. A standalone planning builder returns its in-memory definition. Mutating the returned object never changes the database or the builder.

A standalone builder retains the compiler-generated names of declared indexes and constraints when they are created or added. Their fields remain logical names, and explicit names are preserved. Renaming a Collection keeps its existing index and constraint names; use those stored names when dropping them. A dry run does not update the stored definition.

Use it to make an incremental migration safe for both older installations and installations using a corrected creation migration. Declare the operations explicitly in the migration; do not import an application's live Collection definitions. For example, inspect whether an obsolete index exists and pass its inspected name to `builder.dropIndex`. The read does not bypass migration locks or grant any additional write capability.
