# Future Remote Sync Roadmap

## Current baseline

The local VSC and RunJS integration described below is implemented today; it is not future work:

- Versioned repositories with immutable commits, a single `head` ref, raw VSC base-commit checks, history, diff, restore, and archive operations.
- RunJS source adapters that seed legacy single-file code into a multi-file workspace and save compiled artifacts back to the owning surface.
- JavaScript and TypeScript parsing/transpilation with static relative modules and explicit compiler diagnostics.
- ZIP import/export with normalized paths, file-count limits, per-file limits, aggregate uncompressed-size limits, and duplicate-path rejection.
- RunJS Studio saves are serialized against the current server head; owner/source divergence still has explicit recovery choices.

The responsibility boundary is:

- `plugin-vsc-file` owns source workspaces, commits, refs, ZIP transport, raw VSC concurrency guards, serialized RunJS Studio saves, and the shared RunJS compilation orchestration.
- RunJS source adapters own reading and atomically updating the host record.
- FlowEngine owns execution and runtime context APIs.
- The current compiler is intentionally smaller than a full TypeScript project service. See the package README for the exact module and type-checking limits.

## Remote adapter framework

Remote synchronization is implemented in phases without changing the local write path or making local startup depend on provider SDKs. The provider-neutral framework belongs to `plugin-vsc-file`; domain plugins such as `plugin-light-extension` expose narrow facades and must not create parallel remote, job, mapping, or conflict persistence.

The local VSC repository remains the authoritative runtime source. Remote providers exchange source snapshots and external revision mappings; they do not mirror complete Git history and cannot bypass the existing local commit, compilation, or atomic host-apply paths.

Planned persistence:

- `vscFileRemotes`: provider-neutral remote configuration for a VSC repository.
- `vscFileSyncJobs`: durable sync state and retry metadata.
- `vscFileExternalCommitMaps`: mappings between local and provider commit IDs.
- `vscFileConflicts`: remote divergence records that cannot be resolved safely.

Planned server shape:

- Add an adapter registry keyed by provider type.
- Define provider-neutral push, pull-discovery, commit-mapping, and capability contracts.
- Add a deterministic mock adapter before enabling real providers.
- Store credentials only by reference. Remote records must contain an `authRef`, never raw tokens, keys, or refresh secrets.
- Resolve `authRef` only from a complete `{{ $env.NAME }}` expression backed by a Variables and secrets record with `type=secret`.
- Require every adapter to normalize `unknown` provider configuration with a strict runtime parser that rejects unknown fields.
- Expose remote operations to domain plugins through the narrow `RemoteSyncRuntime` contract instead of collection or provider access.
- Keep provider HTTP clients, SDKs, database objects, and domain services outside adapter contracts.
- Convert provider failures into new safe domain errors without retaining the original error, cause, request, response, headers, configuration, or credential data.

## GitHub push-only

The first provider phase targets GitHub.com and is push-only:

- Advance the target remote ref only when it is a fast-forward.
- Never force-push or rewrite local history.
- Reject and surface remote-advanced or local-outdated states.
- Keep provider API clients outside the local repository and compilation paths.
- Bind one local repository to one remote repository, one fixed branch, and an optional subdirectory.
- Use compare-and-set publication against the expected remote revision, including `null` for a branch that does not yet exist.
- Treat GitLab, GitHub Enterprise, custom API hosts, SSH, Git Smart HTTP, GitHub Apps, tags, submodules, Git LFS, and multiple remotes as later work.

## Pull and bidirectional sync

Inbound synchronization should follow only after push-only behavior is stable:

- Detect local and remote divergence before applying changes.
- Preserve existing local commits and refs.
- Persist conflicts when automatic reconciliation is unsafe.
- Keep manual conflict UI as a separate client concern backed by provider-neutral conflict records.

## Operational guardrails

- Remote tables and provider SDKs must remain optional.
- Network failures must not block local editing, compilation, history, ZIP import/export, or saving.
- Sync jobs must be idempotent and resumable, with bounded retries and explicit cursors.
- Running jobs must use expiring leases, and remote identity changes or deletion must not race active or finalize-pending work.
- Tokens, keys, and other credentials must never be logged or stored directly in remote configuration.
- Initial binding may push to an empty target or record an identical snapshot. If both sides already contain different snapshots, report `initial-ambiguous` instead of silently overwriting either side.
