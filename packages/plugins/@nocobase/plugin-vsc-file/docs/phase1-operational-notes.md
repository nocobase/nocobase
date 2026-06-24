# Phase 1 Operational Notes

## Default Limits

The server exports `vscFileServerDefaults` from `src/server/config.ts`. The
limits currently come from `src/shared/constants.ts`.

| Limit | Default |
| --- | ---: |
| Max file size | 1 MiB |
| Max files per repository tree | 200 |
| Max repository text size | 10 MiB |
| Diff max file size | 1 MiB |
| Max commit message length | 4000 characters |
| Max path length | 512 characters |
| Commit history default page size | 50 |
| Commit history max page size | 200 |

Writes above the file-size limit return `FILE_TOO_LARGE`. Repository tree
limits return `REPO_LIMIT_EXCEEDED`. Diff requests above the diff file-size
limit return a cutoff response with `tooLarge: true` and no hunks.

## Recommended Metrics

Phase 1 does not ship production metrics exporters. When metrics are added,
prefer names that track the public service operations and limit rejections:

| Metric | Type | Purpose |
| --- | --- | --- |
| `nocobase_vsc_file_repository_total` | gauge | Active repositories by owner type and status. |
| `nocobase_vsc_file_push_total` | counter | Push attempts by result code. |
| `nocobase_vsc_file_push_duration_ms` | histogram | End-to-end push latency. |
| `nocobase_vsc_file_pull_duration_ms` | histogram | Pull latency by include-content mode. |
| `nocobase_vsc_file_diff_duration_ms` | histogram | Commit and file diff latency. |
| `nocobase_vsc_file_blob_bytes_total` | gauge | Stored blob bytes. |
| `nocobase_vsc_file_tree_entries_total` | gauge | Stored tree-entry rows. |
| `nocobase_vsc_file_limit_rejections_total` | counter | Rejections by VSC error code and limit name. |
| `nocobase_vsc_file_conflict_total` | counter | Base commit, ref, and sequence conflicts. |

## Future Blob And Tree GC

Blob and tree garbage collection should be mark-and-sweep based. The mark phase
should start from repository heads, published refs, all retained commits, and
active drafts. The sweep phase should delete unreachable tree entries, trees,
and blobs in small batches after a grace period.

Recommended safeguards:

- Add dry-run mode that reports candidate counts and byte totals.
- Keep a grace period so recently abandoned transactions or drafts are not
  removed too early.
- Delete tree entries before trees, and delete blobs only after checking no tree
  entries or draft files reference them.
- Emit per-batch counters and failure logs.

## Future Cleanup Jobs

Cleanup jobs should be separate from request paths. Candidate jobs include:

- Expire stale active drafts that have not changed for the configured retention
  window.
- Compact archived repositories after audit-retention requirements are met.
- Remove orphaned refs, draft files, tree entries, and blobs after integrity
  checks.
- Trim old operational audit rows once external audit retention is available.

Run cleanup in bounded batches with explicit locking or idempotent cursors so a
restart can safely resume work.
