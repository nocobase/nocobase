# Remote Sync Roadmap

## Implemented contract

The provider-neutral remote framework is implemented in `plugin-vsc-file`. It adds:

- `vscFileRemotes` for normalized provider configuration and credential references.
- `vscFileSyncJobs` for durable, idempotent Push and Pull work with claims, leases, retries, and recovery phases.
- `vscFileExternalCommitMaps` for local commit, remote revision, and content-hash baselines.
- `vscFileConflicts` for divergence and other states that cannot be reconciled safely.
- `RemoteSyncAdapterRegistry`, `SyncStatePlanner`, `VscRemotePushService`, `VscRemotePullDiscoveryService`, and startup reconciliation.
- A deterministic adapter for contract tests and a GitHub.com adapter for snapshot discovery and publication.
- A narrow `RemoteSyncRuntime` facade for owner plugins. Raw remote collections and internal Resources are not public integration APIs.

The planner reports `unconfigured`, `in-sync`, `local-ahead`, `remote-ahead`, `diverged`, or `error`. Push and Pull execute only against the exact local Head, remote revision, remote-target version, and plan fingerprint that the caller reviewed.

## Ownership boundary

`plugin-vsc-file` owns provider-neutral persistence, adapter registration, snapshot hashing, planning, durable jobs, compare-and-set publication, mappings, conflicts, and recovery. Provider SDKs and network clients stay behind the adapter boundary.

Inbound apply is owner-specific. `VscRemotePullDiscoveryService` can fetch and pin a remote snapshot, but only the owning domain plugin can validate, compile, and commit that snapshot through its normal local transaction path. For light extensions, `plugin-light-extension` performs that apply and returns only safe domain DTOs.

The local VSC repository remains the authoritative runtime source. Synchronization exchanges source snapshots and external revision mappings; it does not mirror complete Git history.

## Consistency and recovery semantics

- Remote publication uses compare-and-set against the expected revision, including `null` for an empty branch.
- Jobs in `pending`, `running`, or `finalize-pending` block remote reconfiguration, disconnect, repository archive, and repository deletion.
- A remote that advanced after planning is never overwritten. The caller must refresh the plan and retry.
- `finalize-pending` work is reconciled without repeating a provider-side publication that already succeeded.
- Pull discovery pins a snapshot before owner-specific validation and apply. Stale claims, expired leases, changed targets, or changed Heads stop the operation.
- Divergence creates a provider-neutral conflict instead of choosing a winner or merging automatically.
- Initial binding can map identical content or sync when one side is empty. Different non-empty snapshots produce `initial-ambiguous`.

Provider SDKs and network access never enter local save, compile, history, ZIP import/export, or runtime resolution paths. A provider outage cannot block local authoring.

## First-release provider scope

The first provider is GitHub.com over HTTPS. It supports one repository, one branch, and an optional subdirectory per local repository. Pull and Push synchronize snapshots without force-pushing.

The first release does not support GitHub Enterprise, GitLab, SSH, Git Smart HTTP, GitHub Apps, Git LFS, submodules, tags, multiple remotes, Webhooks, scheduled synchronization, automatic merging, or force push.

## Future work

- Provider adapters beyond GitHub.com.
- A dedicated conflict-resolution UI backed by `vscFileConflicts`.
- Explicit scheduling or Webhook orchestration after retry, permission, and operational policies are defined.
- Additional reconciliation strategies that preserve the current no-force and owner-specific apply boundaries.
- Operational inspection tools for jobs, mappings, and conflicts without exposing raw internal Resources to domain users.
