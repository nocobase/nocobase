---
title: Database public API navigation
description: Ordered chapters and complete signatures for both public entries of @nocobase/db.
---

# Database public API navigation

The package has two public entries: `@nocobase/db` and `@nocobase/db/testing`. The [complete API reference](../../api-reference/README.md) follows the chapter order below, with method summaries, options, results and behavioral constraints. Full signatures and supporting contracts are linked from each chapter.

## Chapters in reading order

| Order | Chapter                                                               | Coverage                                                                                                        |
| ----: | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
|     1 | [DatabaseManager](../../api-reference/database-manager.md)            | Configuration, driver registration, named connections, shortcuts and service-container integration              |
|     2 | [Connection](../../api-reference/connection.md)                       | Handles, lifecycle, naming, managed/external modes, capabilities and native access                              |
|     3 | [Migration and Seed](../../api-reference/migration-and-seed.md)       | Definitions, loading, execution, sample data, history, checksums and locks                                      |
|     4 | [Collection and Schema](../../api-reference/collection-and-schema.md) | CollectionBuilder, fields, relations, indexes, constraints, views, registry, inspection, metadata and artifacts |
|     5 | [Query](../../api-reference/query.md)                                 | Queries, expressions, joins, subqueries, aggregates, compilation and result decoding                            |
|     6 | [Repository](../../api-reference/repository.md)                       | CRUD, builders and ASTs, relations, pagination, iteration, locking and validation                               |
|     7 | [Permissions](../../api-reference/permissions.md)                     | Policy binding, scopes, builders, narrowing, references and method-level write policies                         |
|     8 | [Transactions](../../api-reference/transactions.md)                   | Handle propagation, savepoints, callbacks and migration/seed transactions                                       |
|     9 | [Events](../../api-reference/events.md)                               | Repository subscriptions, phases, payloads, metadata and execution strategy                                     |
|    10 | [Testing](../../api-reference/testing.md)                             | The testing entry, provisioning and adapter helpers                                                             |

## Appendices

- [Driver and adapter extension](../../api-reference/driver-extension.md)
- [Errors, values and shared helpers](../../api-reference/errors-and-values.md)
- [Complete export index](../../api-reference/exports.md)

## Import boundaries

The export index distinguishes runtime values from type-only exports and identifies their package entry. Other contracts are available through returned objects and callbacks without being importable by name. Use the signatures to check access rather than deep-importing a source module.

Repository input builders and AST types are covered by the Repository chapter. `RelationMutationAst` describes a normalized relation plan; it is not a root-level CRUD `relations` option. The reference describes the current checkout, including `scope()` and the current `withPolicies()` annotations. Historical proposals do not define the current contract.

## Usage guides

The reference chapters link to the existing usage examples. The [documentation contents](../toc.md), [task router](../agent/task-router.md), [overview](../overview.md) and [quick start](../quick-start.md) remain the entry points for task-based reading.
