# Knowledge indexing

Knowledge owns one global index configuration and its indexing lifecycle. Every knowledge space shares the active generation, but retrieval filters the reader's spaces and document gates before backend top-k. There are no per-space model or connection overrides. Agents is optional and supplies only its public Embedding catalog, identity and gateway; Knowledge never uses Agents vector collections or resolves decrypted model credentials itself. Unconfigured or unavailable indexing leaves the existing text search available.

## Deployment configuration

Register `defineKnowledgeConfig()` from `@nocobase/app-plugin-knowledge/config` as the `knowledge` member of the application's existing `defaultAppConfigs(...)`. Keep its other sections and the existing Knowledge server plugin registration. This factory validates JSON without opening a connection, loading native storage, calling a model or publishing server-only settings to the browser.

The application's private configuration can declare several named instances, including several of the same type:

```json
{
  "knowledge": {
    "indexing": {
      "local": {
        "name": "Local semantic index",
        "type": "sqlite-vec",
        "file": "knowledge/vectors.sqlite"
      },
      "shared": {
        "name": "Shared PostgreSQL index",
        "type": "pgvector",
        "url": "postgresql://kb_user:REPLACE_ME@db.example.invalid:5432/knowledge",
        "schema": "knowledge_index",
        "table": "knowledge"
      }
    }
  }
}
```

The URL is illustrative, not an instruction to connect. Supply real credentials through the host's supported private configuration or secret loading; never commit them or send them as browser options. PostgreSQL can instead use `host`, `port`, `database`, `user` and `password`; do not mix a URL with those separate fields. TLS uses the deployment-only `ssl` object with `rejectUnauthorized` and optional `ca`, `cert` and `key`. Do not weaken certificate verification to work around a deployment error. A database administrator must install the `vector` extension and prepare an accessible schema; Knowledge does not install extensions. No process-wide `PG*` defaults select a resource implicitly.

SQLite files resolve against the application's storage path unless explicitly absolute. The backend loads `better-sqlite3` and `sqlite-vec` only when used. Native artifacts must match the deployment platform and the host's build policy; this plugin does not change that policy. SQLite supports one real shared file on one host, including local processes using that file, not separate pod-local files presented as a shared index. Preserve the application's storage and the business database together.

Declaring an instance does not enable indexing. It only makes its safe `key`, `name`, `type` and channels selectable. The browser saves the instance key, never a connection, file path or TLS material. Changing a key's underlying resource does not relocate its existing generations: old ownership checks fail safely. Restore the original resource for cleanup or handle it explicitly as an operational recovery; do not put old credentials in generation snapshots.

## Host jobs

The application must provide its ordinary `JobExecutorServiceProvider` and valid host `jobs` configuration. Knowledge obtains the original `jobExecutorServiceToken` from `@nocobase/app-server/jobs` and uses the `@nocobase/app-plugin-knowledge` scope. It does not create a private service, queue, Redis connection, lease or retry scheduler.

Omit `knowledge.jobs` to use the host's default. Set it to an existing named host configuration to select another backend; surrounding whitespace is trimmed. An explicitly configured unknown name or a selector naming the string `jobs.default` is not silently redirected to a different backend. Connection, concurrency, attempts and persistence policy stay entirely with the host. Missing or failed host setup makes indexing unavailable, without breaking normal Knowledge reads or text search; repair the host and restart rather than inventing an in-memory fallback.

The registered ordinary jobs are `knowledge.indexing.document`, `knowledge.indexing.generation` and `knowledge.indexing.dropTarget`. Their payloads contain only a version, generation/document IDs and a canonical source revision, never document bodies, credentials or services. The owned schedules are `knowledge.indexing.reconcile` every 30 seconds and `knowledge.indexing.cleanup` every hour. Setup registers every job class before setting up its executor and every rule before setting up its schedule executor. Shutdown stops submission, waits for the owned handlers and then closes owned storage. It neither shuts down the host service nor removes other scopes' rules. There are currently no renamed or obsolete Knowledge rules; any future removal needs an explicit owner-scoped upgrade list, not a broad cleanup of unknown rules.

## Global administration

Grant the independent settings resource `kb.indexing` through the authorization plugin:

- `read`: view the global configuration, safe instance/model catalogs and aggregate progress.
- `configure`: save or disable the one global configuration.
- `rebuild`: rebuild all spaces or retry a specified failed current generation.

A space's `manage` action does not grant these capabilities. API key scope still intersects the holder's permissions. Every HTTP mutation checks its action before parsing or validating its body, and the management service checks the same original `AuthorizationContext` again; never reconstruct an unrestricted context from a user ID. Read access reveals aggregate indexing counts, not document IDs, titles, chunk text or a list of unauthorized spaces.

Knowledge views leave their title-action slot empty; the application supplies any indexing entry. Applications composing their own UI can use namespace-bound `KnowledgeIndexingEntry`, `KnowledgeIndexingDialog` or `KnowledgeIndexingSettings` from `client/pages`, and `KnowledgeIndexingApi`, `knowledgeIndexingKeys` and the settings/status/catalog hooks from `client/api`. The client Knowledge plugin owns the form registry; a standalone entry is hidden if that registry or the host authorization client is absent. Opening either layout loads its settings and instance catalog; the model catalog loads only for the selected type when its registered form declares `requiresEmbedding: true` (the default is false). A closed entry never loads a type form. A closed entry does not probe storage, fetch index settings or call Embedding. Status polls while open every two seconds, or every ten seconds once ready, and stops when closed. This does not replace the existing per-document index refresh scheduler.

Choose a deployed instance by its name within its type group. The saved configuration contains `version: 1`, its key and only the type's controlled options. Both built-in vector types save only `embedding: { modelService, model }`. PostgreSQL connection, schema and `table` prefix belong to deployment configuration; the prefix defaults to `knowledge` and must match `[a-z][a-z0-9_]{0,19}`. A legacy browser `options.table` is accepted only for compatibility, validated and discarded: it can never override the deployed prefix. Changing that prefix changes resource identity, never renames or adopts existing generation tables. Before rolling out this change, declare the intended prefix in deployment configuration, review any existing generation identity mismatch and explicitly rebuild with the usual confirmation; no automatic migration or rebuild occurs. Retain old deployment records for operator-controlled cleanup of incompatible historical generations. Changing the model service clears the incompatible model and never selects the first model automatically. An unavailable service or failed catalog stays visibly unavailable instead of masquerading as loading or silently changing the saved JSON.

Embedding model IDs can be selected from suggestions or entered directly without choosing a listed item. The selected service must be enabled and its provider must support Embedding; services with no listed models are also offered. Editing, listing, identity resolution and saving do not probe a model. Listed Embedding models retain their configured dimensions; an unlisted fixed ID uses the provider's default dimensions, learned from the first indexing response and fenced by the existing generation checks. A model explicitly listed as another kind is rejected. Knowledge opts in through the public gateway's server-only `allowUnlistedModel` option; it never reads credentials or adds the typed ID to the service catalog. Invalid or unavailable provider model IDs fail through the normal safe indexing error feedback after confirmed admission.

Enable indexing with the dedicated switch; the instance selector contains only deployed instances and displays the selected type beside its label. Turning the switch off disables the selector and type-owned form without removing any fields or losing the current editor's selection and drafts. Nothing changes on the server until Save and confirmation succeed; disabling saves `config: null`, so reopening an already disabled editor requires selecting an instance again. Enabling without an instance cannot be saved. Document progress uses a progress bar followed by processed / total documents; processed includes successful and failed documents, and an unknown total remains indeterminate. A red warning beside the progress label exposes the failed-document count only on hover or keyboard focus. Rebuild and retry controls live on the left of the footer; save remains on the right. Dialogs have one close control in the top-right corner; standalone cards have no redundant configuration heading. Both layouts keep one scope description and contain no application navigation.

Saving a non-null configuration and rebuilding explicitly confirm that all spaces are affected. Vector types warn about Embedding costs; other types warn about storage and service resource usage without requiring a model. Retrying confirms that only failed documents are reprocessed, not a full rebuild. Disabling confirms that text search remains available and needs no loaded model catalog or configuration form. Read-only users see parameters and progress but no configure/rebuild controls. A missing or failed type form retains the original JSON and prevents editing/saving that configuration; it does not prevent an authorized disable. Failed requests keep the draft. Conflict reload updates its baseline revision without discarding that draft; review before applying it against the new revision. Closing a dirty dialog or navigating away from the standalone page asks before discarding it. A page also registers a native beforeunload warning for dirty or in-flight changes. Delayed form or mutation callbacks cannot overwrite a replacement instance or reopened editor.

### Standalone page and zero-instance guidance

The application owns settings placement, routes and menus. `KnowledgeView` and `KnowledgePage` expose `titleActions?: ReactNode`, a generic extension slot at the right of the sidebar title. Omit it, or pass null, to show no actions. The view does not add an indexing icon, fetch indexing permissions or choose click behavior on the application’s behalf. Supply any application-owned buttons, icons and handlers; callers own their authorization and state. `showIndexingSettings` is not part of the view contract. Applications can place `KnowledgeIndexingEntry` in this slot or their own toolbar, control `KnowledgeIndexingDialog` with `open` and `onOpenChange`, or render `KnowledgeIndexingSettings` behind a menu-owned route without any Knowledge view. The entry and standalone component accept an optional `className`. Neither settings presentation includes a full-screen link, a Back to knowledge button or a built-in destination callback.

Render `KnowledgeIndexingSettings` inside the application's normal navigation-guard provider, protect its route with `settings:kb.indexing/read`, and keep configure/rebuild capabilities independently enforced by the editor. Examples exposes the independent component at `/knowledge/indexing` from its Knowledge indexing menu and supplies a permission-gated Settings icon through the directory's `titleActions` slot. Its application-owned dialog state lives outside the Knowledge view so responsive sidebar changes cannot discard an open editor. The plugin does not unconditionally add a route or menu entry to host applications. Use the following composition options independently:

```tsx
import {
  KnowledgeView,
  KnowledgeIndexingEntry,
  KnowledgeIndexingDialog,
  KnowledgeIndexingSettings,
} from '@nocobase/app-plugin-knowledge/client/pages';

// The view has no built-in heading action.
<KnowledgeView space={space} />;

// Applications choose the slot content, including icons and click behavior.
<KnowledgeView space={space} titleActions={customActions} />;

// The ready-made permission-gated indexing trigger can also fill this slot.
<KnowledgeView space={space} titleActions={<KnowledgeIndexingEntry />} />;
<KnowledgeIndexingSettings />;

// Alternatively, place the ready-made dialog trigger in a custom toolbar.
<KnowledgeIndexingEntry />;

// Or use an application-owned control and a controlled dialog.
<KnowledgeIndexingDialog open={open} onOpenChange={setOpen} />;
```

When the deployment instance directory loads successfully with no instances, both layouts show vector database setup guidance and a localized, read-only Agent prompt instead of empty instance/model controls or save/rebuild actions. The guidance introduces SQLite with sqlite-vec as a local-file vector database and PostgreSQL with pgvector as a database-service vector database, explains their requirements, and lists the steps to edit knowledge.indexing in config.yaml, restart the application and return to enable indexing, select an instance and model, and save. The Agent prompt takes a different perspective: inspect the application’s actual supported types, let the user choose, collect type-specific connection or file details, and confirm the proposed change before editing the actual config.yaml or existing config.yml. It requires consent before restarts, dependency installation, paid calls or rebuilding. Previously saved settings remain untouched without an extra preservation notice; stale forms, saved-options JSON, progress and mutation controls are hidden. One prompt heading and an accessible icon-only copy button avoid repeated instructions. Clipboard failure selects the prompt for manual copying. Copying never executes configuration. A failed instance-directory request is not presented as an empty deployment; users can retry loading it. A configured instance without a built generation remains a distinct state and exposes its normal form. No hypothetical backend is offered.

## HTTP and durable receipts

Routes are relative to the host's `/api/knowledge` namespace and application base path:

| Method | Route                       | Action    | Success                       |
| ------ | --------------------------- | --------- | ----------------------------- |
| GET    | `/indexingSettings`         | read      | 200 settings and capabilities |
| PUT    | `/indexingSettings`         | configure | 200 durable receipt           |
| GET    | `/indexingSettings/status`  | read      | 200 aggregate progress        |
| POST   | `/indexingSettings/rebuild` | rebuild   | 202 durable receipt           |
| POST   | `/indexingSettings/retry`   | rebuild   | 202 durable receipt           |
| GET    | `/indexingInstances`        | read      | 200 safe directory            |
| GET    | `/embeddingModels`          | read      | 200 safe directory            |

Bodies are strict JSON and limited to 32 KiB. Settings/status use the standard `{ data }` envelope; directories use `{ data, meta: { total, reason } }`, including an empty list with a safe reason when unavailable. Catalogs never return connection URLs, secrets or credential-presence flags. Reads do not set up executors, create vector targets or call Embedding. Status observes persistent records, the public model identity and known host readiness; it is not a live storage-health probe.

A save request looks like this:

```json
{
  "requestId": "11111111-1111-4111-8111-111111111111",
  "expectedRevision": "0",
  "config": {
    "version": 1,
    "key": "local",
    "options": {
      "embedding": {
        "modelService": "application-model-service",
        "model": "application-embedding-model"
      }
    }
  },
  "acknowledgeFullRebuild": true
}
```

Generate a fresh lowercase UUID for a new operation and use the revision actually read from the server, represented as a canonical decimal string. Disable with `config: null`. Rebuild omits `config`; retry also supplies the current `generationId`. Rebuild/retry require `acknowledgeFullRebuild: true`. A receipt contains `requestId`, `revision`, `changed`, `acceptedAt`, `generationId` and `enabled`. It means the business database accepted durable intent, not that a queue or model has completed the work.

If a response is lost, resend the identical operation, body and request ID. The durable principal-scoped receipt is replayed before checking whether its old model still exists. Reusing that ID for different input returns 409 `INDEXING_REQUEST_CONFLICT`; saving against a stale revision returns 409 `INDEXING_REVISION_CONFLICT`. These are standard `ABORTED` errors in domain `knowledge`. Input/options and unavailable dependencies use standard 400 reasons. Unexpected errors do not expose connections, SQL parameters, model responses or document text. A failed subsequent status GET cannot turn an accepted receipt into a failed save.

The original `/indexing`, `/docs/{docId}/index` and `/docs/{docId}/reindex` remain compatible with their existing space/document permissions and response data. The built-in runtime adapts the one existing Indexer slot and declares partial notifications; it does not compete with itself through several per-type indexer registrations.

## Publication, recovery and costs

Document/chunk changes, source revisions, tombstones and active/building work are committed in the same business transaction. Post-commit notifications only reduce delay: they are not a durable outbox. Reconciliation submits bounded outstanding work and recovers lost enqueue requests, queue state or receipts. Duplicate jobs and old workers are expected; source, snapshot and target ownership checks prevent stale application. Search rechecks generation, source and authorized scopes after backend retrieval and drops the whole vector ranking if they changed.

A rebuilding generation does not replace the active index until its scan and required work catch up. The current index remains available meanwhile; failed building work cannot publish. Unsafe spaces are withheld from vector retrieval, and current text search continues. Empty indexes can publish without paying for an empty Embedding call and index the first later document normally.

Embedding batches contain at most 8 inputs, with a 60-second batch budget. The entire vector search branch has a five-second budget and embeds the query once. Abort is best effort: a provider that has already accepted a request may still charge for it. Existing stored vectors are reused for unchanged chunks unless a force reindex requires regeneration. Storage idempotency is not a promise of exactly-once model calls.

Preparation uses small batches rather than assuming an OpenAI-compatible endpoint accepts its generic SDK's advertised input count. Endpoint limits can be smaller; a rejected request is not automatically split and replayed. After correcting request handling, retry the affected document rather than rebuilding every space.

Transient failures use the selected host's attempts policy; permanent failures persist business failure and stop. Reconciliation does not endlessly resubmit failed model work. Explicit retry preserves the selected generation/revision and clears only its current failed work. Progress and failure are persistent observations, not a claim that a globally readable job history proves all automatic attempts exhausted. Host concurrency is per worker, not a cross-process concurrency or total-cost limit.

Failure feedback uses fixed reason codes and localized guidance for Embedding authentication, quota, rate limits, model configuration, input limits/content policy, invalid vector responses and service reachability, plus storage authentication, permissions/read-only mode, missing schemas, connectivity, busy transactions, operation timeouts, missing vector extensions and target ownership conflicts. Classification reads documented gateway/driver codes, never provider message text or response bodies. The dialog retains distinct active/building/dependency failures and deduplicates identical guidance; it never renders raw stored messages or unrecognized codes. Transient categories remain subject to host attempts, while authentication, quota and configuration failures require correction before explicit retry. Historical `INDEXING_UNAVAILABLE` records cannot be reconstructed into precise errors and retain generic feedback; no migration or automatic paid retry rewrites them.

Save, rebuild and retry request rejections use the same safe reason mapping without discarding the draft or automatically resubmitting. A model endpoint/provider/dimension change alters the generation's frozen identity: retry of that old generation is rejected with `INDEXING_MODEL_CHANGED`, even after credentials are corrected. Review the configuration and explicitly rebuild all spaces if needed; the usual cost confirmation still applies. Status checks the active generation, or the building/failed target when there is no active generation, using public identity metadata only, so a blocked first generation can explain drift before another request is submitted. This observation neither rewrites historical errors nor probes storage or calls Embedding.

Alibaba Qwen Embedding now uses the service's OpenAI-compatible endpoint while chat retains the Alibaba SDK. Alibaba model identities include `embeddingTransport: "openai-compatible-v1"`, so a generation frozen under the former native transport is not silently reused. Review the compatible base URL and explicitly rebuild if an old Alibaba generation reports `INDEXING_MODEL_CHANGED`; status and identity checks never perform that rebuild themselves. Existing identities for other providers, including separately configured OpenAI-compatible services, are unchanged.

Memory jobs persist a complete pending snapshot during graceful shutdown, not every enqueue. They support one process per state file, not multi-process shared consumption. Durable business intent can restore missing work after an abrupt restart, but duplicate calls remain possible. Redis durability and resource policy belong to an authorized host deployment; this plugin neither provisions Redis nor claims to have tested one implicitly.

## Cleanup and operational recovery

Retired or superseded targets wait at least 24 hours before cleanup. Active and current building pointers are never collected, including a failed building generation retained for explicit retry. Each hourly sweep selects at most ten due non-current targets, rotating by cleanup deadline eligibility and oldest activity. Drop jobs recheck the pointers, enter `dropping`, close/drop the owned target and only then record `dropped`. Even a never-initialized target receives its permanent closed-owner marker so a delayed ensure cannot resurrect it. Cleanup does not call a model and can complete after the old model service is removed.

A failed drop retains its intent and sanitized diagnostics for a later hourly sweep. Ownership or resource mismatches refuse deletion; they are not reported as reclaimed storage. Permanent external closed markers remain. Acknowledged dropped-generation metadata and its cascading work rows expire after seven days; request receipts also expire after seven days, with bounded hourly removal. Source tombstones are not automatically compacted. Business documents, chunks, versions, files and permission records are never indexing cleanup targets.

SQLite prepares vector-only input in a private `knowledge-indexing-spool` directory, with 0700 directory and 0600 files, before entering its synchronous write transaction. It streams prepared rows rather than collecting a document's vectors in a second array and removes the spool in a finally path. Bounded housekeeping removes only recognized old generated spool files, without recursion or following symbolic links; young files and unrelated names are left alone. Spool files are temporary, not authoritative recovery facts.

Retirement is not rollback: the old active no longer receives new writes and must not be switched back as if current. The supported fallback is to disable global indexing, keep text search, repair dependencies and explicitly build a new generation. After restoring a business database backup, first stop old workers and close the old index; do not reuse rolled-back source revisions against its original external manifest. Direct SQL writes to business documents, independent local SQLite files on multiple hosts and live model-identity changes are outside the supported deployment contract.

The new migration creates only the five index control tables and starts disabled. It does not call an external database or model. Migration down requires a stopped, closed-index maintenance window; it removes only those new tables and cannot claim to reclaim external targets automatically.

## Application-defined extensions

`KnowledgeIndexingExtension`, `KnowledgeIndexingBackend`, `KnowledgeEmbeddingProvider` and `KnowledgeIndexingValidationError` are public from `@nocobase/app-plugin-knowledge/server/indexing`. An extension defines a type, contract version, one v1 channel, pure deployment/settings parsers, a credential-free resource identity and a lazy backend factory. Parsers report fixed English issues with relative field paths through `KnowledgeIndexingValidationError`, never raw values. Backend operations must implement ownership checks, monotonic revision/snapshot fencing, pre-top-k authorization and permanent closed-target behavior; an in-memory sample is not a production durable backend.

Register the same server extension in both the configuration factory and plugin factory:

```ts
import { defineKnowledgeConfig } from '@nocobase/app-plugin-knowledge/config';
import { createKnowledgePlugin } from '@nocobase/app-plugin-knowledge/server';
import { textIndex } from './extensions/text-index.js';

export const knowledgeConfig = defineKnowledgeConfig({
  indexingExtensions: [textIndex],
});
export const knowledgePlugin = createKnowledgePlugin({
  indexingExtensions: [textIndex],
});
```

Use those two values in the host's existing configuration and plugin lists, not a duplicate Knowledge registration. A late runtime registry entry alone cannot make an earlier configuration factory recognize a type. Text-only extensions return a text input plan, do not require an Embedding service and return an empty vector-cache map. The package's `tests/fixtures/text-indexing-extension.ts` and `tests/indexing-extensions.test.ts` demonstrate the real host jobs path without registering Agents; that fixture is intentionally non-durable and test-only.

On the client, pass an `indexingForms` definition for the same type to the normal Knowledge client factory. Import `IndexingFormProps` from `client/indexing`; implement a controlled options fragment using `value`, `onChange`, `errors`, `disabled` and the provided model catalog state, without nested forms, persistence, probe or model calls. A definition supplies either a component or a lazy `load()` returning its default export, and declares `requiresEmbedding: true` only when its form needs the Embedding catalog. This is a type-owned form dependency, not an inference from channel names. Both built-ins opt in; text-only types can load, edit, validate on the server and save without any Agents model dependency. Only the selected type is loaded and only its controlled options are submitted. The application-local registry is created during register, populated during boot, sealed during start and cleared by its owning provider during shutdown. Duplicate types fail instead of silently replacing one another. The public token and `useIndexingForms` do not create a second global map.

## Verification boundaries

The package suites exercise a real business SQLite database, real `sqlite-vec`, the original host Memory executors, deterministic non-charging Embedding fixtures, route authentication/authorization and controlled React forms. Crash recovery tests verify business intent, not Memory multi-process durability. PostgreSQL ownership and pre-filter SQL tests include mocks; `tests/indexing-pgvector-live.test.ts` only runs against an explicitly supplied, authorized `KNOWLEDGE_TEST_PGVECTOR_URL` and creates an isolated random schema without installing an extension. Do not set that variable to an application database merely to make a test green.

Package verification is scoped and SQLite suites run serially:

```bash
pnpm --filter @nocobase/app-plugin-knowledge fix
pnpm --filter @nocobase/app-plugin-knowledge lint
pnpm --filter @nocobase/app-plugin-knowledge typecheck
NOCOBASE_TEST_DB_DIALECT=sqlite pnpm --filter @nocobase/app-plugin-knowledge test --no-file-parallelism
pnpm --filter @nocobase/app-plugin-knowledge build
```

The opt-in public-export test accepts `KNOWLEDGE_TEST_PACKAGE_ROOT` pointing to an actual extracted `pnpm pack` tarball. Resolving its peers from this workspace verifies the published export manifest, built JavaScript and declarations, not a clean registry install or native Node deployment. Live PostgreSQL, multi-instance Redis, paid model calls and real full-space rebuilds require separate authorized environments and must be reported as unverified when not executed.
