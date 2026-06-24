# Future RunJS And Remote Sync Roadmap

## Status And Scope

This document is roadmap-only. All future roadmap items in this document are
outside Phase 1 and must not be treated as dependencies for the Phase 1 plugin.

Phase 1 remains self-contained. It depends only on the existing VSC file
collections, server services, and the `vscFile` resource actions already built
for local repository, draft, commit, ref, restore, and diff workflows.

## Phase 1 Baseline To Preserve

Future phases should build on the current Phase 1 API instead of replacing it.
The stable local editing surface includes:

- Repository lifecycle: `createRepository`, `ensureRepository`, get repository,
  and archive repository.
- Read operations: `pull`, `getFile`, `listCommits`, and `getCommit`.
- Draft operations: `getDraft`, `saveDraft`, and `discardDraft`.
- Write operations: `push`.
- Diff operations: `diff`, `diffDraft`, and `diffFile`.
- Ref and restore operations: `listRefs`, `updateRef`, `restoreFile`, and
  `restoreCommit`.

The built-in refs are `head` and `published`. Future runtime execution should
default to the `published` ref so code that is merely drafted or committed to
`head` does not become runtime-active by accident.

## Phase 2: RunJS Integration

Phase 2 is non-Phase-1 future work. It should add a modern RunJS-backed editor
path while preserving legacy data readability.

Required behavior:

- Keep the legacy single-field `code` value readable for existing records.
- On first modern editor open, create or ensure a VSC repository for that owner
  record using the existing Phase 1 repository API.
- Map legacy single-file code into `src/main.ts` when seeding the first VSC
  repository tree.
- Let RunJS own compilation, type checking, sourcemaps, sandboxing, and runtime
  APIs. The VSC file plugin should store source state and refs, not duplicate
  RunJS runtime responsibilities.
- Use `published` as the default runtime ref.

Phase 2 must not require remote tables, remote adapters, Zip import/export, or
conflict UI.

## Phase 3: Remote Adapter Framework

Phase 3 is non-Phase-1 future work. It should introduce remote synchronization
infrastructure without binding the core local repository service directly to one
provider.

Planned collections:

- `vscFileRemotes`: remote configuration records for a VSC repository.
- `vscFileSyncJobs`: durable sync job state and retry metadata.
- `vscFileExternalCommitMaps`: mapping between local commit IDs and provider
  commit IDs or object IDs.
- `vscFileConflicts`: optional conflict records for later pull and
  bidirectional sync phases.

Planned server shape:

- Add an adapter registry keyed by remote provider type.
- Define a provider-neutral adapter contract for push, pull discovery, commit
  mapping, and capability reporting.
- Add `MockRemoteAdapter` for CI and deterministic integration tests before
  real network providers are enabled.
- Store provider credentials only by reference. `vscFileRemotes.config` must
  not contain raw tokens, private keys, deploy keys, refresh tokens, or other
  secret material. Remote records should hold an `authRef` that resolves through
  the platform credential store.

Phase 3 must not change the Phase 1 local write path or make Phase 1 startup
depend on remote provider SDKs.

## Phase 4: GitHub/GitLab Push-Only

Phase 4 is non-Phase-1 future work. It should add provider adapters for
push-only publication to GitHub and GitLab after the remote framework exists.

Required constraints:

- Push only when the target remote ref can be advanced by fast-forward.
- Do not perform force push.
- Reject or surface local outdated and remote advanced states instead of
  overwriting remote history.
- Use `authRef` for credentials. Never store raw tokens or keys in
  `vscFileRemotes.config`.
- Keep GitHub and GitLab API usage out of Phase 1 code paths, tests, and setup.

## Phase 5: Pull And Bidirectional Sync

Phase 5 is non-Phase-1 future work. It should add inbound remote changes only
after push-only behavior is stable.

Required behavior:

- Detect local outdated state before applying remote changes.
- Detect remote outdated state before pushing local changes.
- Write conflict records when automatic resolution is unsafe.
- Preserve local commit history; do not rewrite existing Phase 1 commits.
- Leave manual conflict UI to a separate client task. Server conflict records
  should be usable by that future UI, but Phase 5 should not require the UI to
  exist first.

## Future Zip Import And Export

Zip import/export is non-Phase-1 future work and should remain separate from
remote adapters.

Recommended scope:

- Export a repository tree or commit as a Zip archive for offline backup or
  download.
- Import a Zip archive into a draft or new commit through the existing local
  tree and push services.
- Enforce Phase 1 path normalization, file-size limits, repository aggregate
  limits, and duplicate/case-conflict checks during import.
- Do not model Zip import/export as a remote provider, and do not require
  `vscFileRemotes`, `vscFileSyncJobs`, or provider credentials for Zip flows.

## Non-Phase-1 Guardrails

These items are explicitly outside Phase 1:

- Remote tables, including `vscFileRemotes`, `vscFileSyncJobs`,
  `vscFileExternalCommitMaps`, and `vscFileConflicts`.
- GitHub and GitLab APIs.
- RunJS migration and modern-editor repository seeding.
- Zip import/export.
- Conflict UI and manual conflict resolution workflows.

No Phase 1 task should depend on remote tables, GitHub/GitLab APIs, RunJS
migration, Zip import/export, or conflict UI. Phase 1 should continue to pass
with only the existing local VSC file collections and services.

Credential rule for every future remote phase: tokens, keys, and other secrets
must not be stored directly in `vscFileRemotes.config`; store only an `authRef`
and resolve it through the platform credential store at execution time.
