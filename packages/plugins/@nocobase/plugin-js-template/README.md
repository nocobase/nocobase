# JS Templates

`@nocobase/plugin-js-template` is the sole implementation package for project-backed, multi-file RunJS authoring in NocoBase.

## Domain boundaries

- A JS Template project is not a NocoBase plugin package and has no plugin lifecycle hooks
- Templates cannot define collections, migrations, server resources, middleware, ACL rules, app providers, or package dependencies
- The Source Project tree is authoritative only for source files and Template descriptor metadata
- Runtime Artifacts are derived compile outputs; successful saves replace affected artifacts, while failed saves keep the previous artifacts active
- Usage records are derived from Host bindings rather than owned by the Source Project tree
- Host settings overrides belong to each Host and are not Template descriptor or Runtime Artifact state
- Project creation and source changes are compile-gated and atomic
- Runtime resolution is available to logged-in page users; authoring and project management require `pm.js-template`
- The legacy admin shell only provides the settings-page bridge needed during the client-v2 transition

JS Templates does not create Source Projects or detach code to Inline automatically. Both operations require an explicit authoring action.

The plugin also owns the RunJS multi-file and TypeScript authoring layer. Disabling it removes Studio, Workspace APIs, and JS Template settings, while the Flow Engine keeps the legacy single-file Inline RunJS runtime and editor behavior available.

## Template and UI contract

JS Template supports four Template kinds:

| Template kind | JS surface | Source root |
| --- | --- | --- |
| `js-block` | JS Block | `src/client/js-blocks/<entry-name>/` |
| `js-field` | JS Field, editable JS Field, and JS Column | `src/client/js-fields/<entry-name>/` |
| `js-action` | JS Action families | `src/client/js-actions/<entry-name>/` |
| `js-item` | JS Item families | `src/client/js-items/<entry-name>/` |

JS Column reuses `js-field`; `category: "js-column"` provides column-specific presentation. Generic JavaScript in defaults, assignment rules, linkage rules, custom variables, workflow nodes, charts, and similar nested settings remains inline-only.

JS Page is not supported. Page composition remains a Flow Engine concern; JS Templates provide only the four Host kinds listed above.

Selecting a Template creates the standard JS model shape with a source binding. The plugin does not add parallel JS Template model classes. Direct-create menus cover blocks, supported actions, form/details fields, and table columns.

`entry.json.key` is the stable source identity. It must be a lowercase slug and unique within the project and kind. Renaming a directory while keeping the key preserves `templateId`, runtime bindings, and usages; changing the key creates a new identity.

## Inline and project source

Existing inline JS behavior remains unchanged:

- Missing `sourceMode` means `inline`
- `sourceMode: "inline"` executes the owner's inline code
- `sourceMode: "js-template"` resolves the bound Template artifact
- A bound owner retains its previous inline `code`, `version`, and `sourceRef` as an inactive fallback snapshot
- Editing the retained snapshot does not change the active runtime while the Template binding remains active

Inline RunJS workspaces use `runJSSources:open` or `runJSSources:openLatest`, followed by delta `runJSSources:saveChanges`. Omitted paths remain unchanged, deletions require `operation: "delete"`, and updates carry the opened file's `blobHash`.

Project-backed source uses the JS Template domain APIs. Raw `runJSSources`, VSC resources, direct artifact writes, and ZIP round-trips are not alternate save paths for an active project.

## Runtime Artifact lifecycle

Runtime Artifacts are immutable, content-addressed compile outputs. An enabled Template resolves to an Artifact hash, and the hash URL returns the corresponding output with `Cache-Control: private, max-age=31536000, immutable`. Disabling the Source Project blocks new Template resolution, but a direct request for a known hash remains available while the Artifact row exists; the Artifact route does not repeat the Project lifecycle check.

Deleting a Template removes its Artifact row only when no other Template references that hash. A shared Artifact remains available until its last reference is deleted. Once the row is removed, a subsequent request that reaches the origin returns `404`; database deletion can affect only later origin requests. It cannot revoke a response that a browser or intermediary has already cached or delivered. Although `private` tells shared caches not to store the response, Runtime Artifacts must never contain credentials, temporary tokens, or other secrets whose revocation depends on deleting the database row.

## Check and Save

The project authoring flow is:

1. Pull the project or bound Template and retain its Head as `expectedHeadCommitId`
2. Send the complete working copy to `jsTemplates:compileWorkspacePreview`
3. Stop on HTTP 207 or 422; Check never persists source or executes the returned artifact
4. Send only the reviewed delta to `jsTemplateFiles:saveSource` with the unchanged `expectedHeadCommitId`
5. On HTTP 409, pull again and rebuild the candidate from the new Head

Save materializes the complete candidate before validating and compiling it. The commit transaction rechecks the Head, then commits source, Template rows, immutable artifacts, usages, and audit state together.

The Source Projects settings page is the project-management entry. Create a Source Project explicitly, then add another Template either by saving a RunJS workspace into an existing destination with **Save as JS Template** or by adding its source and `entry.json` descriptor to the project workspace. Both paths preserve sibling Templates, shared source, project metadata, and history while applying the same validation, compile, reconcile, Usage, Audit, and atomic Head-CAS save chain.

| Result | Contract |
| --- | --- |
| Valid delta | Source Head and affected runtime artifacts advance together |
| Validation or compile failure | Returns HTTP 422 without changing source, Head, artifacts, Templates, or usages |
| Stale Head | Returns HTTP 409 without reusing the stale candidate |
| Empty delta | Returns the VSC `NO_CHANGES` error |

The canonical CLI follows the same pull, Check, and delta Save contract:

```bash
nb js-template pull --project <project-id> --template <template-id> --dir ./workspace
nb js-template check --dir ./workspace --json-output
nb js-template save --dir ./workspace --yes --json-output
```

## Save and detach RunJS sources

**Save as JS Template** saves the complete current workspace, including unsaved files, as a JS Template in a new or existing Source Project. The server derives the Template kind from trusted owner metadata, checks the owner fingerprint and destination Head, relocates relative imports, validates and compiles the candidate, then updates the destination and host binding atomically.

**Detach to Inline** copies the reachable Template files from the committed Source Project Head back to the owner and clears the external binding. It does not copy unsaved editor state or silently restore the older fallback snapshot.

Both directions support `flowModel.step` owners for JS Block, JS Field/Column, JS Action, and JS Item. Unsupported or permission-denied Hosts do not expose the conversion actions. A failed conversion leaves Source Project source, artifacts, Host state, and usages unchanged.

## Workspace ZIP safety

Project workspace ZIP export packages the current working copy, including unsaved editor content. Template-scoped export includes only writable paths. Inline RunJS workspace export packages the repository Head, or the legacy inline source when no repository exists, so it does not include unsaved editor changes.

ZIP import is inspected before editor state changes. Inspection rejects traversal, absolute paths, symlinks, duplicate paths, invalid UTF-8, excessive file counts or byte sizes, and unsafe compression ratios. It is read-only and never creates a commit, changes Head, compiles artifacts, or saves automatically.

Project imports replace the local working copy. Template-scoped imports preserve other managed Templates and reject archives that omit the current Template or contain another managed Template.

## Git synchronization safety

`jsTemplateSync` is the public Git synchronization API. Its only provider is `git`; GitHub, GitLab, Gitea, Bitbucket, Azure DevOps, and self-hosted Git services are addressed through standard HTTP or HTTPS URLs. It supports configuration, connection tests, Plan, Pull, Push, disconnect, and project creation from Git without exposing internal VSC records or job state.

The ACL actions are independent:

- `manageSyncSource` controls configuration, connection tests, disconnect, and Plan visibility
- `pullFromSyncSource` controls Pull and Plan visibility
- `pushToSyncSource` controls Push and Plan visibility
- `createFromGit` requires project creation, sync management, and Pull permissions

Push and Pull require the exact local Head, remote revision, target version, and plan fingerprint returned by the latest Plan. Configuration changes, disconnect, and delete are blocked while a sync job is active. Push uses an explicit lease and refuses to overwrite a branch that changed after Plan.

Git credentials are optional. Private HTTPS requires a complete `{{ $env.NAME }}` reference to a Secret JSON value containing `kind: "https"`, `username`, and `password`; literal credentials are rejected and only the Secret reference is stored in the remote record. HTTP is restricted to public repositories and rejects every authentication reference or credential input.

New requests do not send a `transport` field; the server derives `http` or `https` from the repository URL. For compatibility, a legacy matching HTTP/HTTPS `transport` value is accepted and ignored, while a mismatching or unknown value is rejected. SSH URLs and SSH execution are not supported. Existing legacy SSH records remain readable so administrators can inspect, disconnect, or delete them, but they cannot be tested, planned, pulled, pushed, or executed. Removal of that persisted compatibility shape requires verified inventory across every supported environment.

Branch is optional while configuring or creating from a non-empty Git repository. When omitted, the remote symbolic `HEAD` is resolved and the resulting branch is persisted. An empty repository has no default branch, so its branch must be supplied explicitly; NocoBase does not guess `main` or another branch name.

Git Remote reuses `SERVER_REQUEST_WHITELIST` for outbound host policy. It rejects local paths, `file://`, `git://`, custom remote helpers, symlinks, gitlinks/submodules, Git LFS pointers, binary files, and invalid UTF-8. Repository content is handled as source snapshots and is never checked out or executed.

Official runtime images include Git and CA certificates. Non-Docker deployments must provide `git` and a trusted CA certificate store in the NocoBase service user's runtime environment.

## Asynchronous project creation

Starter, ZIP, and Git creation are accepted as durable background jobs. `jsTemplateProjects:create` handles starter or ZIP input, and `jsTemplateSync:createFromGit` handles Git input; both return HTTP 202 with a safe creation-job summary.

Every creation request requires a stable `idempotencyKey`. Repeating the same request with the same key returns the existing job/result; reusing the key with different input is rejected. Clients must retain the key across retries rather than generate a new value for each attempt.

`jsTemplateCreateJobs:list` and `jsTemplateCreateJobs:dismiss` are the public job API. A visible job is `pending`, `running`, `succeeded`, or `failed`. Acceptance only confirms persistence. The list returns every active (`pending` or `running`) job for the current application and user, plus at most the newest 20 terminal (`succeeded` or `failed`) jobs in stable newest-first order. Successful jobs retain their safe `resultProjectId`. A user can dismiss a terminal job explicitly; active jobs cannot be dismissed.

The database job is the execution source of truth. Queue messages only wake a runner; startup and periodic scans claim pending or expired jobs with fenced leases and heartbeats. A ready Project carrying the matching creation marker is recovered as succeeded after a crash and is never deleted as failed cleanup. If failed-creation cleanup itself fails, the job remains `running` with its payload, reservation, claim, and lease intact. After the lease expires, a scanner can reclaim the job and repeat the normal execute/cleanup contract; only successful cleanup allows the job to become `failed`. A failed wake-up publish does not change the HTTP 202 response because the scanner still processes the durable job.

The UI closes the creation dialog after acceptance and shows all four states in a separate creation-status area. It polls every 2.5 seconds while an active job exists and retries an initial list error, but stops polling when the list is empty or terminal-only. Another tab observes a terminal dismissal after its own refresh or reload; permanent terminal polling is not a cross-tab synchronization mechanism. Success refreshes from `resultProjectId`, and failure remains visible with a safe error until dismissal or bounded-history pruning. Public summaries never expose source payloads, credentials, actor/request identity, claim tokens, owners, leases, or heartbeats.

Create jobs are operational state, not the audit log. For each application and user, the database retains only the newest 100 terminal jobs; pruning runs after a committed success or failure, never removes active jobs, and is retried by later terminal transitions if it fails. The Audit Service retains the independent lifecycle evidence.

## Operational guarantees

- Failed saves and conversion operations are transactional
- Revert a successful source version by saving the desired historical source as a new commit
- Grant authoring ACL separately from runtime access, then verify Check, Save as JS Template, Detach to Inline, ZIP, Git, and bound runtime resolution
