# API freeze review

[Reference contents](./README.md)

Reviewed on 2026-10-20 against source commit `c3b9707b86` and the working-tree API reference. This is a review of the current contract and a proposed freeze checklist, not approval of a stable release. Runtime code and exported signatures have not been changed by this review.

The ten-chapter organization and most API responsibilities can be retained. Do not freeze the entire surface unchanged: four contract defects affect transaction ownership or result typing, one event metadata defect loses an accepted value, and the compatibility gate does not yet cover signatures. The recommendations below distinguish confirmed behavior from design decisions.

## Chapter assessment

“Retain” means the API shape is suitable based on this review; it is not a claim of exhaustive correctness or all-dialect certification.

| Chapter                  | Assessment                                                                                                     | Freeze action                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1. DatabaseManager       | Retain named connections, configuration factory, handle shortcuts and service token                            | Document default selection and keep transaction semantics in the transaction chapter; its transaction callback is affected by F1         |
| 2. Connection            | Hold lifecycle and transaction-handle contract                                                                 | Resolve F1; distinguish connection ownership from transaction-bound access; retain explicit native-client and schema escape hatches      |
| 3. Migration and Seed    | Retain separate definitions, runners, history, repair and lock APIs                                            | Fix the meaning of `auto`, checksum mismatch defaults, applicability parameters and per-dialect DDL limitations in the release contract  |
| 4. Collection and Schema | Retain schema definitions, registry, metadata, inspection and artifacts; hold Builder transaction placeholders | Resolve F2; keep logical/physical names distinct and preserve store revisions and artifact format versions                               |
| 5. Query                 | Retain the low-level query/expression API                                                                      | State that result generics are caller assertions and that synchronous `compile()` omits execution-time metadata/projection/decoding work |
| 6. Repository            | Hold projection result typing                                                                                  | Resolve F4; retain CRUD wrappers, relation inputs, validation, cursor/iteration semantics and optimistic locking                         |
| 7. Permissions           | Hold derived-handle typing and deprecation decision                                                            | Resolve F3 and settle `withPolicies()` versus the restricted scope contract before announcing a canonical stable entry                   |
| 8. Transactions          | Hold transaction-handle lifecycle contract                                                                     | Resolve F1/F2; retain tested savepoint, callback ordering and callback-error behavior                                                    |
| 9. Events                | Retain subscription and phase model after a targeted fix                                                       | Resolve F5; document written values without promising before/after images or durable delivery                                            |
| 10. Testing              | Retain the separate `@nocobase/db/testing` entry                                                               | State compatibility expectations for exported test helpers; do not treat an exported testing API as an arbitrary private deep import     |
| Appendices               | Retain extension/reference separation                                                                          | Set a deliberate support boundary for driver hooks and helper types, and enforce signature compatibility                                 |

## Confirmed findings

### F1. Transaction lifecycle methods can detach writes from the transaction

Priority: P1, resolve before freezing Connection/Transactions. [`DatabaseConnection.transaction()`](../../src/database/connection.ts) passes a full `DatabaseConnection`, including `disconnect()`, `reconnect()` and `resetManagedSchema()`. In the [Knex connection](../../src/database/internal/knex/connection.ts), `disconnect()` clears `knexInstance`; the next connection creates a normal client from source configuration. There is no transaction-owner guard on that path.

Reproduction: use a temporary file-backed SQLite database and `InMemoryCollectionMetadataStore`, create a table, then call `transaction.reconnect()` inside `db.transaction()`, insert through that transaction object's Query handle and throw. Before reconnect, `client().isTransaction` is true; afterwards it is false. The inserted row survives the outer rollback. A probe with the default database metadata store instead encountered a lock error, which is a different failure mode and does not make the contract safe.

Recommendation: introduce an explicit transaction-bound interface that excludes connection lifecycle/reset operations, and reject those operations at runtime before replacing a transaction client. The runtime guard is required even with narrower TypeScript types. Apply the same ownership rule to policy-bound wrappers and `inTransaction` listener handles; a restricted DatabaseScope already hides those lifecycle methods.

Compatibility: the guard changes previously accepted misuse into a deterministic error. A narrower callback type can expose downstream compilation errors; resolve these before declaring the stable signature. Acceptance requires rollback/commit and nested-transaction tests, plus lifecycle misuse tests that demonstrate no detached write and no leaked client.

### F2. Builder transaction entry points do not provide atomicity

Priority: P1, resolve before freezing CollectionBuilder. [`CollectionBuilder.transaction()`](../../src/collection/builder/builder.ts) returns `fn(this)` without starting a transaction. `BuilderExecOptions.transaction` is declared but unused, and `BuilderResult.metadata` is a reserved field that the implementation never populates. See [Builder options/results](../../src/collection/types.ts).

Reproduction: create a table inside `builder.transaction()` and throw. The callback rejects, but `builder.hasCollection()` confirms that the table still exists. This is not merely a dialect's inability to roll back DDL: this method does not open a transaction at all.

Recommendation: keep transaction ownership at DatabaseManager/Connection and remove the misleading Builder method and transaction option from the stable surface. If a transition is needed, fail explicitly rather than silently accepting a transaction request. Remove the unused metadata-result placeholder or implement and specify it before promoting it as a supported result field. A documentation footnote is insufficient to repair a transaction-named no-op.

Compatibility: removing the method/option is a source change; guide callers to `db.transaction(async (tx) => tx.builder...)`. The replacement still respects dialect DDL limitations. Acceptance requires a clear error/removal or a real implementation with rollback evidence; current no-op behavior must not become the stable promise.

### F3. Policy-derived repositories overstate their records and methods

Priority: P1, resolve before freezing Permissions. [`ScopedRepository.narrow()`](../../src/repository/types.ts) preserves `TRecord` even when an initially unrestricted read becomes field-limited. [`ScopedDatabaseConnection`](../../src/database/connection.ts) also inherits the ordinary `Repository<TRecord>` return type. The [policy-bound implementation](../../src/database/internal/knex/policy-bound-connection.ts) can return a field-restricted repository, while its type exposes `withPolicy()` and omits the `narrow()` operation the runtime requires for further restriction.

Two reproductions pass strict TypeScript checking: a `read: true` repository narrowed to `fields: ['id']` can still be assigned to `RepositoryQuery<Project>`, and a mapped repository returned by `withPolicies()` can be assigned to the same complete-record query. Both return only `{ id }` at runtime. Calling the type-visible `withPolicy()` on the already-bound repository throws `INVALID_POLICY`; runtime `narrow()` exists despite not being in that declared return type. The authorization rules are enforced in these probes; the defect is the result/method contract, not demonstrated unauthorized access.

Recommendation: make narrowing account for possible changes in readable fields while preserving separate create/update input types. For `withPolicies()`, distinguish known mapped keys from unlisted repositories, or expose a conservative common operations interface for dynamically selected keys. Do not promise rebinding on a bound repository. DatabaseScope's conservative partial result types are a useful precedent, but are not a replacement for fixing retained `withPolicies()` callers.

Compatibility: honest result types require consumers to handle missing fields. Add negative type tests for narrowing from `read: true`, dynamic policy maps and mapped/unmapped collection access; pair them with runtime shape tests. Keeping or deprecating `withPolicies()` is a separate decision below.

### F4. Serialized projections promise fields they do not return

Priority: P1 for a type-safe stable Repository contract. Callback-based selection has projection-aware overloads, but the fallback [read and mutation signatures](../../src/repository/types.ts) accept `SelectAst` while exposing the full `TRecord` in their results. A broad `FindManyOptions<TRecord>` variable can take the same fallback path even when its runtime projection is narrow.

Reproduction: declare `Project` with `id`, `name` and `budget`; pass a `SelectAst` selecting only `id`. Strict TypeScript accepts the result as `RepositoryQuery<Project>`, but the runtime object contains only `id` and `budget` is undefined. The read was reproduced; the same full-record promise is present in AST-select overloads for mutation results, which also need contract tests.

Recommendation: use a conservative result shape whenever the projection cannot be inferred, or define a typed AST carrying the selection information. Cover nested relation projections as well as top-level fields; a shallow `Partial<TRecord>` alone cannot describe every partially selected nested record. Preserve precise callback inference where it is sound.

Compatibility: this is mainly a source-typing correction; no change to which fields the database returns is required. Test literal callbacks, serialized ASTs, widened option variables and selection-bearing single/bulk mutations before freezing overloads. The reference now states the current limitation instead of implying every declared record property is present.

### F5. Event metadata loses the proto namespace

Priority: P2, fix before publishing the final event contract. [`defineRepositoryEventMeta()`](../../src/repository/events/meta.ts) accepts any nonempty namespace, including `__proto__`. Normalization then uses a plain object and assigns `bag[namespace] = value`, so this name is not stored as an ordinary own property.

Reproduction: define a `__proto__` metadata handle, pass its entry to `createOne()` and read it from the delivered `afterCommit` event. `Object.keys(event.meta)` is empty and the handle's `read(event)` returns undefined. Ordinary names work. This probe demonstrates metadata loss, not a broader exploit claim.

Recommendation: store metadata in a dictionary that handles arbitrary accepted keys as own properties, including through delivery snapshots, or reject unsupported names explicitly at construction and normalization. Preserving accepted names is the less disruptive choice. Test `__proto__`, `constructor`, ordinary names and duplicate detection through the public subscription API.

## Freeze decisions and compatibility controls

### G1. Cover signatures, not just export names

The existing [public API checker](../../scripts/check-public-api.mjs) records entry names and type/value export-name lists. It detects a removed export, but not a changed parameter, overload, optional property, generic bound or return type under an existing name. `generate.mjs --check` verifies a documentation snapshot only when it is run against fresh declarations; it is not by itself an enforced release compatibility policy, and updating generated files would accept a breaking change without classification.

Before freeze, add a reviewed declaration/signature report and consumer type fixtures to CI. Include supporting contracts reachable through exported signatures: being unimportable by name does not make changes to a public method's options harmless. Preserve the current name baseline as an additional check. Acceptance should include a deliberately incompatible signature change that the release gate catches even though no export name changed.

### G2. Settle permission naming and support boundaries

Recommendation: retain `withPolicy()` for one repository and `withPolicies()` for full-connection policy binding. Treat the restricted facade as a separate API. The current `scope()` contract is coherent, but its name and the `withPolicies()` deprecation remain release decisions; a restricted scope is not a drop-in replacement for full-connection capabilities or unlisted repository access. Do not recommend a mechanical replacement solely because the current declaration carries `@deprecated`.

If `scope()` is retained, document the distinction between creating a DatabaseScope and a policy node's row-filter `scope`. If a different name is chosen, decide it before the stable release and provide the appropriate transition. This review does not rename the API or remove existing deprecation annotations.

Every root/testing export needs a deliberate compatibility expectation. Driver descriptors, runtime strategies and Knex-related helpers are extension contracts even when they are not normal application APIs. The appendix is a reading classification, not permission to break them without a versioning policy. Likewise, do not automatically export all 127 supporting contracts: compiler branding symbols and inference internals need different treatment from useful option/result types.

Type-only additions such as `CompiledQuery`, Builder warning/impact types, or metadata-store option/result types can improve extension ergonomics later without blocking this freeze. Prioritize names required to implement public extension interfaces; avoid forcing consumers into deep imports.

### G3. Make behavioral limits explicit

The reference now specifies first-key default connection selection, `true`/`auto` migration and seed transaction behavior, the default checksum warning policy, applicability/history identity, Query's result-type assertions and numeric metadata work, and event written-value limitations. These are observable contracts, not merely implementation notes.

Keep `auto` as a documented current alias for transaction-enabled execution, or change/remove it before freeze; it currently does not choose a dialect-safe DDL strategy. Connection identity and handle properties are declared writable even though wrappers expose getters and concrete implementations declare many of them readonly. Align the public mutability contract before encouraging replacement of those handles; configuration changes should use an explicit supported path.

Source JSDoc for `DatabaseManager.query()` still says it does not read Collection metadata, whereas query execution can look up resolved numeric field metadata. The chapter and generated topic introduction have been corrected; the source wording should be reconciled in the implementation follow-up. Synchronous `compile()` is an SQL inspection API and does not promise equivalence with the entire execute/decoding pipeline.

## Shapes worth retaining

- Manager shortcuts and connection properties have distinct, documented roles; adding another generic “context” object is not needed for this freeze.
- Migration and Seed have different ownership and history semantics, with explicit repair and lock operations. Keep them separate.
- Builder, resolved Collections, SchemaInspector and supplemental metadata answer different questions. The registry returns detached snapshots; mutating one returned definition did not change a later lookup in the probe.
- Query's low-level SQL composition and Repository's Collection-aware inputs/results are useful separate levels. Do not force identical result types or promise schema inference where it is not implemented.
- Repository single/bulk result wrappers, explicit all-row mutation intent, lazy `RepositoryQuery` consumption and mutation descriptions/validation are defensible contracts. They need precise documentation rather than renaming for symmetry.
- Transaction callbacks and Repository mutation listeners serve different purposes. Keep their registration and error reporting distinct, and retain the documented local, non-durable event boundary.

## Evidence and remaining validation

Strict TypeScript probes compiled all three unsafe complete-record/rebinding examples in F3/F4. Isolated SQLite runtime probes reproduced F1-F5 and checked registry snapshot isolation. The F1 surviving-write reproduction used a temporary file database with an in-memory metadata store; all temporary databases and connection pools were cleaned up. No application database was used.

The targeted SQLite integration run selected 15 existing shared suites covering Builder creation/dry-run, metadata transactions, schema inspection, migration/seed runners and samples, Query compile/transactions, permission scopes/read shapes/connection binding, event delivery/options and transaction callbacks: 117 tests passed and 1 was skipped. They run through the dialect's `core-suite.test.ts` wrapper, so the test-file summary reports one wrapper file. These existing tests do not establish that the newly reproduced edge cases are covered.

The preceding documentation checks passed 667 core unit tests, lint, typecheck and builds. Those results are useful baseline evidence, not proof that all current API promises are sound. This review did not rerun PostgreSQL, MySQL/MariaDB, Oracle, SQL Server or commercial dialect suites; it does not certify their DDL, locking, precision or concurrency behavior.

Before signing off the release: implement and regress F1-F5, settle G1-G3, review all changed signatures and update consumers, rerun affected packages, and complete the applicable sequential dialect matrix through the owning dialect packages. Mark the reference and release notes stable only after those outcomes are recorded. This review leaves runtime fixes and those release decisions open.
