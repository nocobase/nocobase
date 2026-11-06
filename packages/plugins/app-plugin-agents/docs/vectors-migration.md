# Migrating from Agents vector collections

Agents **2.0.0-beta.0 and later 2.x releases** remove the complete legacy vector collection subsystem. This is a breaking upgrade with no prior deprecation release. Applications using `agents.vectors` must migrate their integrations before upgrading, or pin their last compatible application, Agents package and framework revision. Upgrading the framework alone does not migrate an application or its stored indexes.

Model services, provider capabilities, `models.gateway.embed()`, reranking, text generation and model usage recording remain available. Knowledge retains its independent indexing service, SQLite/pgvector backends, jobs, search, permission filtering and data. Chat, runners and response recovery are unchanged.

## Upgrade gate

Before choosing a release containing Agents 2, inventory every application's source, runtime configuration, custom stores, wrappers, background writers and lockfile. Find collection registration and writes as well as searches and status calls, including destructured or aliased access to `agentsToken`. Confirm the actual deployed application and framework versions; a migrated development branch does not establish that a deployment has migrated.

The previously inspected Studio stable source still registers legacy collections for semantic retrieval, context preparation and reranking. That application must keep its compatible framework until its own integration is migrated and verified. The inspected development source uses keyword search and explicitly disables the legacy store: keep that disabled setting while it runs a legacy framework; remove it together with the upgrade to Agents 2, or retain the inert setting described below. This framework change does not modify or deploy Studio. The fixed source references at the end describe the inspected revisions, not every subsequent release or installation.

Do not upgrade an application with unresolved legacy consumers. An application owner must choose either to retain the compatible version or to implement and validate the required retrieval behavior. If keyword search is acceptable, remove legacy registration, writes, status/UI integration and query expansion, and test the existing keyword path and its permissions. If semantic retrieval is required, integrate the existing Knowledge indexing service for Knowledge documents and rebuild from authoritative document text after confirming its retrieval behavior. Custom collections require an application-owned migration design; there is no generic replacement collection API and no new engine is supplied by this change.

## API and configuration changes

| Removed contract                                                                                                                             | Required action                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Agents.vectors`, including `collection()`, `stores`, `status()`, `start()`, `stop()` and `drain()`                                          | Remove registration, write hooks, query/status paths and worker handling in the application, or keep a compatible framework. Do not replace calls with a successful no-op.                       |
| Collection `sync`, `upsert`, `replace`, `remove`, `search`, `status` and custom store registration                                           | Migrate each consumer's rebuild, writes, deletion, permission filters and fallback behavior together.                                                                                            |
| `AgentsDeps.vectors` and `AgentsDeps.paths` in the testing factory                                                                           | Remove these arguments and old vector test doubles. Retain model service/gateway fixtures and assertions.                                                                                        |
| `Vectors`, `VectorsConfig`, `VectorCollection`, `VectorStore`, `Embedder` and all other legacy vector types re-exported from `server/tokens` | Remove imports and update consumer types. The `server/vectors` implementation and backend factories are removed; they were not a supported package subpath export.                               |
| Active `agents.vectors` configuration                                                                                                        | Remove it only after migrating consumers. Startup rejects active or malformed values with an upgrade error and does not print connection settings. There is no silent fallback to another store. |

The only accepted legacy value in the 2.x `AgentsConfig` contract is `vectors: { store: false }`. It is deprecated and inert: no worker, connection, file access or collection service is created. Runtime configuration with `store: false` may still contain old connection keys; those keys are ignored, but remove them from application configuration and secret provisioning when no other feature uses them. Omitted `agents.vectors` is also accepted. Values such as `{}`, `null`, `false`, or `{ store: 'pgvector' }` are rejected. The disabled compatibility field is retained for 2.x; its removal belongs to a future breaking release.

For direct Embedding consumers the existing API remains:

```ts
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';

const { models } = app.container.resolve(agentsToken);
const result = await models.gateway.embed({
  model: { modelService: 'existing-service', model: 'embedding-model' },
  values: ['Text to embed'],
  source: 'my-application',
});
```

This returns embeddings and records model use; it does not store or search them. Model services remain configured through the Models page/API. Knowledge indexing is configured independently under `knowledge.indexing` and through its indexing settings; see [Knowledge indexing](../../app-plugin-knowledge/docs/indexing.md) in the source repository or `@nocobase/app-plugin-knowledge/docs/indexing.md` in the installed package. Never rename `agents.vectors` to `knowledge.indexing`: its backend contracts, configuration, metadata and index formats differ.

## Data retention

This release stops old indexing work and removes its code. It does **not** delete, convert or clean up old data. Historical migrations remain immutable, including `202610020011_ag_create_vectors`; fresh installations still create its two empty control tables, but do not create an old vector store. No cleanup migration is added.

| Legacy data                                                             | What remains after upgrade                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application DB collections `agVectorIndexes` and `agVectorEntries`      | Index metadata, queued text, states, retries and leases remain; no new worker processes them. Physical names may follow the application's naming strategy. Completed entries do not contain enough text to reconstruct all source documents. |
| SQLite, default `storage/vectors.sqlite` or configured `path`           | The file, `agv__meta`, `agv_<normalized-index>` tables and their filter indexes remain untouched. Include WAL state in a consistent backup.                                                                                                  |
| Independent PostgreSQL selected by the old store connection/search path | `agv_` tables, vector columns, HNSW/filter indexes, comments and extension remain untouched. The old store did not own the entire database or create an exclusive schema.                                                                    |
| Application-owned context text, search/model settings and custom stores | Remain application-owned; inventory them separately and preserve them for rollback.                                                                                                                                                          |
| `agModelServices` and `agModelUsage`                                    | Remain active and retain prior usage records, including those originating in the removed subsystem.                                                                                                                                          |

Knowledge's `kbIndexingSettings`, `kbIndexGenerations`, `kbIndexSources`, `kbIndexWork`, `kbIndexRequests`, its SQLite target registry/generation tables/spool, and its PostgreSQL objects must remain. Two systems may share a physical file or server: a prefix or shared `vector` extension is not proof of exclusive ownership. Do not drop an entire file, schema, database or extension to clean up Agents.

Physical cleanup requires a separate approved operation after all consumers are migrated, backups are verified, the rollback window has closed and each object is attributed to the old subsystem. This guide intentionally provides no destructive cleanup command.

## Application migration sequence

1. Record the old and target application/framework revisions, exact package versions, lockfile, custom integrations and all old store targets. Preserve recoverable artifacts and private configuration through the application's normal secure process; do not put secrets or document text into public reports. Stop if a consumer or store owner is unknown.
2. Implement the chosen application retrieval behavior on a separate branch. Preserve permissions, source deletion, updates, rebuilds, fallback handling and user-visible status. Rebuild a replacement Knowledge index from authoritative documents; do not import the legacy embeddings or queue as if formats were compatible. Stop if the owner has not accepted a change in retrieval behavior or required functionality is missing.
3. Test the application with candidate Agents 2 and matching Knowledge/template/demo-mode releases. Update all production providers, peer ranges, framework/vendor pointers and lockfiles together. For a source-vendored application, merge the framework change first, then select that merged revision in the application. Do not upgrade an unmigrated stable application automatically.
4. Before switching an authorized installation, quiesce every old instance and writer, including its vector worker. At the same checkpoint back up the main database, all inventoried SQLite/PG targets, original document sources and application-owned search/context settings. Use an SQLite backup API or a stopped consistent copy including WAL, and the application's PostgreSQL backup procedure. Verify restoration in an isolated copy. Stop if a target or recoverable old artifact is missing.
5. Upgrade the migrated application and packages, remove active legacy settings and apply normal migrations without editing history. Check startup, model Embedding/usage and the application's retrieval workflows. Verify old metadata and store objects remain unchanged; no old store should be opened or worker started. Confirm new installation and existing-installation upgrade behavior independently. Stop and roll back if data is missing, settings are rejected unexpectedly, or preserved behavior regresses.
6. Keep old artifacts/configuration and retained stores through the rollback window. Document writes made during the new release and the rebuild needed if the old application is restored. Cleanup and deployment remain separately authorized operator actions.

## Rollback

Restore the **matching old application and framework/package set**, lockfile and private configuration, rather than downgrading Agents alone. Retained old stores and control rows allow the old application to register its original collections again. Before resuming its worker, inspect the backlog and expected model cost. Documents changed while the old worker was stopped must be resynchronized from authoritative sources; retained old embeddings may be stale.

If restoring database backups is necessary, restore the coordinated checkpoint and explicitly account for writes since that checkpoint. Code rollback cannot recover deleted data or preserve later writes automatically. Do not use migration `down`/`rollback` as an upgrade rollback procedure: historical `down` operations can drop data.

## Verification before release and application upgrade

| Layer               | Required verification                                                                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agents              | Scoped lint/typecheck/test/build; absent and disabled configuration start, active configuration fails without secrets; no vectors member or published legacy declarations; gateway Embedding and model usage still work.                                                        |
| History and upgrade | Unchanged historical migration checksums; fresh install includes old empty control tables; upgrading synthetic legacy metadata and pending text preserves both; isolated store backups and restore verified.                                                                    |
| Knowledge           | Scoped lint/typecheck/test/build; public installed JS/types; application providers and host jobs; Embedding, SQLite and PostgreSQL indexing, rebuild/search/delete/retry and permission filtering. Run live PostgreSQL tests against an independently authorized test instance. |
| Consumers           | Matching template/demo-mode package checks and installed package type/import checks; each application's search, permissions, context/brief/mount integration and ordinary startup/build.                                                                                        |
| Rollback            | Isolated old → new → matching old application rehearsal, retained objects, source resynchronization and accepted handling of writes after the checkpoint.                                                                                                                       |

Framework tests use synthetic data and local model fixtures. They do not certify the state of a deployed application, a production store backup or a successful application migration. Record commands and results for the actual candidate and installation; skipped live database checks and unperformed operator rehearsals remain release/upgrade prerequisites.

## Inspected consumer references

- Framework implementation started from `nocobase/nocobase` `v3-develop` at [4721806a42505969d4a20f99597cbd341a2b6af4](https://github.com/nocobase/nocobase/tree/4721806a42505969d4a20f99597cbd341a2b6af4); the pre-removal Agents version is `1.0.0-beta.28`.
- Studio stable source [ed5408ca4137eaae46a79e47a2fa13491192f3b7](https://github.com/nocobase/studio/blob/ed5408ca4137eaae46a79e47a2fa13491192f3b7/server/knowledge/provider.ts) registers [legacy collections](https://github.com/nocobase/studio/blob/ed5408ca4137eaae46a79e47a2fa13491192f3b7/server/knowledge/vectors.ts); its framework pointer is `164abe70e53a24d1c406673daf4c486c452388f3`.
- Studio development source [99b7062509a0fc5ee50a3964897ec96a0d8b7d24](https://github.com/nocobase/studio/blob/99b7062509a0fc5ee50a3964897ec96a0d8b7d24/server/knowledge/provider.ts) uses keyword retrieval and [disabled legacy configuration](https://github.com/nocobase/studio/blob/99b7062509a0fc5ee50a3964897ec96a0d8b7d24/server/config/agents.ts); its framework pointer is `cda06e7c433b3271a4b7b8112140a054b1b2a8a7`.

These are fixed source observations. Actual deployments, later branches and repository-external consumers must be checked by their owners before upgrading.
