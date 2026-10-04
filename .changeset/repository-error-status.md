---
'@nocobase/repository-input': minor
'@nocobase/db': minor
'@nocobase/app-server': major
'@nocobase/app-plugin-repository-example': patch
---

Every `RepositoryError` now carries a `status`, the canonical error status its code maps to through the new `repositoryErrorStatuses` table exported by `@nocobase/db` (`INVALID_ARGUMENT`, `PERMISSION_DENIED`, `NOT_FOUND`, `ABORTED` or `INTERNAL`). The table is typed over every `RepositoryErrorCode`, so a new code does not compile until it has a status.

`@nocobase/app-server` reads that status instead of keeping its own list of codes, so a code added to the Repository reaches an `/api` caller with the status chosen for it. Two answers change:

- `RELATION_TARGET_NOT_FOUND` is `400 INVALID_ARGUMENT` instead of `404`: the missing target is one the request body names, not the resource in the URL.
- `INVALID_WRITE_POLICY` is an opaque `500 INTERNAL` instead of `400`: write policies are server-owned, so an invalid one is a server misconfiguration.

Every Repository error a caller sees now carries its `path` and `details` in `metadata`, not only the write-forbidden codes, and an `INVALID_ARGUMENT` one also names its path in `fieldViolations`.
