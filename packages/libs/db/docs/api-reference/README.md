# Database public API reference

This reference covers the TypeScript and JavaScript API of `@nocobase/db` in the current source checkout, including `connection.restrict()`. It covers both package entries, their exported values and types, and contracts reachable through public objects. HTTP endpoints, CLI commands and implementation classes unreachable through public signatures are outside its scope.

For release readiness, see the [API freeze review](./release-review.md). This reference documents the current surface; complete export coverage does not mean every contract has been approved as stable. Known issues are linked from the affected chapters.

## Chapters

Read the chapters in this order, or follow the topic links below. Each chapter explains the API's purpose, methods, options, results and behavioral boundaries, then links to full signatures.

| Order | Chapter                                             | Topics                                                                                                                                                                               |
| ----: | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|     1 | [DatabaseManager](./database-manager.md)            | [Configuration and initialization](./database-manager.md#configuration-and-initialization), named connections, shortcuts and service-container integration                           |
|     2 | [Connection](./connection.md)                       | Handles and lifecycle, [configuration and naming](./connection.md#configuration-naming-and-schema-management), schema-management modes, capabilities and native access               |
|     3 | [Migration and Seed](./migration-and-seed.md)       | Definitions, sources, loading, execution, sample data, [history/checksums/locks](./migration-and-seed.md#history-checksums-and-task-locks)                                           |
|     4 | [Collection and Schema](./collection-and-schema.md) | [CollectionBuilder](./collection-and-schema.md#collectionbuilder), fields/relations/indexes/constraints/views, Collections, SchemaInspector, Metadata and Artifacts                  |
|     5 | [Query](./query.md)                                 | Query builders, expressions, joins, subqueries, aggregation, clause clearing, SQL compilation and decoding                                                                           |
|     6 | [Repository](./repository.md)                       | CRUD and results, [input builders and ASTs](./repository.md#input-builders-and-asts), relation writes, aggregation, pagination/iteration, optimistic locking and mutation validation |
|     7 | [Permissions](./permissions.md)                     | Binding and scopes, policy builders, normalization, narrowing/references and [method-level writePolicy](./permissions.md#method-level-writepolicy)                                   |
|     8 | [Transactions](./transactions.md)                   | Handle propagation, nested transactions/savepoints, completion callbacks, runner transactions and Builder limitations                                                                |
|     9 | [Events](./events.md)                               | Subscriptions, listener phases, payloads and metadata, execution strategy, recursion and delivery boundaries                                                                         |
|    10 | [Testing](./testing.md)                             | Testing entry, isolated databases, runtime and adapter helpers                                                                                                                       |

Permissions, transactions and events have dedicated chapters. Earlier chapters list their entry points and link to those chapters for shared semantics.

## Appendices

- [A. Driver and adapter extension](./driver-extension.md): driver contracts, runtime strategies, capabilities, inspector hooks and low-level helpers.
- [B. Errors, values and shared helpers](./errors-and-values.md): structured errors, temporal/JSON types, field capabilities and import boundaries.
- [C. Complete export index](./exports.md): every importable name, its entry and kind, its full declaration and its owning chapter.

## Coverage and imports

| Entry                  | Runtime values | Type exports | Total | Audience                                       |
| ---------------------- | -------------: | -----------: | ----: | ---------------------------------------------- |
| `@nocobase/db`         |             69 |          349 |   418 | Application code and dialect extension authors |
| `@nocobase/db/testing` |             12 |            9 |    21 | Dialect tests and test-database provisioning   |

The signature pages additionally describe 127 supporting contracts. For example, `CollectionMetadataService`, `SchemaAdapter`, `JoinBuilder` and several option/result types are usable through their owning objects even though their names are not root exports. A declaration being exported from a source file does not make it importable from `@nocobase/db`.

`CollectionBuilder` is a root **type** export: obtain an instance from `db.builder()` or `connection.builder`. `BaseSchemaInspector` and the exported metadata-store classes are runtime **value** exports and can be imported as classes. Standard TypeScript utility types and external types such as Knex and ServiceToken retain their own packages' contracts; the reference does not duplicate those libraries.

The 18 pages in `signatures/` retain full generic declarations, overloads, option/result fields, source links and related-contract links. Each signature page links back to its chapter. Manager and Connection declarations are separate; permission-derived handles belong to Permissions. Transaction methods remain in their owners' declarations, with behavior and the shared callback-phase type linked from Transactions.

## Keeping the reference current

The ten chapters, two explanatory appendices and this overview are curated. The signature pages and complete export index are generated from declaration output, with exact export coverage checked against `scripts/public-api.json`. Rebuild before regenerating or checking so declaration files match the source:

```bash
pnpm --filter @nocobase/repository-input build
pnpm --filter @nocobase/db build
pnpm --filter @nocobase/db api:check
node packages/libs/db/docs/api-reference/generate.mjs
node packages/libs/db/docs/api-reference/generate.mjs --check
```

Update the relevant chapter when a behavior changes. Do not edit generated signatures by hand. Source links point to the declarations' source files, including re-exported contracts owned by `@nocobase/repository-input`.
