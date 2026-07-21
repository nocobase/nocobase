# Light Extension

`@nocobase/plugin-light-extension` is the domain layer for NocoBase light extensions.

Light extensions organize multi-file RunJS entries on the package's internal VSC repository module. Existing RunJS surfaces reference an entry by repository, entry, and kind instead of copying code into each FlowModel.

## Boundaries

- A light extension repository is not a NocoBase plugin package and does not have plugin lifecycle hooks.
- This package must reuse the shared RunJS compiler, artifact contract, and runtime. Repository creation and source saves are compile-gated and atomic: validation or compilation errors leave repository metadata, Head, runtime artifacts, and existing references unchanged.
- Light extension entries cannot define collections, migrations, resources, ACL rules, app providers, server middleware, or package dependencies.
- Runtime code is resolved by existing RunJS surfaces through entry bindings. The plugin owns repository organization, entry metadata, compiled runtime artifacts, settings validation, reference indexes, and selection UI; it does not add a separate publication/version-policy layer.
- Runtime resolution is available to logged-in page users, matching the existing RunJS source runtime. Repository authoring and management remain behind `pm.light-extension`, so page users do not receive create, save, archive, or delete permissions merely to execute an existing binding.
- Core MVP targets client-v2 first. During the current admin-shell transition, the legacy client bundle also registers the same minimal settings page so `/admin/settings/light-extension` can load without a remote-plugin 404. That bridge must stay thin: no `@nocobase/client` imports, no SchemaComponent runtime, and no ordinary plugin-management concepts.

## SDK Shape

The standalone `@nocobase/light-extension-sdk` boundary is limited to TypeScript types, type generation, and zero-runtime helpers such as `defineSettings()`. It does not export extension registration APIs such as `defineClientExtension`, `registerBlock`, `registerAction`, or `registerResource`.

Entry source code should import SDK types with `import type` and receive runtime objects from the injected context. The authoring workspace generates editor-only SDK declarations and settings types from each `entry.json`; generated files are never persisted with repository source.

The plugin package root remains the server plugin entry. SDK imports use the public `@nocobase/light-extension-sdk/client`, `shared`, and `typegen` exports instead of plugin-local shims.

## JS Page authoring

A JS Page entry lives at `src/client/js-pages/<entry-name>/`. Its `entry.json` defines the stable `key`, metadata, and settings schema, while `index.tsx` renders the page through the injected RunJS context. The authoring workspace generates the settings type from the descriptor, so entry code can use the page-specific context without persisting generated files:

```ts
import type { JSPageContext, RunJSContext } from '@nocobase/light-extension-sdk/client';
import type { Settings } from 'light-extension:settings/client/js-page/hello-page';

const pageContext: RunJSContext & JSPageContext<Settings> = ctx;
await pageContext.page.refresh();
```

The P1 authoring workflow is:

1. Create an inline JS Page and open its JavaScript editor.
2. Use **Move to light extension** to create or select a repository and write a `js-page` entry.
3. Edit the entry workspace and save it; every saved version is validated and compiled before it becomes active.
4. Use **Move to inline code** to copy the current reachable entry files back into the page and clear the external binding.

Moving a page to a light extension preserves its previous inline `code`, `version`, and `sourceRef` as the last runnable compatibility snapshot. The external entry remains the authoring source of truth while the binding is active; moving back to inline copies the current entry instead of silently restoring that older snapshot. See [Move RunJS Source Contract](#move-runjs-source-contract) for the transaction and fallback guarantees.

JS Page source is trusted administrator code, not a sandbox for untrusted user scripts. Server resource ACL still applies to requests made by the page, and JavaScript cannot bypass the current user's data permissions.

P1 does not include creating a page directly from an Entry, an App Bridge API, or a marketplace/distribution workflow.

## Source Save Contract

`lightExtensionFiles:saveSource` accepts `repoId`, `message`, and `files`. It performs the VSC commit, workspace validation, entry reconciliation, and runtime compilation in one database transaction. There is no separate scan action or scan state.

Repository source operations use a different request shape from RunJS Studio workspaces:

1. Read the bound Entry and visible references, then call `lightExtensionFiles:pull` and retain its Head as `expectedHeadCommitId`.
2. Build and compile the complete target workspace with `lightExtensions:compileWorkspacePreview`, passing the retained Head as the required nullable `expectedHeadCommitId`. A successful check returns HTTP 200 with `{ data: LightExtensionWorkspaceCheckResult }`; any rejected Entry returns HTTP 422 with the same result in `errors[0].details`.
3. Call `lightExtensionFiles:saveSource` with only the changed file delta plus the unchanged `expectedHeadCommitId`. Do not send the complete workspace as a replacement snapshot.
4. On HTTP 409, pull again and rebuild the candidate. Never resolve a conflict by replacing only the expected Head while reusing stale source.
5. Verify the new Head, all affected Entry artifacts, reference rows, and the bound Flow Surface. Updating a retained inline fallback `code` field does not change the active runtime while `sourceMode` remains `light-extension`.

Raw `vscFile`, `runJSSources`, direct artifact writes, and ZIP round-trips are not alternative save paths for an active light-extension repository. `inspectSourceArchive` remains read-only.

| Case | Result | Persistent state |
| --- | --- | --- |
| Valid changed source | Returns the commit, tree, entry compile results, and Problems | Repository Head and current runtime artifacts advance together |
| Validation or compilation error | Returns `LIGHT_EXTENSION_VALIDATION_FAILED` with HTTP 422 Problems | The transaction rolls back; Head, source, entries, runtime artifacts, and references remain unchanged |
| Empty/no-change save | Returns the VSC `NO_CHANGES` source error | Nothing changes |
| Archived repository | Returns `LIGHT_EXTENSION_REPO_ARCHIVED` | Nothing changes |

The primary assertion coverage lives in `src/server/__tests__/save-source-runtime.test.ts`. Run it with:

```bash
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/save-source-runtime.test.ts --run
```

## Workspace ZIP Contract

The workspace file manager exposes ZIP import and export. Export is client-side and packages the current working copy, including unsaved editor content. Repository workspaces export every source file; entry-bound workspaces export only paths writable in that scope, so other managed entries are excluded. Generated authoring-only type files are not exported.

Import parses and validates the archive through `POST lightExtensionRepos:inspectSourceArchive` before changing editor state:

```ts
interface LightExtensionInspectSourceArchiveInput {
  repoId: string;
  zipBase64: string;
}

interface LightExtensionInspectSourceArchiveResult {
  files: LightExtensionTreeEntryInput[];
}
```

`inspectSourceArchive` is read-only: it verifies that the repository exists and is not archived, then reuses `parseLightExtensionSourceArchive()` for ZIP path, symlink, UTF-8, duplicate-path, file-count, byte-budget, and compression-ratio validation. It does not create a VSC commit, change Head, compile runtime artifacts, or update references.

After validation, repository workspaces replace the complete local working copy. Entry-bound workspaces replace only editable paths and preserve other read-only entries. An entry-bound import is rejected when the ZIP contains another managed entry or omits the currently bound `entryPath`. Import never saves automatically; the user must use the drawer footer **Save** action to create and compile a new version.

ZIP is an interactive import/export boundary, not the Agent local-edit workflow for an existing repository. Agent edits must use pull, full-workspace preview, and delta save so concurrency and Entry reconciliation remain explicit.

The first Agent workflow supports only complete UTF-8 text workspaces for JS Block and JS Page entries. It rejects `src/client/js-portals/**`, base64 or binary content, and does not treat ZIP or raw VSC operations as a CAS-protected authoring path.

Every authoring failure uses the single `LightExtensionProblem` contract. Source locations are one-based `range.start.line` and `range.start.column`; `snapshotId`, `requestId`, and `fingerprint` bind Problems to a specific check without persisting them in Entry records or runtime artifacts.

| Condition | Result |
| --- | --- |
| Valid repository ZIP | Replaces the complete unsaved editor working copy |
| Valid entry ZIP | Replaces writable entry/shared/root files and preserves read-only entries |
| Existing unsaved changes | Requires confirmation before opening the file picker |
| Missing repository | Returns `LIGHT_EXTENSION_REPO_NOT_FOUND` |
| Archived repository | Returns `LIGHT_EXTENSION_REPO_ARCHIVED` |
| Invalid or unsafe ZIP | Returns the existing source-archive validation error; editor state remains unchanged |
| Missing current entry or ZIP containing another managed entry | Client rejects the import; editor state remains unchanged |

Required cases:

- Good: export an unsaved entry working copy, then import it locally without creating a source version.
- Base: import shared and current-entry files while preserving other managed entries as read-only.
- Bad: reject missing-entry, cross-entry, archived-repository, traversal, symlink, duplicate-path, non-UTF-8, and over-budget archives without changing editor state or repository Head.

Primary assertion coverage:

```bash
yarn test packages/plugins/@nocobase/plugin-light-extension/src/client-v2/__tests__/RepoWorkspacePage.test.tsx --run --reporter=verbose
yarn test packages/plugins/@nocobase/plugin-light-extension/src/client-v2/__tests__/lightExtensionWorkspaceArchive.test.ts --run --reporter=verbose
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/inspect-source-archive.test.ts --run --reporter=verbose
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/source-archive.test.ts --run --reporter=verbose
```

## Entry Identity Contract

An entry has separate source, database, path, and display identities:

| Field | Contract |
| --- | --- |
| `entry.json.key` | Stable source identity. It must be a lowercase slug, remain unchanged when the entry directory moves, and be unique within one repository target and kind. |
| `lightExtensionEntries.id` / `entryId` | Local database identity used by runtime bindings, reference rows, logs, caches, and compiled artifacts. |
| `entryPath` | Mutable physical source location. Directory renames update this field without replacing `entryId`. |
| `title` | Mutable display label. It does not participate in identity matching. |

Workspace validation derives `entryName` only from `entry.json.key`. Entry reconciliation matches `repoId + target + kind + entryName`, so a stable key preserves the existing database `entryId` while `entryPath` changes. Duplicate keys fail validation with `duplicate_entry_key`.

**Move to light extension** writes the generated technical entry name to `entry.json.key`; the user only supplies the display title. Settings type generation also uses the key, so `light-extension:settings/client/<kind>/<key>` imports remain stable after directory renames.

Changing `entry.json.key` is an explicit identity replacement and may orphan existing bindings. Renaming only the directory is identity-preserving. Internal relative imports remain scoped to the physical entry root, and cross-entry sharing must continue through `src/shared`.

Compatibility cases:

| Case | Result |
| --- | --- |
| Keyed entry renamed | Reuses the existing `entryId`, updates `entryPath`, recompiles, and keeps runtime bindings active. |
| Duplicate key in two directories of the same kind | Save is rejected with validation Problems. |

Entries that were already split into stale and replacement database records before this contract was introduced are not automatically repaired or merged. The stable-key guarantee applies to moves and renames performed after this behavior is available.

Primary assertion coverage:

```bash
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/meta-validator.test.ts --run --reporter=verbose
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/entry-service-identity.test.ts --run --reporter=verbose
yarn test packages/plugins/@nocobase/plugin-light-extension/src/client-v2/__tests__/RepoWorkspacePage.test.tsx --run --reporter=verbose
```

## UI Integration Contract

Light extensions are selected from the code-source settings of existing JS Block, JS Item, JS Field, JS Column, JS Action, and value-return RunJS surfaces. JS Column reuses the `js-field` kind because both surfaces share the same render contract. The plugin must not inject light-extension entries into Add Block, Add Field, or Add Action menus. When an existing surface opens **Write JavaScript** with a light-extension binding, the editor opens that repository workspace at the bound `entryPath`.

An entry-bound workspace can edit the selected entry directory and files outside all managed entry roots, such as shared helpers and repository metadata. Other entries under `js-blocks`, `js-actions`, `js-items`, `js-fields`, and `runjs` remain viewable but read-only. Repository management opens the same workspace without this entry scope and retains full authoring access.

## Move RunJS Source Contract

The internal RunJS Studio toolbar registry allows this plugin to contribute **Move to light extension** without coupling the editor to light-extension APIs. The registry is a `globalThis` singleton so legacy and client-v2 bundles share the same contributions. Both the canonical client-v2 plugin and the legacy admin-shell bridge register the action; lifecycle cleanup remains identity-safe. The action is registered only when the host adapter supports `writeExternalBinding`.

The client calls `POST lightExtensions:moveSource` with the following payload:

```ts
interface LightExtensionMoveSourceInput {
  locator: RunJSSourceLocator;
  expectedOwnerFingerprint: string;
  sourceRepoId: string;
  sourceHeadCommitId: string | null;
  entryPath: string;
  version: string;
  files: Array<{ path: string; content: string; language?: string; mode?: string }>;
  destination:
    | { type: 'existing'; repoId: string }
    | { type: 'new'; name: string; title?: string | null; description?: string | null };
  entryName: string;
  entryTitle?: string | null;
}
```

`files` is the complete current editor workspace, including unsaved content. `.nocobase/runjs-source.json` is excluded during relocation. The selected `entryPath` becomes `src/client/<kind-root>/<entryName>/index.ts|tsx|js|jsx`; other files are relocated under the same entry, and relative imports between moved files are rewritten. Existing entry directories are never overwritten.

The move dialog exposes one human-readable name for the light extension and one kind-specific name for the moved JS surface. Repository and entry `title` values use those names directly. Stable lowercase repository and entry `name` values are derived internally for identifiers and source paths, so users do not need to manage separate name/title fields or slug rules.

The server executes these operations in one database transaction:

1. Resolve the trusted RunJS source adapter, check host write permission, read the current owner, and compare `expectedOwnerFingerprint`.
2. Derive the light-extension kind from the trusted owner metadata, relocate the workspace, and either create a repository or save into an existing repository.
3. Validate and compile the destination source, require the new entry to be healthy, and write `{ sourceMode: 'light-extension', sourceBinding }` back to the host through `writeExternalBinding`.
4. Rebuild the FlowModel reference index and return the repository, entry, binding, and new owner fingerprint.

If any step fails, destination source, compiled artifacts, host binding, and reference indexes roll back together. The host keeps its previous inline `code`, `version`, and `sourceRef` fields as a compatibility fallback after the external binding is written.

### Supported hosts

| RunJS locator | Derived light-extension kind | Move action |
| --- | --- | --- |
| `flowModel.step` with `JSBlockModel` | `js-block` | Supported |
| `flowModel.step` with JS Field/Action/Item owner metadata | `js-field`, `js-action`, or `js-item` | Supported |
| `flowModel.nestedRunJS` with a value-return RunJS host | `runjs` | Supported |
| Workflow JavaScript, chart option/events, or FlowRegistry RunJS | N/A | Not exposed; adapter has no external-binding writer |

### Validation and errors

| Condition | Error | HTTP status |
| --- | --- | --- |
| Invalid locator, path, entry slug, entry file, or destination payload | `LIGHT_EXTENSION_INVALID_INPUT` | 400 |
| Owner fingerprint changed before or during the move | `LIGHT_EXTENSION_BINDING_OUTDATED` | 409 |
| Target entry name/path already exists | `LIGHT_EXTENSION_ENTRY_CONFLICT` | 409 |
| Host write permission is denied | `LIGHT_EXTENSION_PERMISSION_DENIED` | 403 |
| Relocated workspace does not validate or compile | `LIGHT_EXTENSION_VALIDATION_FAILED` | 422 |
| RunJS/VSC service or source operation fails | `LIGHT_EXTENSION_RUNTIME_UNAVAILABLE` or `LIGHT_EXTENSION_SOURCE_ERROR` | 409 or source-derived status |

### Required cases

- Good: move a multi-file workspace with unsaved changes into a new repository; compile it and update the host binding.
- Base: move into an existing repository with an unused entry slug; preserve unrelated repository files and entries.
- Bad: reject stale fingerprints, missing permission, unsupported hosts, invalid workspaces, and entry conflicts without changing destination or host state.

Primary assertion coverage:

```bash
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/move-source.test.ts --run --reporter=verbose
yarn test packages/plugins/@nocobase/plugin-light-extension/src/client-v2/__tests__/move-source.test.tsx --run --reporter=verbose
yarn test packages/plugins/@nocobase/plugin-light-extension/src/client-v2/vsc-file/runjs-studio/__tests__/RunJSStudioToolbarRegistry.test.tsx --run --reporter=verbose
```

## Remote Sync Facade

Light-extension remote synchronization is exposed through the `lightExtensionSync` Resource. It is the public domain facade over the internal VSC `RemoteSyncRuntime`; raw VSC remote collections and internal Resources are deliberately denied to clients.

The facade supports `get`, `configure`, `disconnect`, `testConnection`, `plan`, `pull`, `push`, and `createFromGit`. Requests use the light-extension repository id and strict input allowlists. Responses contain safe source summaries, masked credential-reference displays, and planner results without raw tokens, internal VSC repository ids, remote ids, job claims, or inbound snapshot handles.

Ownership is split as follows:

- The internal VSC module owns adapters, normalized provider configuration, durable jobs, commit mappings, conflicts, planning, Push, Pull discovery, and recovery primitives.
- The Light Extension domain owns remote-to-light-extension validation, compilation, atomic Head advancement, runtime artifact replacement, reference rebuilds, and Pull recovery.
- The local light-extension VSC repository remains the runtime source. Remote synchronization exchanges snapshots; it does not expose or reproduce full Git history.

The synchronization ACL actions are scoped independently:

- `manageSyncSource` controls configuration, connection tests, and disconnect, and also grants `get`/Plan visibility.
- `pullFromSyncSource` controls Pull and grants `get`/Plan visibility.
- `pushToSyncSource` controls Push and grants `get`/Plan visibility.
- `createFromGit` requires `create`, `manageSyncSource`, and `pullFromSyncSource`.

Repository configuration, disconnect, archive, and delete are rejected with `LIGHT_EXTENSION_SYNC_BUSY` while a remote job is `pending`, `running`, or `finalize-pending`. Push and Pull also require the exact Head, remote revision, remote-target version, and plan fingerprint returned by the latest Plan.

GitHub credentials are optional for public Pull discovery. Private Pull and all Push operations require a complete `{{ $env.NAME }}` reference to an existing Variables and secrets record with `type=secret`. Raw credential values are never stored in light-extension configuration or returned to clients.

Primary assertion coverage:

```bash
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/sync-contract.test.ts --run
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/sync-resource.test.ts --run
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/create-from-remote.test.ts --run
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/remote-pull-service.test.ts --run
yarn test packages/plugins/@nocobase/plugin-light-extension/src/client-v2/__tests__/LightExtensionSyncDrawer.test.tsx --run
yarn test packages/plugins/@nocobase/plugin-light-extension/src/client-v2/__tests__/LightExtensionGitSourceFields.test.tsx --run
```

## Compatibility and Rollout

- Existing inline JS surfaces require no migration. Missing `sourceMode` continues to mean inline.
- Active light-extension bindings keep retained inline code only as compatibility fallback; source edits must go through the repository domain.
- `plugin-light-extension` must be enabled before Light Extension or RunJS workspace repository APIs are used.
- Do not delete persisted `sourceBinding` data during rollback. Failed saves are transactionally rolled back; successful source versions are reverted by creating a normal new commit from the desired historical source.
