# @nocobase/plugin-vsc-file

Stores versioned source workspaces and provides the RunJS Studio repository API.

RunJS workspaces accept JavaScript and TypeScript syntax, including local module imports. TypeScript is parsed and
transpiled for runtime execution; this plugin does not currently perform project-wide semantic type checking.

## Version model

- Each repository has one current ref: `head`.
- Every successful push or RunJS save creates an immutable commit and atomically advances `head`.
- There is no persisted draft state and no separate published ref. Unsaved editor changes exist only in browser memory.
- RunJS save locks the repository at its current `head`, compiles the submitted workspace snapshot, creates the commit,
  writes the runtime artifact to its owning surface, and updates commit metadata in one database transaction.
- Existing browser RunJS Studio clients remain backward compatible when they omit Agent concurrency fields. Public
  Agent authoring must pass the opened repository Head and owner fingerprint; stale evidence returns HTTP 409 instead
  of silently replacing a newer workspace. A save without file changes returns `RUNJS_SAVE_NO_CHANGES`.
- After `runJSSources:save` or `runJSSources:importZip` succeeds, the server transaction is the only persistence path.
  The editor may refresh local host state through `onPersistedChange`, but must not issue a second full host-model save.
- Head advancement also requires the repository to remain `active`. If an archive wins after a writer read an older
  active snapshot, the write transaction rolls back with `REPO_ARCHIVED`; repository Head and its `head` ref stay put.

## Uninitialized FlowModel RunJS sources

New JS blocks, fields, items, and actions can open RunJS Studio before their `runJs` step params have been persisted.
The client calls `runJSSources:open` with the normal `locator` plus the current editor value:

```ts
{
  locator: RunJSSourceLocator;
  initialSource?: { code: string; version: string };
}
```

The FlowModel adapter marks only recognized `runJs.code` surfaces as `uninitialized`. In that state, `open` uses
`initialSource` to initialize the workspace while keeping the server-generated owner fingerprint. A later
`runJSSources:save` writes the compiled artifact and creates the previously missing step path in the same transaction.

- Good: a new `JSBlockModel` at `jsSettings.runJs.code` opens with its current default code and can be saved.
- Base: an existing persisted source ignores `initialSource` and remains server-authoritative.
- Bad: unknown flow, step, or parameter paths still return `RUNJS_SOURCE_NOT_FOUND`; malformed `initialSource` returns
  `RUNJS_SOURCE_LOCATOR_INVALID`.

Regression coverage lives in `plugin-vsc-file`'s `RunJSStudioProvider.test.tsx` and `plugin-flow-engine`'s
`runjs-sources.adapters.test.ts`.

## RunJS Studio source API

The RunJS Studio source API exposes only owner-aware operations. Raw VSC actions, ZIP import/export, and restore
actions remain internal. An active light-extension owner is rejected by the permission boundary and must use
`plugin-light-extension` APIs.

`open-latest` is a read-only discovery operation. If no persisted workspace exists, it returns a virtual repository
with empty `id`/`repoId`, `headCommitId: null`, and files materialized from the current inline owner without creating
repository state. Ordinary inline authoring should continue through Flow Surfaces unless the user explicitly starts
the separate `open`/restore workflow.

For an existing persisted workspace, repository source is the authoring truth:

- Preview and save the same complete target `files` snapshot. Every existing path omitted from the snapshot is
  deleted; this is not the light-extension delta-save contract.
- Preserve `.nocobase/runjs-source.json`, the selected entry path, runtime version, and every unchanged file.
- `save` requires `baseCommitId` and `baseOwnerFingerprint` from the same `open`/`open-latest` response. Both checks run
  after the repository is locked. `BASE_COMMIT_OUTDATED` and `RUNJS_SOURCE_OWNER_OUTDATED` return HTTP 409.
- After a conflict, reopen, rebuild the full snapshot, and preview again. Do not update only the guard values on a
  stale candidate.
- Completion requires the returned commit/artifact and the owning Flow Surface runtime code/version/fingerprint to
  agree.

## Current module boundary

- Supported source files: `.ts`, `.tsx`, `.js`, `.jsx`, and `.json`.
- Imports must be static, relative, and stay inside the workspace. Default imports, named imports, and type-only imports are supported.
- Package imports, dynamic imports, namespace imports, CommonJS export assignments, export lists/re-exports, and circular module graphs are rejected.
- Compilation validates syntax and the RunJS authoring contract, then emits the runtime artifact. It does not create a TypeScript `Program`, resolve external declaration packages, or provide full semantic type checking.
- The generated line map composes the module transform with TypeScript's transpile source map at line granularity. Synthetic wrapper/import/export lines and column-level locations remain best-effort.

## Remote sync boundary

This package owns the provider-neutral remote synchronization framework used by domain plugins:

- `vscFileRemotes`, `vscFileSyncJobs`, `vscFileExternalCommitMaps`, and `vscFileConflicts` persist remote targets, durable work, synchronization baselines, and unresolved divergence.
- `RemoteSyncAdapterRegistry` isolates provider implementations. The built-in GitHub adapter and its HTTP client do not participate in local save or compile paths.
- `SyncStatePlanner` compares the local snapshot, remote snapshot, and last mapped baseline without selecting a domain-specific merge policy.
- `VscRemotePushService` publishes with compare-and-set semantics and never force-pushes.
- `VscRemotePullDiscoveryService` pins and validates inbound snapshots, then hands them to an owner-specific apply callback. The owner plugin remains responsible for compiling and committing the snapshot through its normal transaction path.
- `RemoteReconcileService` recovers durable Push work after interruption. Owner plugins recover Pull apply work because only they can safely rebuild their runtime artifacts.

Domain plugins integrate through `RemoteSyncRuntime`. They must not use the remote collections, internal Resources, provider clients, job claims, or Pull handles as public APIs. Credentials are stored only as `authRef` expressions and are resolved at execution time from a Variables and secrets record whose type is `secret`.

The first provider supports GitHub.com snapshot synchronization for one branch and an optional subdirectory. GitHub Enterprise, GitLab, SSH, Git LFS, submodules, Webhooks, schedules, automatic merging, force push, and full Git history mirroring are outside the first-release contract. See [the remote sync roadmap](./docs/future-runjs-remote-roadmap.md) for the boundary and future work.

Primary assertion coverage:

```bash
yarn test packages/plugins/@nocobase/plugin-vsc-file/src/server/remotes/__tests__/RemoteSyncAdapterRegistry.test.ts --run
yarn test packages/plugins/@nocobase/plugin-vsc-file/src/server/remotes/__tests__/SyncStatePlanner.test.ts --run
yarn test packages/plugins/@nocobase/plugin-vsc-file/src/server/remotes/__tests__/VscRemotePushService.test.ts --run
yarn test packages/plugins/@nocobase/plugin-vsc-file/src/server/remotes/__tests__/VscRemotePullDiscoveryService.test.ts --run
yarn test packages/plugins/@nocobase/plugin-vsc-file/src/server/remotes/providers/github/__tests__/GitHubRemoteAdapter.test.ts --run
yarn test packages/plugins/@nocobase/plugin-vsc-file/src/server/__tests__/remote-plugin-bootstrap.test.ts --run
```
